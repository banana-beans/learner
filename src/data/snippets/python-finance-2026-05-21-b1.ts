import type { Snippet } from "./types";

export const pythonFinanceSnippets20260521B1: Snippet[] = [
  {
    id: "pyfin-20260521-b1-cvxpy-mvo",
    language: "python",
    title: "Mean-variance optimization with cvxpy",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

np.random.seed(42)
n = 10  # number of assets

# Synthetic expected returns and covariance matrix
mu = np.random.uniform(0.05, 0.20, n)
A  = np.random.randn(n, n)
Sigma = (A @ A.T) / n + np.eye(n) * 0.02  # positive definite

# Decision variable: portfolio weights
w = cp.Variable(n)

# Objective: minimize portfolio variance
port_variance = cp.quad_form(w, Sigma)
objective = cp.Minimize(port_variance)

# Constraints: fully invested, long-only, max 30% per asset
constraints = [
    cp.sum(w) == 1,        # fully invested
    w >= 0,                # long only
    w <= 0.30,             # position limit
    w @ mu >= 0.10,        # minimum return target
]

prob = cp.Problem(objective, constraints)
prob.solve(solver=cp.OSQP, warm_start=True)

if prob.status == "optimal":
    print(f"Optimal weights: {w.value.round(4)}")
    print(f"Expected return: {(mu @ w.value):.4f}")
    print(f"Portfolio vol:   {np.sqrt(w.value @ Sigma @ w.value):.4f}")`,
    explanation:
      "cvxpy's quad_form(w, Sigma) automatically detects the convex structure and selects OSQP or SCS; warm_start reuses the previous solution as the initial point when re-running after a covariance update, typically cutting solve time by 50-80% in live systems.",
  },
  {
    id: "pyfin-20260521-b1-cvxpy-max-sharpe",
    language: "python",
    title: "Maximum Sharpe via Sharpe ratio linearisation (cvxpy)",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

np.random.seed(7)
n = 8
mu = np.random.uniform(0.06, 0.18, n)
A  = np.random.randn(n, n)
Sigma = (A @ A.T) / n + np.eye(n) * 0.01
rf = 0.03  # risk-free rate

# Max Sharpe = max (mu - rf)^T w / sqrt(w^T Sigma w)
# Linearise via substitution: y = w / kappa, kappa = 1/(w^T Sigma w)^{1/2}
# Then: maximize (mu - rf)^T y  s.t.  quad_form(y, Sigma) <= 1, sum(y) = kappa
# (This is the Markowitz transformation — cvxpy handles it directly with QCP)

# Equivalent: use a standard parametric frontier sweep
best_sharpe = -np.inf
best_w      = None

for target_ret in np.linspace(mu.min(), mu.max(), 50):
    y = cp.Variable(n)
    constraints = [
        cp.sum(y) == 1,
        y >= 0,
        y @ mu >= target_ret,
    ]
    prob = cp.Problem(cp.Minimize(cp.quad_form(y, Sigma)), constraints)
    prob.solve(solver=cp.OSQP, verbose=False)
    if prob.status != "optimal":
        continue
    w_sol = y.value
    vol = np.sqrt(w_sol @ Sigma @ w_sol)
    sr  = (w_sol @ mu - rf) / vol
    if sr > best_sharpe:
        best_sharpe = sr
        best_w = w_sol

print(f"Max Sharpe portfolio:")
print(f"  Sharpe: {best_sharpe:.4f}")
print(f"  Return: {best_w @ mu:.4f}")
print(f"  Vol:    {np.sqrt(best_w @ Sigma @ best_w):.4f}")`,
    explanation:
      "The parametric efficient frontier sweep trades computational cost (50 QPs) for numerical robustness versus the linearisation approach; in production the sweep is parallelised and the grid is adaptively refined around the current Sharpe peak after each solve.",
  },
  {
    id: "pyfin-20260521-b1-pca-factor-extraction",
    language: "python",
    title: "PCA factor extraction from return matrix",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

np.random.seed(0)
T, N = 500, 30  # 500 days, 30 assets

# Simulate 3-factor structure + idiosyncratic noise
market    = np.random.randn(T)
sector    = np.random.randn(T)
value_fac = np.random.randn(T)

# Each asset = random loadings on factors + idiosyncratic noise
loadings = np.random.randn(N, 3) * np.array([0.5, 0.3, 0.2])
returns  = (np.column_stack([market, sector, value_fac]) @ loadings.T
            + np.random.randn(T, N) * 0.01)

# Standardize returns before PCA (each asset has unit variance)
scaler = StandardScaler()
R_std  = scaler.fit_transform(returns)

# Compute sample covariance and eigen-decompose
cov  = np.cov(R_std, rowvar=False)
vals, vecs = np.linalg.eigh(cov)

# Sort descending by eigenvalue
idx  = np.argsort(vals)[::-1]
vals = vals[idx]; vecs = vecs[:, idx]

# Factor returns (T x k) = returns @ eigenvectors
k           = 5  # keep top 5 factors
factor_rets = R_std @ vecs[:, :k]

# Fraction of variance explained
total_var   = vals.sum()
explained   = vals[:k] / total_var

print("Variance explained by top factors:")
for i, e in enumerate(explained):
    print(f"  PC{i+1}: {e:.2%}")
print(f"  Total: {explained.sum():.2%}")`,
    explanation:
      "PCA on the asset return covariance matrix extracts statistical risk factors without prior knowledge of their economic meaning — the first eigenvector is invariably 'the market' and accounts for 30-60% of equity return variance in a diversified cross-section.",
  },
  {
    id: "pyfin-20260521-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor alpha decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

np.random.seed(1)
T = 252

# Simulate FF3 factor returns (daily)
mkt_rf = np.random.normal(0.0003, 0.010, T)
smb    = np.random.normal(0.0001, 0.005, T)
hml    = np.random.normal(0.0001, 0.004, T)

# Simulate a fund with known loadings + alpha
true_alpha = 0.0002   # 5% annualised after factor adjustment
fund_ret   = (true_alpha
              + 1.1  * mkt_rf
              + 0.3  * smb
              - 0.1  * hml
              + np.random.normal(0, 0.004, T))  # idiosyncratic noise

# OLS regression on FF3 factors
X = sm.add_constant(np.column_stack([mkt_rf, smb, hml]))
model = sm.OLS(fund_ret, X).fit(cov_type="HAC", cov_kwds={"maxlags": 5})

alpha, beta_mkt, beta_smb, beta_hml = model.params

print("Factor decomposition:")
print(f"  Alpha (daily):  {alpha:.6f}  | Ann: {alpha * 252:.4%}")
print(f"  Beta Mkt-RF:    {beta_mkt:.4f}")
print(f"  Beta SMB:       {beta_smb:.4f}")
print(f"  Beta HML:       {beta_hml:.4f}")
print(f"  R-squared:      {model.rsquared:.4f}")
print(f"  Alpha t-stat:   {model.tvalues[0]:.3f}")
print(f"  Alpha p-value:  {model.pvalues[0]:.4f}")`,
    explanation:
      "Heteroskedasticity-and-autocorrelation-consistent (HAC) standard errors via Newey-West correct for the autocorrelated residuals that are universal in daily fund returns; without HAC, t-stats overstate significance and many 'alpha' signals evaporate under proper testing.",
  },
  {
    id: "pyfin-20260521-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter dynamic hedge ratio for pairs trading",
    tag: "finance",
    code: `import numpy as np

# Kalman filter to estimate a time-varying hedge ratio beta between two cointegrated stocks.
# State: x = [beta, alpha]' (slope and intercept of y = alpha + beta*x + epsilon)
# Observation: y_t = H_t @ x_t + v_t where H_t = [x_t, 1]

class KalmanHedge:
    def __init__(self, delta=1e-5, vt=1.0):
        self.delta = delta          # process noise intensity
        self.Wt    = delta / (1 - delta) * np.eye(2)  # state covariance
        self.Vt    = vt             # observation noise
        self.x     = np.zeros(2)   # state [beta, alpha]
        self.P     = np.zeros((2, 2))  # state covariance

    def update(self, y: float, x_asset: float):
        H  = np.array([x_asset, 1.0])       # observation matrix

        # Predict
        self.P = self.P + self.Wt           # process noise grows P each step

        # Update (Kalman gain)
        S  = H @ self.P @ H.T + self.Vt    # innovation variance
        K  = self.P @ H.T / S              # Kalman gain (2,)
        innov = y - H @ self.x             # innovation
        self.x = self.x + K * innov        # state update
        self.P = (np.eye(2) - np.outer(K, H)) @ self.P  # covariance update

        return self.x.copy(), innov, np.sqrt(S)  # beta, alpha, innov_std

# Simulate cointegrated pair
np.random.seed(42)
n = 300
x = np.cumsum(np.random.randn(n)) + 50
y = 0.8 * x + 5 + np.random.randn(n) * 1.5  # true beta=0.8, alpha=5

kf   = KalmanHedge(delta=1e-4)
betas, spreads = [], []
for t in range(n):
    state, innov, innov_std = kf.update(y[t], x[t])
    betas.append(state[0])
    spreads.append(innov / innov_std)  # standardised spread for trading

print(f"Terminal beta estimate: {betas[-1]:.4f}  (true: 0.80)")
print(f"Mean |spread|: {np.mean(np.abs(spreads)):.4f}  (should be ~1 if stationary)")`,
    explanation:
      "The Kalman filter adapts the hedge ratio beta continuously rather than re-running a fixed-window OLS: delta controls how quickly the ratio can move, acting as a regulariser — too-large delta chases noise, too-small delta lags structural breaks in the relationship.",
  },
  {
    id: "pyfin-20260521-b1-heston-calibration",
    language: "python",
    title: "Heston model calibration via scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.integrate import quad
from scipy.optimize import minimize

# Heston characteristic function (simplified real-domain COS/quad integration).
# We use the Lewis (2001) formula for the call price via characteristic function.
def heston_call_quad(S, K, r, T, kappa, theta, xi, rho, v0):
    """Heston call via numerical integration of the characteristic function."""
    def integrand(u):
        # Heston characteristic function phi(u)
        d  = np.sqrt((rho * xi * 1j * u - kappa) ** 2 + xi ** 2 * (1j * u + u ** 2))
        g  = (kappa - rho * xi * 1j * u - d) / (kappa - rho * xi * 1j * u + d)
        A  = (kappa * theta / xi ** 2) * (
             (kappa - rho * xi * 1j * u - d) * T
             - 2 * np.log((1 - g * np.exp(-d * T)) / (1 - g)))
        B  = (kappa - rho * xi * 1j * u - d) / xi ** 2 * (
             (1 - np.exp(-d * T)) / (1 - g * np.exp(-d * T)))
        phi = np.exp(A + B * v0 + 1j * u * (np.log(S) + r * T))
        # Lewis formula integrand for call
        return np.real(np.exp(-1j * u * np.log(K)) * phi / (u * (u - 1j)))

    integral, _ = quad(integrand, 1e-6, 100, limit=500, epsabs=1e-7)
    call = (S - K * np.exp(-r * T) * 0.5
            - np.sqrt(S * K * np.exp(-r * T)) / np.pi * integral)
    return max(call, 0.0)

# Observed market data (synthetic): strikes and market prices for 1-year options
S, r, T = 100.0, 0.03, 1.0
strikes      = np.array([80, 90, 95, 100, 105, 110, 120])
market_prices = np.array([21.0, 13.5, 10.0, 7.2, 4.9, 3.1, 1.0])  # approx

def objective(params):
    kappa, theta, xi, rho, v0 = params
    # Constrain parameters to valid Heston domain
    if kappa <= 0 or theta <= 0 or xi <= 0 or abs(rho) >= 1 or v0 <= 0:
        return 1e6
    if 2 * kappa * theta <= xi ** 2:  # Feller condition
        return 1e6
    errors = []
    for K, mkt_p in zip(strikes, market_prices):
        model_p = heston_call_quad(S, K, r, T, kappa, theta, xi, rho, v0)
        errors.append((model_p - mkt_p) ** 2)
    return sum(errors)

result = minimize(objective, x0=[2.0, 0.04, 0.4, -0.5, 0.04],
                  method="Nelder-Mead", options={"maxiter": 2000, "xatol": 1e-5})
kappa, theta, xi, rho, v0 = result.x
print(f"Calibrated Heston params:")
print(f"  kappa={kappa:.4f} theta={theta:.4f} xi={xi:.4f}")
print(f"  rho={rho:.4f}   v0={v0:.4f}")`,
    explanation:
      "Heston calibration is a non-convex optimization over 5 parameters; Nelder-Mead is a derivative-free fallback when Jacobians are expensive, but differential evolution or gradient-based methods with the analytical Jacobian of the characteristic function converge 10-50x faster for production systems.",
  },
  {
    id: "pyfin-20260521-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for deep out-of-the-money options",
    tag: "finance",
    code: `import numpy as np

def mc_otm_call_naive(S, K, r, sigma, T, n=500_000, seed=42):
    """Standard MC: few paths hit the payoff region for deep OTM options."""
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n)
    ST  = S * np.exp((r - 0.5 * sigma ** 2) * T + sigma * np.sqrt(T) * Z)
    payoff = np.maximum(ST - K, 0.0)
    se = payoff.std() / np.sqrt(n)
    return np.exp(-r * T) * payoff.mean(), se

def mc_otm_call_is(S, K, r, sigma, T, n=500_000, seed=42):
    """
    Importance sampling: shift the drift of Z to mu* so that paths are
    centred near the strike. Correct with likelihood ratio (Radon-Nikodym).
    """
    rng   = np.random.default_rng(seed)
    # Optimal IS shift: set mu* = (log(K/S) - (r-0.5*sigma^2)*T) / (sigma*sqrt(T))
    log_k = np.log(K / S)
    mu_star = (log_k - (r - 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))

    Z_is  = rng.standard_normal(n) + mu_star           # shifted normal
    ST    = S * np.exp((r - 0.5 * sigma ** 2) * T + sigma * np.sqrt(T) * Z_is)
    payoff = np.maximum(ST - K, 0.0)

    # Radon-Nikodym derivative: dP/dQ = exp(-mu* * Z + 0.5 * mu*^2)
    lr    = np.exp(-mu_star * Z_is + 0.5 * mu_star ** 2)
    weighted = payoff * lr
    se = weighted.std() / np.sqrt(n)
    return np.exp(-r * T) * weighted.mean(), se

# 25% OTM call: naive MC has high variance, IS has low variance
K = 125.0
naive_price, naive_se = mc_otm_call_naive(100, K, 0.05, 0.20, 1.0)
is_price,    is_se    = mc_otm_call_is   (100, K, 0.05, 0.20, 1.0)
print(f"Naive MC: {naive_price:.4f} +/- {naive_se:.4f}")
print(f"IS MC:    {is_price:.4f}  +/- {is_se:.4f}")
print(f"Variance reduction: {(naive_se / is_se):.1f}x")`,
    explanation:
      "Importance sampling recentres the simulation around the exercise boundary where payoffs actually occur; the likelihood-ratio (Radon-Nikodym) correction ensures the estimator remains unbiased while variance reduction factors of 10-100x are typical for deep OTM options.",
  },
  {
    id: "pyfin-20260521-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory — GPD tail estimation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto, norm

np.random.seed(99)
n_days = 2520  # 10 years of daily P&L

# Simulate returns with fat tails (t-distribution with 4 df)
from scipy.stats import t as student
daily_pnl = student.rvs(df=4, scale=0.01, size=n_days) * 1_000_000  # $1M notional

# Peak Over Threshold (POT): fit GPD to losses exceeding a high threshold
losses     = -daily_pnl   # convert to losses (positive = bad)
threshold  = np.quantile(losses, 0.95)  # 95th percentile as threshold
exceedances = losses[losses > threshold] - threshold  # excess over threshold

# Fit Generalised Pareto Distribution to exceedances
xi_hat, loc_hat, scale_hat = genpareto.fit(exceedances, floc=0)

print(f"Threshold: \${threshold:,.0f}")
print(f"GPD shape (xi):  {xi_hat:.4f}  (>0 = heavy tail, Pareto; <0 = bounded)")
print(f"GPD scale:       {scale_hat:,.0f}")

# Compute 99% and 99.9% VaR via GPD tail
def gpd_var(alpha, n_total, n_excess, threshold, xi, scale):
    """VaR at confidence level alpha using GPD fit."""
    p   = (1 - alpha) * n_total / n_excess  # relative tail probability
    if abs(xi) < 1e-8:
        return threshold + scale * np.log(1 / p)
    return threshold + scale / xi * (p ** (-xi) - 1)

var_99   = gpd_var(0.99,  n_days, len(exceedances), threshold, xi_hat, scale_hat)
var_999  = gpd_var(0.999, n_days, len(exceedances), threshold, xi_hat, scale_hat)
print(f"EVT VaR 99%:   \${var_99:,.0f}")
print(f"EVT VaR 99.9%: \${var_999:,.0f}")

# Compare to Gaussian VaR
sigma = daily_pnl.std()
print(f"Gaussian VaR 99%:   \${-norm.ppf(0.01) * sigma:,.0f}  (likely understated)")`,
    explanation:
      "EVT/GPD is the theoretically correct model for the tails of loss distributions — by Pickands-Balkema-de Haan, exceedances over a high threshold converge to a GPD regardless of the parent distribution, making GPD the universal model for tail risk where Gaussian VaR fails most catastrophically.",
  },
  {
    id: "pyfin-20260521-b1-copula-credit",
    language: "python",
    title: "Gaussian copula for correlated default simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

# Gaussian copula for credit portfolio simulation:
# Simulate correlated defaults across n obligors using a factor model.
# Each obligor i defaults if its latent variable Z_i < threshold_i.
# Z_i = sqrt(rho) * M + sqrt(1-rho) * e_i, where M is the common factor.

def gaussian_copula_defaults(
    n_obligors: int,
    pd_per_obligor: np.ndarray,  # probability of default per obligor
    rho: float,                   # asset correlation (factor loading^2)
    n_scenarios: int = 100_000,
    seed: int = 42,
) -> np.ndarray:
    """Returns number of defaults per scenario. Shape: (n_scenarios,)."""
    rng = np.random.default_rng(seed)

    # Default threshold in normal space: Phi^{-1}(PD_i)
    thresholds = norm.ppf(pd_per_obligor)  # shape (n_obligors,)

    # Common factor (market): one draw per scenario
    M = rng.standard_normal(n_scenarios)  # shape (n_scenarios,)

    # Idiosyncratic shocks: independent per obligor per scenario
    e = rng.standard_normal((n_scenarios, n_obligors))  # (n_scen, n_obl)

    # Latent variable for each obligor in each scenario
    Z = np.sqrt(rho) * M[:, None] + np.sqrt(1 - rho) * e  # (n_scen, n_obl)

    # Default indicator: Z_i < threshold_i
    defaults = (Z < thresholds[None, :]).sum(axis=1)  # (n_scenarios,)
    return defaults

# 100 obligors each with 2% PD, correlation 30%
n = 100
pd_vec   = np.full(n, 0.02)
defaults = gaussian_copula_defaults(n, pd_vec, rho=0.30)

print(f"Expected defaults:     {defaults.mean():.2f}  (true: {n*0.02:.2f})")
print(f"Std of defaults:       {defaults.std():.2f}")
print(f"99th pctile defaults:  {np.percentile(defaults, 99):.0f}")
print(f"99.9th pctile:         {np.percentile(defaults, 99.9):.0f}")
print(f"Max defaults (stress): {defaults.max()}")`,
    explanation:
      "Gaussian copula became infamous after the 2008 crisis because it underestimates joint tail defaults — in stress scenarios, copula correlation is higher (tail dependence) than the linear correlation parameter captures; Student-t copulas or Clayton copulas with positive tail dependence are now preferred for credit CDO pricing.",
  },
  {
    id: "pyfin-20260521-b1-regime-switching",
    language: "python",
    title: "Hidden Markov regime switching (2-state via hmmlearn)",
    tag: "finance",
    code: `import numpy as np
from hmmlearn import hmm  # pip install hmmlearn

np.random.seed(42)
n = 500  # trading days

# Simulate a 2-regime return series: bull (high mean, low vol) + bear (low mean, high vol)
regimes   = np.zeros(n, dtype=int)
returns   = np.zeros(n)
state     = 0  # start in bull

for t in range(n):
    if state == 0:  # bull: high drift, low vol
        returns[t] = np.random.normal(0.001, 0.008)
        state = 0 if np.random.rand() < 0.97 else 1
    else:            # bear: low drift, high vol
        returns[t] = np.random.normal(-0.002, 0.020)
        state = 1 if np.random.rand() < 0.90 else 0
    regimes[t] = state

# Fit a 2-state Gaussian HMM to the return series
model = hmm.GaussianHMM(n_components=2, covariance_type="full",
                         n_iter=200, random_state=42)
model.fit(returns.reshape(-1, 1))

# Decode most likely regime sequence via Viterbi
hidden_states = model.predict(returns.reshape(-1, 1))

# Identify which state is "bull" (higher mean)
means = model.means_.flatten()
bull_state = int(np.argmax(means))

# Regime-conditional P&L
bull_returns = returns[hidden_states == bull_state]
bear_returns = returns[hidden_states == 1 - bull_state]

print(f"Bull regime mean: {bull_returns.mean() * 252:.2%}  vol: {bull_returns.std() * np.sqrt(252):.2%}")
print(f"Bear regime mean: {bear_returns.mean() * 252:.2%}  vol: {bear_returns.std() * np.sqrt(252):.2%}")
print(f"Transition matrix:\\n{model.transmat_.round(3)}")`,
    explanation:
      "The Viterbi algorithm decodes the most likely state sequence in O(T * K²), enabling backtesting strategies that only trade in the bull regime; the transition matrix reveals regime persistence — a high diagonal probability means regimes are 'sticky', which makes signal generation possible from regime probabilities alone.",
  },
  {
    id: "pyfin-20260521-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel term structure fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

# Nelson-Siegel (1987) three-factor yield curve model.
# y(tau) = b0 + b1 * (1 - exp(-tau/lambda)) / (tau/lambda)
#               + b2 * ((1 - exp(-tau/lambda))/(tau/lambda) - exp(-tau/lambda))
# Interpretation: b0 = level, b1 = slope, b2 = curvature, lambda = decay rate.

def nelson_siegel(tau, b0, b1, b2, lam):
    x    = tau / lam
    e    = np.exp(-x)
    f1   = (1 - e) / x          # slope loading (monotone decay)
    f2   = f1 - e               # curvature loading (hump)
    return b0 + b1 * f1 + b2 * f2

# US Treasury par yields (synthetic, representative of a normal curve)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.050, 0.051, 0.049, 0.047, 0.046, 0.044,
                        0.043, 0.042, 0.041, 0.040])

def objective(params):
    b0, b1, b2, lam = params
    if lam <= 0 or b0 <= 0:
        return 1e6
    fitted = nelson_siegel(maturities, b0, b1, b2, lam)
    return np.sum((fitted - yields) ** 2)

result = minimize(objective, x0=[0.04, -0.01, 0.015, 2.0],
                  method="Nelder-Mead", options={"xatol": 1e-8, "maxiter": 5000})
b0, b1, b2, lam = result.x

print(f"Nelson-Siegel fit:")
print(f"  Level (b0):     {b0:.4f}  ({b0:.2%})")
print(f"  Slope (b1):     {b1:.4f}  (negative = normal curve)")
print(f"  Curvature (b2): {b2:.4f}")
print(f"  Decay (lambda): {lam:.4f}")

# RMSE in basis points
t_fine   = np.linspace(0.25, 30, 200)
fitted   = nelson_siegel(maturities, b0, b1, b2, lam)
rmse_bps = np.sqrt(np.mean((fitted - yields) ** 2)) * 10000
print(f"  RMSE: {rmse_bps:.2f} bps")`,
    explanation:
      "The Nelson-Siegel level factor b0 equals the long-run yield (the 30-year rate); the slope factor b1 equals the spread between the long end and the short end; the curvature b2 captures the mid-term hump — all three have intuitive monetary policy interpretations that make the model the central bank standard worldwide.",
  },
  {
    id: "pyfin-20260521-b1-kelly-sizing",
    language: "python",
    title: "Kelly criterion and fractional Kelly position sizing",
    tag: "finance",
    code: `import numpy as np

# Kelly criterion: given a Bernoulli bet with win probability p and payoff ratio b:1,
# the growth-maximising fraction is f* = (b*p - (1-p)) / b = p - (1-p)/b.
# For continuous returns: f* = (mu - rf) / sigma^2 = Sharpe / sigma (portfolio version).

def kelly_fraction(mu: float, sigma: float, rf: float = 0.0) -> float:
    """Optimal Kelly fraction for a strategy with known mean and volatility."""
    return (mu - rf) / (sigma ** 2)

def fractional_kelly(f_star: float, fraction: float = 0.5) -> float:
    """Half-Kelly or quarter-Kelly: reduces growth rate slightly but halves max drawdown."""
    return f_star * fraction

# Example: estimate from backtest returns
np.random.seed(3)
strategy_daily_returns = np.random.normal(0.0005, 0.012, 1000)  # 50 bps/day, 1.2% vol

mu    = strategy_daily_returns.mean()
sigma = strategy_daily_returns.std()

f_full    = kelly_fraction(mu, sigma)
f_half    = fractional_kelly(f_full, 0.5)
f_quarter = fractional_kelly(f_full, 0.25)

print(f"Estimated Kelly fraction: {f_full:.4f}  ({f_full:.2%} of capital)")
print(f"Half-Kelly:               {f_half:.4f}  ({f_half:.2%})")
print(f"Quarter-Kelly:            {f_quarter:.4f}  ({f_quarter:.2%})")

# Simulate wealth under different Kelly fractions
def simulate_wealth(returns, f, n_paths=500):
    """Geometric mean growth under fraction f."""
    pf_returns = f * returns
    log_growth = np.log(1 + pf_returns)
    return np.exp(log_growth.sum())   # terminal wealth per $1

w_full    = simulate_wealth(strategy_daily_returns, f_full)
w_half    = simulate_wealth(strategy_daily_returns, f_half)
w_quarter = simulate_wealth(strategy_daily_returns, f_quarter)

print(f"\\nTerminal wealth per \$1 (1000 days):")
print(f"  Full Kelly:    \${w_full:.2f}")
print(f"  Half Kelly:    \${w_half:.2f}")
print(f"  Quarter Kelly: \${w_quarter:.2f}")`,
    explanation:
      "The full Kelly fraction maximises long-run geometric growth but results in terrifying drawdowns (50-70%); fractional Kelly sacrifices a small fraction of optimal growth in exchange for dramatically reduced variance, which is why institutional funds invariably use quarter or half Kelly — the extra growth isn't worth the career risk.",
  },
  {
    id: "pyfin-20260521-b1-var-weighted-hist",
    language: "python",
    title: "Age-weighted historical simulation VaR",
    tag: "finance",
    code: `import numpy as np

# Age-weighted historical simulation: recent losses receive higher weight.
# BIS recommends lambda in [0.97, 0.99] for a 250-day lookback.

def age_weighted_var(losses: np.ndarray, alpha: float = 0.99,
                      lam: float = 0.97) -> tuple[float, float]:
    """
    Returns (VaR, ES) at confidence level alpha using age-weighted HS.
    losses: ascending-time array (losses[0] = oldest, losses[-1] = newest).
    """
    T = len(losses)

    # Exponential weights: w_t = (1-lambda) * lambda^(T-1-t) / (1-lambda^T)
    t      = np.arange(T)
    w_raw  = (1 - lam) * lam ** (T - 1 - t)
    w_raw  = w_raw / w_raw.sum()           # normalise to sum to 1

    # Sort losses descending; carry weights along
    idx    = np.argsort(losses)[::-1]     # worst first
    sorted_losses = losses[idx]
    sorted_w      = w_raw[idx]

    # VaR: cumulate weights until reaching (1-alpha)
    cum_w  = np.cumsum(sorted_w)
    cutoff = np.searchsorted(cum_w, 1 - alpha)
    var    = sorted_losses[cutoff]

    # ES: expected loss given loss > VaR
    tail_mask = cum_w <= (1 - alpha)
    if tail_mask.sum() == 0:
        es = var
    else:
        es = (sorted_losses * sorted_w)[tail_mask].sum() / sorted_w[tail_mask].sum()

    return var, es

# Simulate 500-day P&L series
np.random.seed(7)
from scipy.stats import t as student
pnl    = student.rvs(df=5, scale=0.01, size=500)   # fat-tailed P&L
losses = -pnl   # positive = loss

var_plain = np.quantile(losses, 0.99)
var_aw, es_aw = age_weighted_var(losses, alpha=0.99, lam=0.97)

print(f"Plain historical VaR 99%:     {var_plain:.4f}")
print(f"Age-weighted VaR 99% (λ=0.97): {var_aw:.4f}")
print(f"Age-weighted ES  99%:           {es_aw:.4f}")`,
    explanation:
      "Age-weighting makes VaR respond faster to volatility regime changes — when 2008-style volatility spikes, the age-weighted estimate rises immediately (because recent big losses get high weight) rather than waiting for the old tail event to roll off, which is the fatal flaw of equal-weighted historical simulation.",
  },
  {
    id: "pyfin-20260521-b1-transaction-cost-model",
    language: "python",
    title: "Market impact and transaction cost model (Almgren-Chriss)",
    tag: "finance",
    code: `import numpy as np

# Simplified Almgren-Chriss (2001) market impact model.
# Liquidates X shares over T periods minimising expected cost + risk.
# Temporary impact: eta * (x_dot) -- linear in trade rate
# Permanent impact: gamma * (x_dot) -- permanent price depression

def almgren_chriss_optimal_schedule(
    X: float,          # total shares to sell
    T: int,            # number of trading periods
    eta: float,        # temporary impact coefficient
    gamma: float,      # permanent impact coefficient
    sigma: float,      # price volatility per period
    lam: float,        # risk-aversion parameter
) -> np.ndarray:
    """
    Returns optimal sell quantities per period.
    Closed-form solution from Almgren-Chriss (2001).
    """
    kappa = np.sqrt(lam * sigma ** 2 / eta)  # urgency parameter
    sinh_kT = np.sinh(kappa * T)

    # Optimal holdings trajectory x(t): hyperbolic sine interpolation
    t  = np.arange(T + 1, dtype=float)
    xt = X * np.sinh(kappa * (T - t)) / sinh_kT  # remaining shares at each step

    trades = -np.diff(xt)  # sell quantities per period (positive = sell)
    return trades

# Liquidate 100,000 shares over 10 periods
X, T, eta, gamma, sigma = 100_000, 10, 0.1, 0.01, 0.02
for lam in [1e-6, 1e-5, 1e-4]:
    trades = almgren_chriss_optimal_schedule(X, T, eta, gamma, sigma, lam)
    total_cost = eta * np.sum(trades ** 2) / X  # approximate
    print(f"lam={lam:.0e}: first trade={trades[0]:,.0f}, "
          f"last trade={trades[-1]:,.0f}, est. impact cost={total_cost:.4f}")`,
    explanation:
      "The hyperbolic-sine trajectory interpolates between VWAP (lam→0, uniform execution) and immediate liquidation (lam→∞, front-loaded); real execution desks use Almgren-Chriss as a benchmark and deviate based on real-time spread and queue observations from the limit order book.",
  },
  {
    id: "pyfin-20260521-b1-bootstrap-ci",
    language: "python",
    title: "Bootstrap confidence interval for Sharpe ratio",
    tag: "finance",
    code: `import numpy as np

def sharpe(returns: np.ndarray, ann: int = 252) -> float:
    if returns.std() == 0:
        return 0.0
    return np.sqrt(ann) * returns.mean() / returns.std(ddof=1)

def bootstrap_sharpe_ci(returns: np.ndarray, n_boot: int = 10_000,
                          alpha: float = 0.05, seed: int = 42) -> tuple[float, float, float]:
    """Returns (point_estimate, lower_CI, upper_CI) via percentile bootstrap."""
    rng  = np.random.default_rng(seed)
    n    = len(returns)
    boot_sharpes = np.zeros(n_boot)

    for i in range(n_boot):
        sample = rng.choice(returns, size=n, replace=True)  # resample with replacement
        boot_sharpes[i] = sharpe(sample)

    point = sharpe(returns)
    lo    = np.percentile(boot_sharpes, 100 * alpha / 2)
    hi    = np.percentile(boot_sharpes, 100 * (1 - alpha / 2))
    return point, lo, hi

# Simulate 2 years of daily returns for a mediocre strategy
np.random.seed(42)
ret = np.random.normal(0.0003, 0.015, 504)  # Sharpe ~1.3 before estimation noise

point, lo, hi = bootstrap_sharpe_ci(ret, n_boot=20_000)
print(f"Point estimate:       {point:.3f}")
print(f"95% bootstrap CI:     ({lo:.3f}, {hi:.3f})")
print(f"CI half-width:        {(hi - lo) / 2:.3f}")

# Lo (2002) analytical standard error for comparison
n  = len(ret)
sr = point / np.sqrt(252)  # daily Sharpe
se_lo = np.sqrt((1 + 0.5 * sr ** 2) / n)  # Lo (2002) approximate SE
print(f"Lo (2002) SE * 1.96:  {1.96 * se_lo * np.sqrt(252):.3f}")`,
    explanation:
      "The bootstrap CI is more robust than the Lo (2002) analytic formula because it handles non-normal returns and serial correlation without assumptions; the key insight is that a Sharpe of 1.5 with 2 years of data has a 95% CI of roughly ±0.5, meaning many 'good' strategies are statistically indistinguishable from noise.",
  },
  {
    id: "pyfin-20260521-b1-vwap-twap",
    language: "python",
    title: "VWAP and TWAP computation from tick data",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

np.random.seed(5)
n = 1000  # tick events

# Synthetic tick data
times   = pd.date_range("2024-01-02 09:30", periods=n, freq="10s")
prices  = 100 + np.cumsum(np.random.randn(n) * 0.05)   # GBM-ish
volumes = np.random.randint(100, 5000, n).astype(float)

ticks = pd.DataFrame({"price": prices, "volume": volumes}, index=times)

# TWAP: time-weighted average price — equally weighted across time periods
# Bar the day into 1-minute buckets and take the average close per bar
twap_bars = ticks["price"].resample("1min").last()  # last price per minute
twap      = twap_bars.mean()

# VWAP: volume-weighted average price — the benchmark for passive execution
dollar_traded = (ticks["price"] * ticks["volume"]).cumsum()
total_volume  = ticks["volume"].cumsum()
vwap_running  = dollar_traded / total_volume          # running VWAP
vwap_final    = vwap_running.iloc[-1]

# VWAP deviation: how well did an order execute relative to VWAP?
def vwap_slippage_bps(fills: pd.DataFrame, vwap: float) -> float:
    """fills has columns: price, volume."""
    avg_fill = (fills["price"] * fills["volume"]).sum() / fills["volume"].sum()
    return (avg_fill - vwap) / vwap * 10000  # in bps, positive = bought above VWAP

# Simulate a strategy's fills: it bought 200 shares at each tick
strategy_fills = ticks.copy()
slip = vwap_slippage_bps(strategy_fills, vwap_final)

print(f"TWAP: \${twap:.4f}")
print(f"VWAP: \${vwap_final:.4f}")
print(f"Strategy VWAP slippage: {slip:.2f} bps")`,
    explanation:
      "VWAP is the standard execution benchmark for institutional orders; a buy strategy that consistently executes above VWAP is paying for liquidity (taking), while one that executes below VWAP is providing liquidity (making) — the difference is often 5-20 bps and determines whether an edge survives implementation.",
  },
  {
    id: "pyfin-20260521-b1-quantlib-bond",
    language: "python",
    title: "QuantLib bond pricing and yield curve bootstrapping",
    tag: "finance",
    code: `# pip install QuantLib
import QuantLib as ql
import numpy as np

# ── Set up the evaluation date ──────────────────────────────────────────────
today = ql.Date(15, ql.January, 2025)
ql.Settings.instance().evaluationDate = today

# ── Build a bootstrapped yield curve from deposit + swap rates ───────────────
calendar  = ql.UnitedStates(ql.UnitedStates.GovernmentBond)
day_count = ql.Actual360()

# Market instruments: deposit + IRS rates (synthetic)
helpers = [
    ql.DepositRateHelper(
        ql.QuoteHandle(ql.SimpleQuote(rate)),
        ql.Period(tenor), 2, calendar, ql.ModifiedFollowing, True, day_count
    )
    for rate, tenor in [(0.049, 1), (0.048, 3), (0.047, 6)]
]
helpers += [
    ql.SwapRateHelper(
        ql.QuoteHandle(ql.SimpleQuote(rate)),
        ql.Period(tenor, ql.Years), calendar,
        ql.Annual, ql.Unadjusted, ql.Thirty360(ql.Thirty360.USA),
        ql.Euribor6M()  # float index (placeholder)
    )
    for rate, tenor in [(0.045, 2), (0.043, 5), (0.041, 10), (0.040, 30)]
]

curve = ql.PiecewiseLogCubicDiscount(today, helpers, day_count)
curve.enableExtrapolation()
ts_handle = ql.YieldTermStructureHandle(curve)

# ── Price a fixed-rate bond ──────────────────────────────────────────────────
maturity  = ql.Date(15, ql.January, 2030)   # 5-year bond
schedule  = ql.Schedule(today, maturity, ql.Period(ql.Semiannual),
                         calendar, ql.ModifiedFollowing, ql.ModifiedFollowing,
                         ql.DateGeneration.Backward, False)
bond = ql.FixedRateBond(2, 100.0, schedule, [0.04],
                         ql.Thirty360(ql.Thirty360.USA))

engine = ql.DiscountingBondEngine(ts_handle)
bond.setPricingEngine(engine)

print(f"Bond NPV (clean price):  {bond.cleanPrice():.4f}")
print(f"Bond NPV (dirty price):  {bond.dirtyPrice():.4f}")
print(f"Yield to maturity:       {bond.bondYield(ql.Thirty360(ql.Thirty360.USA), ql.Compounded, ql.Semiannual):.4%}")
print(f"Modified duration:       {ql.BondFunctions.duration(bond, ql.InterestRate(bond.bondYield(ql.Thirty360(ql.Thirty360.USA), ql.Compounded, ql.Semiannual), ql.Thirty360(ql.Thirty360.USA), ql.Compounded, ql.Semiannual), ql.Duration.Modified):.4f}")`,
    explanation:
      "QuantLib's bootstrapping engine constructs a piecewise discount curve that exactly reprices each input instrument; the PiecewiseLogCubicDiscount interpolation is C² smooth (unlike linear interpolation) and avoids the forward-rate spikes that make linear yield curves unsuitable for derivative hedging.",
  },
  {
    id: "pyfin-20260521-b1-slippage-model",
    language: "python",
    title: "Square-root market impact slippage model",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Square-root market impact: empirically found across many equity markets.
# Impact(q) = sigma * sqrt(q / ADV) where ADV = average daily volume.
# This model is used in backtesting to model realistic execution costs.

def sqrt_market_impact(
    qty: float,              # number of shares to trade
    sigma: float,            # daily volatility (fractional, e.g. 0.02 = 2%)
    adv: float,              # average daily volume (shares)
    participation: float = 0.10,  # target participation rate
    eta: float = 0.1,        # impact scaling constant (~0.1 empirically)
) -> float:
    """Returns expected market impact as a fraction of price (e.g. 0.001 = 10 bps)."""
    # Normalised order size: fraction of ADV
    theta = qty / adv
    impact = eta * sigma * np.sqrt(theta / participation)
    return impact

def backtest_with_impact(
    prices: pd.Series,
    signal: pd.Series,       # target position: [-1, 0, +1]
    sigma_daily: float = 0.02,
    adv: float = 1_000_000,
    shares_per_unit: float = 10_000,
) -> pd.Series:
    pos    = signal.shift(1).fillna(0)
    trades = pos.diff().fillna(0).abs()  # shares of units traded
    ret    = prices.pct_change()

    # Compute impact cost per trade (as fraction of price)
    impact_frac = trades.apply(
        lambda t: sqrt_market_impact(t * shares_per_unit, sigma_daily, adv)
        if t != 0 else 0.0
    )

    strategy_ret = pos * ret - impact_frac
    return strategy_ret

# Simulate
np.random.seed(1)
n   = 500
px  = pd.Series(100 * np.exp(np.cumsum(np.random.randn(n) * 0.01)))
sig = pd.Series(np.sign(np.random.randn(n)))  # random signal

pnl_no_cost = sig.shift(1).fillna(0) * px.pct_change()
pnl_impact  = backtest_with_impact(px, sig)

print(f"No-cost Sharpe:  {np.sqrt(252) * pnl_no_cost.mean() / pnl_no_cost.std():.3f}")
print(f"With-impact Sharpe: {np.sqrt(252) * pnl_impact.mean() / pnl_impact.std():.3f}")`,
    explanation:
      "The square-root law of market impact is one of the most robust empirical regularities in market microstructure — it arises from the Poisson arrival of informed order flow against a random-walk mid price; ignoring it in backtests is the single most common reason paper strategies fail in live trading.",
  },
  {
    id: "pyfin-20260521-b1-statsmodels-garch-vol-forecast",
    language: "python",
    title: "GARCH(1,1) volatility forecast with 95% confidence band",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from arch import arch_model

np.random.seed(0)
n  = 1000

# Simulate GARCH(1,1) returns: omega=0.01, alpha=0.10, beta=0.85
omega, alpha_true, beta_true = 0.01, 0.10, 0.85
h   = np.zeros(n + 1)
ret = np.zeros(n)
h[0] = omega / (1 - alpha_true - beta_true)  # unconditional variance
for t in range(n):
    h[t + 1] = omega + alpha_true * ret[t - 1] ** 2 + beta_true * h[t]
    ret[t]   = np.sqrt(h[t]) * np.random.randn()

# Fit GARCH(1,1) — scale by 100 to help optimiser
series = ret * 100

am  = arch_model(series, mean="Constant", vol="GARCH", p=1, q=1,
                 dist="normal")
res = am.fit(disp="off")

# Rolling in-sample vol forecast (conditional std)
fitted_vol = res.conditional_volatility / 100   # back to fractional

# Out-of-sample forecast for next 10 steps with 95% CI
horizon = 10
fc      = res.forecast(horizon=horizon, reindex=False)
fc_mean_var = fc.variance.values[-1] / 10000  # rescale from 100^2
fc_mean_vol = np.sqrt(fc_mean_var)
fc_upper    = fc_mean_vol * 1.96              # Gaussian CI (approximate)

print("GARCH(1,1) parameters:")
print(res.params.to_string())
print(f"\\n{horizon}-step vol forecasts (daily, fractional):")
for h_i, (vol, up) in enumerate(zip(fc_mean_vol, fc_upper), 1):
    print(f"  t+{h_i:2d}: {vol:.4f}  95% CI upper: {up:.4f}")`,
    explanation:
      "GARCH variance forecasts mean-revert toward the unconditional variance omega/(1-alpha-beta); in the k-step forecast the persistence parameter (alpha+beta) determines how quickly the term structure flattens — markets with alpha+beta near 1.0 (near-integrated GARCH) exhibit volatility that remains elevated for weeks after a shock.",
  },
  {
    id: "pyfin-20260521-b1-ledoit-wolf",
    language: "python",
    title: "Ledoit-Wolf shrinkage covariance estimator",
    tag: "finance",
    code: `import numpy as np
from sklearn.covariance import LedoitWolf, EmpiricalCovariance

np.random.seed(42)
n_assets = 50    # more assets than observations -> sample cov is ill-conditioned
n_obs    = 40    # shorter history makes it worse

# Simulate returns: 3-factor structure
factors  = np.random.randn(n_obs, 3)
loadings = np.random.randn(n_assets, 3) * 0.5
returns  = factors @ loadings.T + np.random.randn(n_obs, n_assets) * 0.1

# Sample covariance (maximum likelihood, biased when N ~ T)
sample_cov = EmpiricalCovariance().fit(returns).covariance_

# Ledoit-Wolf analytical shrinkage toward scaled identity
lw      = LedoitWolf()
lw.fit(returns)
lw_cov  = lw.covariance_
alpha   = lw.shrinkage_  # optimal shrinkage intensity

# Compare: condition numbers (lower is better for inversion)
cond_sample = np.linalg.cond(sample_cov)
cond_lw     = np.linalg.cond(lw_cov)

print(f"Shrinkage intensity: {alpha:.4f}")
print(f"Sample cov condition number: {cond_sample:,.0f}")
print(f"LW cov condition number:     {cond_lw:,.0f}")

# Minimum-variance portfolio with each covariance estimate
def min_var_weights(Sigma):
    inv_Sigma = np.linalg.solve(Sigma, np.ones(n_assets))
    return inv_Sigma / inv_Sigma.sum()

w_sample = min_var_weights(sample_cov)
w_lw     = min_var_weights(lw_cov)

print(f"\\nMax weight (sample cov): {w_sample.max():.4f}  min: {w_sample.min():.4f}")
print(f"Max weight (LW cov):     {w_lw.max():.4f}  min: {w_lw.min():.4f}")`,
    explanation:
      "The Ledoit-Wolf shrinkage pulls the sample covariance toward a scaled identity matrix, dramatically reducing the condition number when T < N (the regime every real portfolio desk operates in); without shrinkage, minimum-variance portfolios take extreme concentrated positions because tiny eigenvalues of the sample matrix amplify noise.",
  },
];
