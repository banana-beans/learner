import { Snippet } from "./types";

export const pythonFinanceSnippets20260625B1: Snippet[] = [
  {
    id: "pyfin-20260625-b1-garch",
    language: "python",
    title: "GARCH(1,1) Volatility Estimation",
    tag: "volatility",
    code: `from arch import arch_model
import numpy as np
import pandas as pd

# Daily log returns (percent scale works best for arch library)
returns = pd.Series(np.random.randn(1000) * 0.01)
returns_pct = returns * 100  # arch models in percent returns

model = arch_model(returns_pct, vol="Garch", p=1, q=1, dist="Normal")
result = model.fit(disp="off")

omega = result.params["omega"]
alpha = result.params["alpha[1]"]
beta  = result.params["beta[1]"]

# Long-run variance: omega / (1 - alpha - beta)
lr_var = omega / (1 - alpha - beta)
lr_vol_annualized = np.sqrt(lr_var / 10000 * 252)

# One-step-ahead conditional vol forecast
forecast = result.forecast(horizon=1)
h1 = forecast.variance.iloc[-1, 0]   # in pct^2
vol_1d = np.sqrt(h1) / 100           # daily vol as fraction

print(f"alpha={alpha:.4f}, beta={beta:.4f}, persistence={alpha+beta:.4f}")
print(f"Long-run annual vol: {lr_vol_annualized:.2%}")
print(f"1-day ahead vol:     {vol_1d:.4f}")`,
    explanation: "GARCH(1,1) separates volatility into long-run mean-reversion (omega), recent shock sensitivity (alpha), and persistence (beta); alpha+beta near 1 means volatility shocks die slowly — typical of equity indices.",
  },
  {
    id: "pyfin-20260625-b1-nelson-siegel-svensson",
    language: "python",
    title: "Nelson-Siegel-Svensson Yield Curve",
    tag: "fixed income",
    code: `import numpy as np
from scipy.optimize import minimize

def nss(t, b0, b1, b2, b3, tau1, tau2):
    """Nelson-Siegel-Svensson 4-factor yield curve."""
    e1 = np.exp(-t / tau1)
    e2 = np.exp(-t / tau2)
    f1 = (1 - e1) / (t / tau1)
    f2 = (1 - e2) / (t / tau2)
    return b0 + b1 * f1 + b2 * (f1 - e1) + b3 * (f2 - e2)

# Synthetic US Treasury par yields
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
observed   = np.array([5.30, 5.20, 5.00, 4.70, 4.55, 4.35, 4.30, 4.25, 4.45, 4.40]) / 100

def loss(params):
    b0, b1, b2, b3, tau1, tau2 = params
    if tau1 <= 0 or tau2 <= 0 or tau1 == tau2:
        return 1e10
    fitted = nss(maturities, b0, b1, b2, b3, tau1, tau2)
    return np.sum((fitted - observed) ** 2)

x0 = [0.04, -0.02, 0.01, 0.01, 2.0, 10.0]
res = minimize(loss, x0, method="Nelder-Mead",
               options={"maxiter": 10000, "xatol": 1e-8})

b0, b1, b2, b3, tau1, tau2 = res.x
print(f"beta0 (long rate)  = {b0:.4f}")
print(f"beta1 (slope)      = {b1:.4f}")
print(f"Hump tau1={tau1:.2f}, Curvature tau2={tau2:.2f}")

dense_t = np.linspace(0.25, 30, 200)
curve   = nss(dense_t, *res.x)`,
    explanation: "NSS adds a second hump (b3, tau2) to Nelson-Siegel to fit both the short-end kink and the 20-30y belly simultaneously; tau1 controls hump location and tau2 governs the long-end curvature.",
  },
  {
    id: "pyfin-20260625-b1-copula-var",
    language: "python",
    title: "Gaussian Copula Portfolio VaR",
    tag: "risk",
    code: `import numpy as np
from scipy import stats

np.random.seed(42)
n_assets   = 5
n_sims     = 100_000
confidence = 0.99

# Per-asset daily vol and pairwise correlation
vols = np.array([0.20, 0.25, 0.18, 0.30, 0.22]) / np.sqrt(252)
corr = np.array([
    [1.00, 0.60, 0.30, 0.50, 0.40],
    [0.60, 1.00, 0.25, 0.45, 0.35],
    [0.30, 0.25, 1.00, 0.20, 0.15],
    [0.50, 0.45, 0.20, 1.00, 0.55],
    [0.40, 0.35, 0.15, 0.55, 1.00],
])
weights = np.array([0.25, 0.20, 0.20, 0.15, 0.20])

# Gaussian copula: draw correlated uniforms via multivariate normal
L    = np.linalg.cholesky(corr)
z    = np.random.randn(n_sims, n_assets) @ L.T  # correlated N(0,1)
u    = stats.norm.cdf(z)                         # uniform marginals

# Apply t(5) marginal to each asset (heavier tails than normal)
df   = 5
x    = stats.t.ppf(u, df) * vols * np.sqrt(df / (df - 2))

# Portfolio P&L
pnl  = x @ weights
pnl_sorted = np.sort(pnl)

var_99 = -np.percentile(pnl_sorted, (1 - confidence) * 100)
es_99  = -pnl_sorted[pnl_sorted <= -var_99].mean()
print(f"1-day 99% VaR: {var_99:.4%}")
print(f"1-day 99% ES:  {es_99:.4%}")`,
    explanation: "Gaussian copula separates the dependency structure (correlation matrix) from marginal distributions; using t(5) marginals while keeping Gaussian copula gives fatter individual tails without inflating joint tail dependence like a full multivariate-t would.",
  },
  {
    id: "pyfin-20260625-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model Market Regimes",
    tag: "regime detection",
    code: `import numpy as np
from hmmlearn import hmm

np.random.seed(0)
# Simulate 2-regime returns: low-vol bull, high-vol bear
bull = np.random.normal(0.0005, 0.008, 600)
bear = np.random.normal(-0.001, 0.022, 400)
returns = np.concatenate([bull, bear, bull[:200]])
returns = returns.reshape(-1, 1)

# Features: return level + absolute return (proxy for vol)
features = np.hstack([returns, np.abs(returns)])

model = hmm.GaussianHMM(n_components=2, covariance_type="full",
                         n_iter=200, random_state=42)
model.fit(features)
hidden_states = model.predict(features)

for s in range(2):
    mask = hidden_states == s
    r    = returns[mask, 0]
    print(f"State {s}: mean={r.mean():.4f}  vol={r.std():.4f}  n={mask.sum()}")

# Transition matrix: row = from, col = to
print("\\nTransition matrix:")
print(model.transmat_.round(3))

# One-step regime probability forecast
log_prob, posteriors = model.score_samples(features)
print(f"\\nFinal regime posteriors: {posteriors[-1].round(3)}")`,
    explanation: "HMM infers latent regimes from observable features without requiring labeled training data; the transition matrix quantifies regime persistence — a diagonal near 0.98 means regimes typically last ~50 days.",
  },
  {
    id: "pyfin-20260625-b1-cds-bootstrap",
    language: "python",
    title: "CDS Hazard Rate Bootstrapping",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard(tenors, par_spreads, recovery=0.40, r=0.05):
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    tenors: [1, 2, 3, 5, 7, 10] in years
    par_spreads: annual spread in decimal (e.g. 0.01 = 100bps)
    """
    dt      = 0.25          # quarterly coupon frequency
    hazards = []
    h_prev  = []
    t_prev  = []

    for k, (T, S) in enumerate(zip(tenors, par_spreads)):
        # PV01 and loss leg, piecewise hazard up to T
        def pv(h_k):
            hs = h_prev + [h_k]
            ts = t_prev + [T]
            pv01 = 0.0
            loss = 0.0
            t    = 0.0
            q    = 1.0  # survival prob at t=0
            while t < T - 1e-9:
                t_end = min(t + dt, T)
                # which piecewise segment?
                idx   = next(i for i, ti in enumerate(ts) if ti > t)
                h     = hs[idx]
                tau   = t_end - t
                df    = np.exp(-r * t_end)
                q_end = q * np.exp(-h * tau)
                # protection leg (loss given default in interval)
                pd    = q - q_end
                loss += (1 - recovery) * df * pd
                # premium leg (coupon on surviving notional)
                pv01 += dt * df * (q + q_end) / 2
                q     = q_end
                t     = t_end
            return S * pv01 - loss

        h_k = brentq(pv, 1e-6, 5.0)
        hazards.append(h_k)
        h_prev.append(h_k)
        t_prev.append(T)

    return hazards

tenors      = [1, 2, 3, 5, 7, 10]
par_spreads = [0.0050, 0.0080, 0.0110, 0.0150, 0.0170, 0.0200]
hazards = bootstrap_hazard(tenors, par_spreads)
for t, h in zip(tenors, hazards):
    print(f"T={t:2d}y  h={h:.4f}  ({h*10000:.1f}bps)")`,
    explanation: "Bootstrapping strips each CDS tenor sequentially: hazard rates from shorter maturities are fixed when pricing longer ones, so the Brent solver only searches one unknown per tenor — the same logic as stripping a zero-coupon curve.",
  },
  {
    id: "pyfin-20260625-b1-mv-frontier",
    language: "python",
    title: "Mean-Variance Efficient Frontier",
    tag: "portfolio",
    code: `import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

np.random.seed(7)
n  = 5
mu = np.array([0.10, 0.12, 0.08, 0.15, 0.09])   # annual expected returns
# Random positive-definite covariance
A  = np.random.randn(n, n) * 0.05
Sigma = A.T @ A + np.diag([0.04, 0.06, 0.03, 0.08, 0.04])

def min_var_portfolio(target_return, mu, Sigma):
    """Lagrangian closed form for minimum-variance at target return."""
    ones = np.ones(n)
    inv  = np.linalg.inv(Sigma)
    A11  = ones @ inv @ ones
    A12  = ones @ inv @ mu
    A22  = mu   @ inv @ mu
    D    = A11 * A22 - A12 ** 2
    lam1 = (A22 - A12 * target_return) / D
    lam2 = (A11 * target_return - A12) / D
    w    = inv @ (lam1 * ones + lam2 * mu)
    return w

targets = np.linspace(mu.min(), mu.max(), 200)
vols, rets = [], []
for r in targets:
    w = min_var_portfolio(r, mu, Sigma)
    vols.append(np.sqrt(w @ Sigma @ w))
    rets.append(w @ mu)

# Global minimum variance point
gmv_idx = int(np.argmin(vols))
print(f"GMV: return={rets[gmv_idx]:.2%}, vol={vols[gmv_idx]:.2%}")

fig, ax = plt.subplots()
ax.plot(vols, rets, label="Efficient Frontier")
ax.scatter([vols[gmv_idx]], [rets[gmv_idx]], color="red", zorder=5, label="GMV")
ax.set_xlabel("Volatility"); ax.set_ylabel("Return")
ax.legend(); plt.tight_layout()
plt.savefig("/tmp/frontier.png", dpi=72)`,
    explanation: "The closed-form Lagrangian solution (two-fund separation) is exact and O(n³) — no convex solver needed; the global minimum-variance portfolio is the leftmost point and anchors the efficient (upper) half of the frontier.",
  },
  {
    id: "pyfin-20260625-b1-implied-vol",
    language: "python",
    title: "Black-Scholes Implied Volatility (Newton-Raphson)",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def bs_vega(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return S * norm.pdf(d1) * np.sqrt(T)

def implied_vol(market_price, S, K, T, r,
                sigma0=0.25, max_iter=50, tol=1e-8):
    """Newton-Raphson implied vol solver with bounds clamping."""
    sigma = sigma0
    for _ in range(max_iter):
        price = bs_call(S, K, T, r, sigma)
        vega  = bs_vega(S, K, T, r, sigma)
        diff  = price - market_price
        if abs(diff) < tol:
            return sigma
        if vega < 1e-12:
            break
        sigma -= diff / vega
        sigma  = max(0.001, min(sigma, 10.0))  # stay in valid range
    return sigma  # best estimate

# Example: near-the-money call
S, K, T, r = 100.0, 105.0, 0.5, 0.05
true_sigma  = 0.2345
mkt_price   = bs_call(S, K, T, r, true_sigma)
iv = implied_vol(mkt_price, S, K, T, r)
print(f"Market price: {mkt_price:.4f}")
print(f"Implied vol:  {iv:.6f}  (true={true_sigma})")

# Vol smile: solve across strikes
strikes  = np.linspace(80, 120, 9)
prices   = [bs_call(S, k, T, r, 0.20 + 0.15 * ((k/S - 1)**2)) for k in strikes]
ivs      = [implied_vol(p, S, k, T, r) for p, k in zip(prices, strikes)]
for k, iv in zip(strikes, ivs):
    print(f"K={k:5.0f}  IV={iv:.4f}")`,
    explanation: "Newton-Raphson converges in 3-5 iterations for near-the-money options because vega is large; the vol clamp [0.001, 10] prevents the step from overshooting into a region where Black-Scholes becomes numerically degenerate.",
  },
  {
    id: "pyfin-20260625-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Hedge Ratio for Pairs Trading",
    tag: "stat arb",
    code: `import numpy as np

class KalmanHedge:
    """
    State: [beta, alpha] where y = beta*x + alpha + eps
    State transitions as random walk: state[t] = state[t-1] + w
    """
    def __init__(self, delta=1e-4, R=1e-2):
        self.delta = delta          # state noise (how fast beta drifts)
        self.R     = R              # observation noise variance
        self.C     = np.zeros((2, 2))  # state covariance
        self.beta  = np.zeros(2)    # [beta, alpha]

    def update(self, x, y):
        F = np.array([x, 1.0])     # observation matrix
        # Predict
        Q        = self.delta / (1 - self.delta) * np.eye(2)
        C_pred   = self.C + Q
        # Innovation
        yhat     = F @ self.beta
        S        = F @ C_pred @ F + self.R
        K        = C_pred @ F / S  # Kalman gain
        # Update state
        self.beta = self.beta + K * (y - yhat)
        self.C    = (np.eye(2) - np.outer(K, F)) @ C_pred
        spread    = y - yhat        # pre-update residual
        std_spread = np.sqrt(S)
        return spread, std_spread, self.beta.copy()

np.random.seed(1)
n    = 500
x    = np.cumsum(np.random.randn(n)) + 100
beta_true = 0.8 + np.cumsum(np.random.randn(n) * 0.005)
y    = beta_true * x + 2.0 + np.random.randn(n) * 0.5

kf   = KalmanHedge(delta=1e-4, R=0.25)
spreads, stds, betas = [], [], []
for xi, yi in zip(x, y):
    sp, sd, b = kf.update(xi, yi)
    spreads.append(sp); stds.append(sd); betas.append(b[0])

z_scores = np.array(spreads) / np.array(stds)
signals  = np.where(z_scores > 2, -1, np.where(z_scores < -2, 1, 0))
print(f"Final beta estimate: {betas[-1]:.4f} (true: {beta_true[-1]:.4f})")
print(f"Signal distribution: {np.unique(signals, return_counts=True)}")`,
    explanation: "Treating the hedge ratio as a random-walk state lets the Kalman filter track slow structural shifts in the cointegrating relationship; the innovation variance S is the natural normalization for z-scores, giving signal entries that adapt to changing regime volatility.",
  },
  {
    id: "pyfin-20260625-b1-rf-alpha",
    language: "python",
    title: "Random Forest Cross-Sectional Alpha",
    tag: "factor models",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit

np.random.seed(42)
n_stocks, n_periods = 100, 60

# Simulate cross-sectional factors and forward returns
momentum  = np.random.randn(n_periods, n_stocks)
value     = np.random.randn(n_periods, n_stocks)
quality   = np.random.randn(n_periods, n_stocks)
# True alpha: 0.3*mom + 0.2*val - 0.1*qual + noise
fwd_ret   = 0.3 * momentum + 0.2 * value - 0.1 * quality
fwd_ret  += np.random.randn(n_periods, n_stocks) * 0.05
# 1-period forward shift
fwd_ret   = np.roll(fwd_ret, -1, axis=0)

records = []
for t in range(n_periods - 1):
    for s in range(n_stocks):
        records.append({
            "t": t, "stock": s,
            "mom": momentum[t, s], "val": value[t, s], "qual": quality[t, s],
            "y": fwd_ret[t, s],
        })
df = pd.DataFrame(records)

# Walk-forward training (time-series cross-validation)
tscv   = TimeSeriesSplit(n_splits=5)
times  = df["t"].values
preds  = np.zeros(len(df))

rf = RandomForestRegressor(n_estimators=100, max_depth=4,
                            min_samples_leaf=20, random_state=0)
for train_idx, test_idx in tscv.split(np.unique(times)):
    train_times = np.unique(times)[train_idx]
    test_times  = np.unique(times)[test_idx]
    tr   = df[df["t"].isin(train_times)]
    te   = df[df["t"].isin(test_times)]
    X_tr = tr[["mom", "val", "qual"]].values
    X_te = te[["mom", "val", "qual"]].values
    rf.fit(X_tr, tr["y"].values)
    preds[df["t"].isin(test_times)] = rf.predict(X_te)

ic = df["y"].corr(pd.Series(preds, index=df.index))
print(f"IC (information coefficient): {ic:.4f}")
print(f"Feature importance: {dict(zip(['mom','val','qual'], rf.feature_importances_.round(3)))}")`,
    explanation: "Walk-forward time-series CV prevents look-ahead bias that k-fold introduces for panel data; IC (rank correlation of predicted vs realized) is the standard alphamodel metric — a consistent IC above 0.05 is considered strong in practice.",
  },
  {
    id: "pyfin-20260625-b1-sabr-calib",
    language: "python",
    title: "SABR Model Calibration via SciPy",
    tag: "options",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """Hagan 2002 SABR implied vol approximation."""
    if abs(F - K) < 1e-10:
        # ATM formula
        logFK = 0.0
        z     = 0.0
    else:
        logFK = np.log(F / K)
        FK_mid = (F * K) ** ((1 - beta) / 2)
        z      = (nu / alpha) * FK_mid * logFK

    FK_mid = (F * K) ** ((1 - beta) / 2)
    if abs(z) > 1e-10:
        x  = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
        zx = z / x
    else:
        zx = 1.0

    A = alpha / (FK_mid * (1 + ((1-beta)**2/24) * logFK**2
                             + ((1-beta)**4/1920) * logFK**4))
    B = 1 + T * (((1-beta)**2/24) * alpha**2 / FK_mid**2
                  + 0.25 * rho * beta * nu * alpha / FK_mid
                  + (2 - 3*rho**2) / 24 * nu**2)
    return A * zx * B

# Synthetic market: smile around F=100, T=1y
F    = 100.0
T    = 1.0
beta = 0.5  # fixed (controls backbone shape)
strikes = np.array([80, 90, 95, 100, 105, 110, 120], dtype=float)
# "Market" vols from true params alpha=0.3, rho=-0.3, nu=0.4
true_params = (0.3, -0.3, 0.4)
mkt_vols = np.array([sabr_vol(F, k, T, true_params[0], beta,
                               true_params[1], true_params[2])
                      for k in strikes])

def obj(params):
    a, r, n = params
    if not (-0.999 < r < 0.999) or a <= 0 or n <= 0:
        return 1e10
    fitted = np.array([sabr_vol(F, k, T, a, beta, r, n) for k in strikes])
    return np.sum((fitted - mkt_vols)**2)

res = minimize(obj, [0.25, -0.2, 0.5], method="Nelder-Mead",
               options={"xatol": 1e-9, "fatol": 1e-12, "maxiter": 5000})
a, r, n = res.x
print(f"Calibrated: alpha={a:.4f}, rho={r:.4f}, nu={n:.4f}")
print(f"True:       alpha=0.3000, rho=-0.3000, nu=0.4000")`,
    explanation: "Beta is typically fixed by convention (0 for rates stochastic-normal, 0.5 for CEV-like equity) then the remaining three SABR parameters are calibrated to the smile; rho controls skew (negative for equities) and nu controls convexity of the smile.",
  },
  {
    id: "pyfin-20260625-b1-var-swap",
    language: "python",
    title: "Variance Swap Fair Value via Replication",
    tag: "volatility",
    code: `import numpy as np
from scipy.integrate import quad
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

def variance_swap_strike(S0, T, r, vol_surface_fn, F=None):
    """
    Britten-Jones & Neuberger replication:
    K_var = (2/T) * [ integral_0^F put(K)/K^2 dK + integral_F^inf call(K)/K^2 dK ]
    where vol_surface_fn(K) returns the implied vol at strike K.
    """
    if F is None:
        F = S0 * np.exp(r * T)

    def put_integrand(K):
        sigma = vol_surface_fn(K)
        return bs_put(S0, K, T, r, sigma) / K**2

    def call_integrand(K):
        sigma = vol_surface_fn(K)
        return bs_call(S0, K, T, r, sigma) / K**2

    I_put,  _ = quad(put_integrand,  1e-4, F,        limit=200)
    I_call, _ = quad(call_integrand, F,    S0 * 5.0, limit=200)
    K_var = (2 / T) * (I_put + I_call)
    return K_var

# Flat smile (variance swap = realized vol^2)
sigma_flat = 0.20
K_var_flat = variance_swap_strike(
    S0=100, T=1.0, r=0.05,
    vol_surface_fn=lambda K: sigma_flat
)
print(f"Flat vol={sigma_flat:.0%}  -> K_var={K_var_flat:.6f}  (expected={sigma_flat**2:.6f})")

# Skewed smile
def skewed_smile(K, S=100, atm=0.20, skew=-0.05):
    return atm + skew * (np.log(K/S))

K_var_skew = variance_swap_strike(
    S0=100, T=1.0, r=0.05, vol_surface_fn=skewed_smile
)
print(f"Skewed smile -> K_var={K_var_skew:.6f}  (sqrt={np.sqrt(K_var_skew):.4f})")`,
    explanation: "Model-free variance swap replication integrates out-of-the-money option prices over the entire strike continuum; a volatility skew (puts more expensive than calls) increases the variance strike above ATM implied vol squared.",
  },
  {
    id: "pyfin-20260625-b1-evt-pot",
    language: "python",
    title: "EVT Peaks-over-Threshold Tail Risk",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

np.random.seed(5)
# Simulate fat-tailed daily P&L losses (positive = loss)
pnl    = np.random.standard_t(df=4, size=2000) * 0.01
losses = -pnl                                   # sign flip: losses are positive

# Choose threshold at 90th percentile of losses
u      = np.percentile(losses, 90)
excess = losses[losses > u] - u

# Fit Generalized Pareto Distribution to excesses
xi, loc, scale = genpareto.fit(excess, floc=0)  # loc fixed to 0 for GPD
print(f"GPD shape xi={xi:.4f}, scale={scale:.6f}")
print(f"Threshold u={u:.4f}, n_excess={len(excess)}, n_total={len(losses)}")

n  = len(losses)
Nu = len(excess)

def var_evt(p):
    """EVT-based VaR at probability p (e.g. 0.99)."""
    ratio  = n / Nu
    z      = u + (scale / xi) * ((ratio * (1 - p)) ** (-xi) - 1)
    return z

def es_evt(p):
    """EVT Expected Shortfall."""
    v      = var_evt(p)
    excess_var = v - u
    es     = v / (1 - xi) + (scale - xi * u) / (1 - xi)
    return es

for conf in [0.99, 0.995, 0.999]:
    v = var_evt(conf)
    e = es_evt(conf)
    print(f"{conf:.1%}  VaR={v:.4f}  ES={e:.4f}")`,
    explanation: "EVT/POT fits only the tail exceedances (not the whole distribution), making it far more data-efficient than historical methods for extreme quantiles; a positive shape parameter xi > 0 indicates a heavy-tailed Pareto-type distribution where moments beyond 1/xi are infinite.",
  },
  {
    id: "pyfin-20260625-b1-vasicek-credit",
    language: "python",
    title: "Vasicek One-Factor Credit Model (CDO Tranche Pricing)",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm

def vasicek_pd_conditional(pd_idio, rho, M):
    """Conditional default probability given systematic factor M~N(0,1)."""
    N_inv_pd = norm.ppf(pd_idio)
    return norm.cdf((N_inv_pd - np.sqrt(rho) * M) / np.sqrt(1 - rho))

def loss_distribution(n_obligors, pd, rho, lgd=0.6, n_points=2001):
    """
    Large homogeneous portfolio (LHP) approximation:
    Integrate over systematic factor M to get portfolio loss CDF.
    """
    M_grid = np.linspace(-5, 5, n_points)
    dm     = M_grid[1] - M_grid[0]

    # For each M, conditional expected portfolio loss
    cond_pd  = vasicek_pd_conditional(pd, rho, M_grid)
    # In LHP limit, fraction defaulted = cond_pd exactly
    loss_frac = cond_pd * lgd  # loss as fraction of notional

    # PDF of M is standard normal
    phi_M    = norm.pdf(M_grid)
    # CDF of loss: P(L <= l) = P(loss_frac(M) <= l)
    # loss_frac is monotone decreasing in M (higher M -> less default)
    # so CDF(l) = P(M >= M*(l)) = 1 - N(M*(l)/1)
    loss_sorted_idx = np.argsort(loss_frac)
    ls  = loss_frac[loss_sorted_idx]
    ps  = (phi_M[loss_sorted_idx] * dm).cumsum()

    return ls, ps

pd   = 0.02   # unconditional PD per obligor
rho  = 0.15   # asset correlation
lgd  = 0.60   # loss given default

ls, ps = loss_distribution(n_obligors=125, pd=pd, rho=rho, lgd=lgd)

# Expected tranche losses for equity [0-3%] and mezzanine [3-7%]
def tranche_loss(ls, ps, attach, detach):
    """Expected tranche loss via numerical integration."""
    dp   = np.diff(ps, prepend=0)
    clip = np.clip(ls - attach, 0, detach - attach)
    return (clip * dp).sum() / (detach - attach)

eq  = tranche_loss(ls, ps, 0.00, 0.03)
mez = tranche_loss(ls, ps, 0.03, 0.07)
print(f"Equity [0-3%]   EL = {eq:.4%}")
print(f"Mezzanine[3-7%] EL = {mez:.4%}")

q99 = ls[np.searchsorted(ps, 0.99)]
print(f"99th percentile portfolio loss: {q99:.4%}")`,
    explanation: "Vasicek's single-factor model maps each obligor's default to a common systematic factor (M); high correlation rho concentrates losses (equity tranches become riskier, senior tranches safer) while low rho gives near-actuarial averaging.",
  },
  {
    id: "pyfin-20260625-b1-market-impact",
    language: "python",
    title: "Square-Root Market Impact Model",
    tag: "execution",
    code: `import numpy as np

def temporary_impact(q, sigma, adv, eta=0.1):
    """
    Almgren-Chriss temporary impact: eta * sigma * sqrt(|q| / adv)
    q:     trade size (shares)
    sigma: daily vol (as fraction)
    adv:   average daily volume (shares)
    Returns: cost per share as fraction of price
    """
    return eta * sigma * np.sqrt(np.abs(q) / adv)

def permanent_impact(q, sigma, adv, gamma=0.05):
    """Linear permanent impact: gamma * sigma * (q / adv)."""
    return gamma * sigma * (q / adv)

def twap_cost(total_q, n_slices, sigma, adv, eta=0.1, gamma=0.05):
    """
    TWAP execution: split total_q equally into n_slices trades.
    Permanent impact is path-independent, accumulates once.
    Temporary impact paid on each slice.
    """
    q_per_slice  = total_q / n_slices
    temp_cost    = n_slices * temporary_impact(q_per_slice, sigma, adv, eta)
    perm_cost    = permanent_impact(total_q, sigma, adv, gamma)
    total_cost   = temp_cost + perm_cost
    return temp_cost, perm_cost, total_cost

# Compare: urgent (1 slice) vs patient (50 slices)
sigma = 0.02   # 2% daily vol
adv   = 1_000_000
total_q = 100_000  # 10% of ADV

print(f"{'Slices':>8} {'Temp Cost':>12} {'Perm Cost':>12} {'Total bps':>12}")
for n in [1, 5, 10, 20, 50]:
    tc, pc, tot = twap_cost(total_q, n, sigma, adv)
    print(f"{n:>8} {tc*10000:>11.2f}bp {pc*10000:>11.2f}bp {tot*10000:>11.2f}bp")

# Optimal execution: AC formula trades off market impact vs timing risk
# Optimal rate v* minimises 0.5*gamma*sigma^2*T^2 + eta*sigma*sqrt(v*T)
# Qualitative insight: large orders need slow execution (high eta)
print("\\nUrgency cost: splitting into more slices reduces temp but keeps perm fixed")`,
    explanation: "The square-root law (temp impact ∝ sqrt(participation rate)) is empirically robust across asset classes; its key implication is that doubling order size costs 4× in temporary impact per share, which is why institutional desks break large orders into many small slices.",
  },
  {
    id: "pyfin-20260625-b1-bs-dividends",
    language: "python",
    title: "Black-Scholes with Discrete Dividends",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm

def pv_dividends(divs, r, t0=0.0):
    """PV of discrete dividends: list of (ex_date, amount) tuples."""
    return sum(d * np.exp(-r * (t - t0)) for t, d in divs if t > t0)

def bs_call_discrete_div(S, K, T, r, sigma, dividends):
    """
    Bos-Vandermark approximation: subtract PV of future dividends
    from spot, adjust vol to keep variance correct.
    """
    D   = pv_dividends(dividends, r)
    S_  = S - D                        # dividend-adjusted spot

    # Adjust sigma: vol applies to the 'growth' component only
    # Simple approach: scale vol by S_/S (conservative)
    sigma_ = sigma * S_ / S

    if S_ <= 0:
        raise ValueError("PV of dividends exceeds spot price")

    d1 = (np.log(S_ / K) + (r + 0.5 * sigma_**2) * T) / (sigma_ * np.sqrt(T))
    d2 = d1 - sigma_ * np.sqrt(T)
    return S_ * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def bs_put_discrete_div(S, K, T, r, sigma, dividends):
    c = bs_call_discrete_div(S, K, T, r, sigma, dividends)
    D = pv_dividends(dividends, r)
    # Put-call parity: C - P = S - D - K*exp(-rT)
    return c - (S - D) + K * np.exp(-r * T)

# Example: stock pays $2 dividend in 3 months, $2.5 in 9 months
S, K, T, r, sigma = 100.0, 100.0, 1.0, 0.05, 0.25
dividends = [(0.25, 2.0), (0.75, 2.5)]

c_nodiv  = __import__("scipy.stats", fromlist=["norm"]).norm  # placeholder
# Proper no-div call for comparison
d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
d2 = d1 - sigma*np.sqrt(T)
c_no_div = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

c_div = bs_call_discrete_div(S, K, T, r, sigma, dividends)
p_div = bs_put_discrete_div(S, K, T, r, sigma, dividends)

print(f"Call (no dividends):       {c_no_div:.4f}")
print(f"Call (discrete dividends): {c_div:.4f}")
print(f"Put  (discrete dividends): {p_div:.4f}")
print(f"Dividend drag: {c_no_div - c_div:.4f}")`,
    explanation: "Subtracting the PV of future dividends from spot (Bos-Vandermark) is more accurate than the continuous dividend yield approximation for single-stock options with known cash dividends; the volatility rescaling preserves total variance through the dividend date.",
  },
  {
    id: "pyfin-20260625-b1-cap-pricing",
    language: "python",
    title: "IR Cap Pricing via Black's Formula",
    tag: "fixed income",
    code: `import numpy as np
from scipy.stats import norm

def black_caplet(F, K, T_set, T_pay, r, sigma, notional=1.0, tau=0.25):
    """
    Black caplet: pays tau * max(L(T_set) - K, 0) at T_pay.
    F:      forward LIBOR rate for [T_set, T_pay]
    K:      cap strike rate
    T_set:  fixing date (in years)
    T_pay:  payment date
    sigma:  lognormal vol of forward rate
    """
    d1 = (np.log(F / K) + 0.5 * sigma**2 * T_set) / (sigma * np.sqrt(T_set))
    d2 = d1 - sigma * np.sqrt(T_set)
    df = np.exp(-r * T_pay)
    return notional * tau * df * (F * norm.cdf(d1) - K * norm.cdf(d2))

def black_cap(F_list, K, tenors, r, sigma_list, notional=1e6, tau=0.25):
    """
    Cap = sum of caplets on quarterly LIBOR resets.
    tenors:   [(T_set, T_pay), ...]
    F_list:   forward rate for each period
    sigma_list: flat or term vol for each period
    """
    total = 0.0
    for (T_set, T_pay), F, sigma in zip(tenors, F_list, sigma_list):
        if T_set <= 0:  # skip settled caplets
            continue
        total += black_caplet(F, K, T_set, T_pay, r, sigma, notional, tau)
    return total

# 2-year quarterly cap, struck at 5%
K       = 0.05
r       = 0.045           # flat discount rate
tenors  = [(i*0.25, (i+1)*0.25) for i in range(1, 9)]  # 3m to 2y
# Forward rates: upward sloping curve
F_list  = [0.046, 0.048, 0.050, 0.052, 0.053, 0.054, 0.055, 0.056]
sigma_list = [0.25] * 8   # flat vol surface

cap_pv  = black_cap(F_list, K, tenors, r, sigma_list, notional=1_000_000)
print(f"2-year cap PV: \${cap_pv:,.2f}")

# Sensitivity to vol (vega of cap)
eps = 0.01
cap_hi = black_cap(F_list, K, tenors, r, [s+eps for s in sigma_list])
cap_lo = black_cap(F_list, K, tenors, r, [s-eps for s in sigma_list])
vega   = (cap_hi - cap_lo) / (2 * eps)
print(f"Cap vega (\$1bp shift): \${vega/100:,.0f}")`,
    explanation: "A cap is a portfolio of caplets priced independently under Black's model because each caplet depends only on its own forward rate; the flat vol 'surface' used here is a simplification — in practice each caplet uses its own implied vol from the vol surface (caplet stripping).",
  },
  {
    id: "pyfin-20260625-b1-cvxpy-opt",
    language: "python",
    title: "CVXPY Sector-Constrained Portfolio Optimization",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

np.random.seed(3)
n_assets = 20

# Generate alpha signal, covariance, sector assignments
mu    = np.random.randn(n_assets) * 0.02 + 0.001
A     = np.random.randn(n_assets, n_assets) * 0.1
Sigma = A.T @ A / n_assets + np.eye(n_assets) * 0.005

sectors = np.array([0]*5 + [1]*5 + [2]*5 + [3]*5)  # 4 sectors, 5 stocks each

w = cp.Variable(n_assets)

# Objective: maximize alpha - lambda * variance
lam    = 10.0
port_var   = cp.quad_form(w, Sigma)
port_alpha = mu @ w
objective  = cp.Maximize(port_alpha - lam * port_var)

constraints = [
    cp.sum(w) == 1,              # fully invested
    w >= -0.05,                  # allow modest short (max 5%)
    w <= 0.15,                   # max 15% per stock
]

# Sector neutrality: each sector sum within [-5%, +5%]
for s in range(4):
    mask = sectors == s
    sector_w = w[mask]
    constraints += [cp.sum(sector_w) <= 0.05,
                    cp.sum(sector_w) >= -0.05]

# Turnover constraint (from flat 5% position each)
w0 = np.ones(n_assets) / n_assets
constraints += [cp.norm1(w - w0) <= 0.5]  # max 50% turnover

prob = cp.Problem(objective, constraints)
prob.solve(solver=cp.OSQP, verbose=False)

if prob.status == "optimal":
    w_opt = w.value
    print(f"Alpha:    {mu @ w_opt:.4%}")
    print(f"Sigma:    {np.sqrt(w_opt @ Sigma @ w_opt):.4%}")
    print(f"Sharpe:   {(mu @ w_opt) / np.sqrt(w_opt @ Sigma @ w_opt):.2f}")
    print(f"Turnover: {np.sum(np.abs(w_opt - w0)):.2%}")
    for s in range(4):
        mask = sectors == s
        print(f"Sector {s} weight: {w_opt[mask].sum():.2%}")`,
    explanation: "CVXPY's disciplined convex programming (DCP) guarantees the solver sees a proper convex program; sector neutrality as linear constraints prevents the optimizer from expressing spurious factor bets disguised as stock selection.",
  },
  {
    id: "pyfin-20260625-b1-factor-residual",
    language: "python",
    title: "Multi-Factor Alpha Residualization",
    tag: "factor models",
    code: `import numpy as np
import pandas as pd

np.random.seed(99)
n_stocks, n_periods = 200, 36

# Simulate factor returns and loadings
factors = {
    "market":   np.random.randn(n_periods) * 0.015,
    "size":     np.random.randn(n_periods) * 0.006,
    "value":    np.random.randn(n_periods) * 0.005,
    "momentum": np.random.randn(n_periods) * 0.007,
}
F = np.column_stack(list(factors.values()))  # (n_periods, n_factors)

# Factor loadings (betas) per stock
B = np.random.randn(n_stocks, len(factors))  # (n_stocks, n_factors)
B[:, 0] += 1.0  # market beta near 1

# Stock returns = B @ F.T + idiosyncratic noise
R = (B @ F.T).T + np.random.randn(n_periods, n_stocks) * 0.02  # (t, n)

# Raw alpha signal (e.g. from analyst or ML model)
raw_alpha = np.random.randn(n_stocks) * 0.001

def residualize(alpha, betas, factor_returns):
    """
    Project alpha onto factor space, subtract projection.
    Ensures the signal carries no systematic factor exposure.
    """
    # Cross-sectional OLS: alpha ~ B @ gamma + epsilon
    # gamma = (B'B)^{-1} B' alpha
    gamma = np.linalg.lstsq(betas, alpha, rcond=None)[0]
    factor_component = betas @ gamma
    return alpha - factor_component, gamma

resid_alpha, gammas = residualize(raw_alpha, B, F)

print("Factor exposures of raw alpha:")
for name, g in zip(factors.keys(), gammas):
    print(f"  {name:12s}: {g:.6f}")

print(f"\\nRaw alpha mean: {raw_alpha.mean():.6f}, std: {raw_alpha.std():.6f}")
print(f"Resid alpha mean: {resid_alpha.mean():.6f}, std: {resid_alpha.std():.6f}")

# Verify orthogonality
for j, name in enumerate(factors.keys()):
    cov = np.corrcoef(resid_alpha, B[:, j])[0, 1]
    print(f"Corr(resid, {name}): {cov:.2e}")`,
    explanation: "Residualizing an alpha signal against risk factors removes the part of the signal that merely reflects factor tilt (e.g. high-momentum stocks); what remains is pure idiosyncratic alpha that a market-neutral optimizer can act on without taking unintended factor risk.",
  },
  {
    id: "pyfin-20260625-b1-garch-var",
    language: "python",
    title: "GARCH VaR and Expected Shortfall",
    tag: "risk",
    code: `import numpy as np
from arch import arch_model
from scipy.stats import t as t_dist

np.random.seed(11)
n       = 1000
returns = np.random.randn(n) * 0.01
# Introduce a vol cluster
returns[300:350] *= 3.0
returns_pct = returns * 100

# Fit GARCH(1,1) with t-distributed innovations
model  = arch_model(returns_pct, vol="Garch", p=1, q=1, dist="t")
result = model.fit(disp="off")

nu     = result.params.get("nu", 8.0)      # degrees of freedom
omega  = result.params["omega"]
alpha1 = result.params["alpha[1]"]
beta1  = result.params["beta[1]"]

# Walk-forward VaR: use 1-step ahead conditional variance
h_t    = result.conditional_volatility.values**2  # in pct^2

# Quantile of scaled t distribution
conf   = 0.99
q_t    = t_dist.ppf(1 - conf, df=nu) * np.sqrt((nu - 2) / nu)

var_t  = -np.sqrt(h_t) / 100 * q_t   # back to fraction

# Expected Shortfall under t
alpha_ = 1 - conf
es_t   = (t_dist.pdf(t_dist.ppf(alpha_, df=nu), df=nu)
           / alpha_ * (nu + t_dist.ppf(alpha_, df=nu)**2) / (nu - 1))
es_t  *= np.sqrt(h_t) / 100

print(f"GARCH params: omega={omega:.4f}, alpha={alpha1:.4f}, beta={beta1:.4f}, nu={nu:.2f}")
print(f"Mean 1-day 99% VaR: {var_t.mean():.4%}")
print(f"Mean 1-day 99% ES:  {es_t.mean():.4%}")
print(f"Max stressed VaR:   {var_t.max():.4%}")`,
    explanation: "GARCH-VaR adapts the risk estimate daily via the conditional variance forecast, automatically widening during volatile periods; the t-distribution innovations (nu typically 5-8 for equity returns) add tail weight that normal GARCH underestimates.",
  },
  {
    id: "pyfin-20260625-b1-cir-model",
    language: "python",
    title: "CIR Short-Rate Model with Bond Pricing",
    tag: "fixed income",
    code: `import numpy as np
from scipy.integrate import odeint

def cir_bond_price(r0, kappa, theta, sigma, T):
    """
    Exact CIR zero-coupon bond price P(0,T) = A(T)*exp(-B(T)*r0).
    Feller condition: 2*kappa*theta > sigma^2 (rate stays positive).
    """
    gamma = np.sqrt(kappa**2 + 2 * sigma**2)
    exp_g = np.exp(gamma * T)

    B = 2 * (exp_g - 1) / ((gamma + kappa) * (exp_g - 1) + 2 * gamma)
    A = (2 * gamma * np.exp((kappa + gamma) * T / 2)
         / ((gamma + kappa) * (exp_g - 1) + 2 * gamma)) ** (2 * kappa * theta / sigma**2)
    return A * np.exp(-B * r0)

def cir_simulate(r0, kappa, theta, sigma, T, n_steps, n_paths):
    """
    Exact CIR simulation via non-central chi-squared transition.
    Avoids negative rates unlike Euler-Maruyama.
    """
    from scipy.stats import ncx2
    dt  = T / n_steps
    c   = 2 * kappa / (sigma**2 * (1 - np.exp(-kappa * dt)))
    d   = 4 * kappa * theta / sigma**2    # degrees of freedom
    paths = np.zeros((n_steps + 1, n_paths))
    paths[0] = r0
    for i in range(n_steps):
        lam = 2 * c * paths[i] * np.exp(-kappa * dt)  # non-centrality
        paths[i+1] = ncx2.rvs(d, lam, size=n_paths) / (2 * c)
    return paths

kappa, theta, sigma = 0.5, 0.04, 0.08
r0 = 0.03

# Analytical term structure
tenors  = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10])
prices  = cir_bond_price(r0, kappa, theta, sigma, tenors)
yields  = -np.log(prices) / tenors
print("CIR Yield Curve:")
for t, y in zip(tenors, yields):
    print(f"  T={t:5.2f}y  yield={y:.4%}")

print(f"\\nFeller: 2*kappa*theta={2*kappa*theta:.4f} vs sigma^2={sigma**2:.4f}")
print(f"Positive rate guaranteed: {2*kappa*theta > sigma**2}")`,
    explanation: "CIR's mean-reversion term kappa*(theta - r) pulls short rates back to long-run mean theta; the Feller condition 2κθ > σ² ensures rates never hit zero — analytically exact bond pricing avoids Monte Carlo error for vanilla instruments.",
  },
];
