import type { Snippet } from "./types";

export const pythonFinanceSnippets20260807B1: Snippet[] = [
  {
    id: "pyfin-20260807-b1-antithetic-variates",
    language: "python",
    title: "Antithetic Variates for Variance Reduction in Monte Carlo",
    tag: "monte-carlo",
    code: `import numpy as np

def mc_call_antithetic(S0, K, r, sigma, T, n_paths=50_000, seed=42):
    """
    Antithetic variates: for every random draw Z, also use -Z.
    The pair (Z, -Z) has zero correlation in expectation, halving variance.
    """
    rng = np.random.default_rng(seed)
    # Only generate n_paths/2 normals; mirror with negation
    Z = rng.standard_normal(n_paths // 2)
    disc = np.exp(-r * T)
    sqrt_T = np.sqrt(T)

    def payoff(z):
        ST = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*sqrt_T*z)
        return disc * np.maximum(ST - K, 0)

    pay_pos = payoff(Z)
    pay_neg = payoff(-Z)
    # Average the antithetic pair before averaging across paths
    combined = 0.5 * (pay_pos + pay_neg)

    price = combined.mean()
    se    = combined.std() / np.sqrt(len(combined))

    # Baseline (no antithetic) for comparison
    Z_base = rng.standard_normal(n_paths)
    base_pay = payoff(Z_base)
    se_base = base_pay.std() / np.sqrt(n_paths)

    print(f"Plain MC SE:      {se_base:.5f}")
    print(f"Antithetic SE:    {se:.5f}")
    print(f"Variance ratio:   {(se_base/se)**2:.2f}x reduction")
    return price

mc_call_antithetic(100, 100, 0.05, 0.20, 1.0)`,
    explanation: "Antithetic variates exploit the symmetry of the normal distribution: pairing Z and -Z creates a negatively correlated estimator pair whose average has lower variance than independent samples. Unlike control variates (which need an analytical price as anchor), antithetics require no additional information — just generating half as many unique randoms."
  },
  {
    id: "pyfin-20260807-b1-longstaff-schwartz",
    language: "python",
    title: "Longstaff-Schwartz Least-Squares Monte Carlo for American Options",
    tag: "derivatives",
    code: `import numpy as np

def lsmc_american_put(S0, K, r, sigma, T, n_steps=50, n_paths=10_000, seed=42):
    """
    Longstaff-Schwartz (2001): regress continuation value on polynomial
    basis functions at each exercise date to decide optimal stopping.
    """
    rng   = np.random.default_rng(seed)
    dt    = T / n_steps
    disc  = np.exp(-r * dt)

    # Simulate all paths
    Z  = rng.standard_normal((n_paths, n_steps))
    S  = np.zeros((n_paths, n_steps + 1))
    S[:, 0] = S0
    for t in range(n_steps):
        S[:, t+1] = S[:, t] * np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z[:, t])

    # Cash flows at maturity
    cf = np.maximum(K - S[:, -1], 0)

    # Backward induction
    for t in range(n_steps - 1, 0, -1):
        itm = K - S[:, t] > 0             # in-the-money paths
        if not itm.any():
            continue
        X   = S[itm, t]
        Y   = cf[itm] * disc             # discounted future cash flows
        # Basis: [1, S, S^2]
        A   = np.column_stack([np.ones_like(X), X, X**2])
        coef, *_ = np.linalg.lstsq(A, Y, rcond=None)
        cont = A @ coef                  # estimated continuation value

        exercise = np.maximum(K - X, 0)
        # Exercise where immediate payoff > continuation
        exercised = exercise > cont
        cf[itm] = np.where(exercised, exercise, cf[itm] * disc / disc)  # keep future

    # Final discounting
    discount_factors = np.array([disc**(n_steps - t) for t in range(n_steps)])
    price = (cf * disc).mean()
    return price

p = lsmc_american_put(100, 100, 0.05, 0.20, 1.0)
print(f"American Put LSMC: {p:.4f}")`,
    explanation: "Longstaff-Schwartz replaces the intractable continuation value integral with an OLS regression of discounted future payoffs on simple basis functions (Laguerre polynomials or monomials) evaluated at in-the-money paths. The backward induction requires O(n_steps) regressions of size O(n_paths), making it the industry standard for exotic American and Bermudan option pricing."
  },
  {
    id: "pyfin-20260807-b1-bachelier-swaption",
    language: "python",
    title: "Bachelier (Normal) Model for Swaption Pricing Near Zero Rates",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bachelier_swaption(F, K, sigma_n, T, annuity, payer=True):
    """
    Bachelier model: dF = sigma_n dW (absolute, not relative vol).
    Used for swaptions when rates are near or below zero (negative-rate regimes).
    F: forward swap rate, K: strike, sigma_n: normal vol, annuity: PV01.
    """
    d = (F - K) / (sigma_n * np.sqrt(T))
    if payer:
        # Payer swaption: receive fixed K, pay floating F
        price = annuity * ((F - K) * norm.cdf(d) + sigma_n * np.sqrt(T) * norm.pdf(d))
    else:
        # Receiver swaption
        price = annuity * ((K - F) * norm.cdf(-d) + sigma_n * np.sqrt(T) * norm.pdf(d))
    return price

def bachelier_to_lognormal(F, K, sigma_n, T):
    """Convert normal vol to approximate Black lognormal vol (ATM formula)."""
    # Hagan (2002) ATM approximation: sigma_LN ≈ sigma_N / F
    if abs(F - K) < 1e-8:
        return sigma_n / F  # ATM case
    # Full formula via log-moneyness expansion
    m = np.log(F / K)
    sigma_ln = sigma_n / (np.sqrt(F * K)) * (m / (2 * np.sinh(m / 2)))
    return sigma_ln

# Example: 5Y-into-5Y payer swaption
F = 0.02; K = 0.02; sigma_n = 0.005; T = 5.0; annuity = 4.5
price = bachelier_swaption(F, K, sigma_n, T, annuity)
print(f"Bachelier payer swaption: {price:.4f}")
print(f"Equiv lognormal vol: {bachelier_to_lognormal(F, K, sigma_n, T):.4f}")`,
    explanation: "The Bachelier (normal) model assumes rate changes (not rate levels) are log-normally distributed, producing a symmetric smile and no lower-bound restriction on rates — essential in negative-rate environments (EUR/JPY swaptions post-2014) where Black's model breaks down. Normal vol is now the interdealer convention for swaption quoting in EUR and JPY markets."
  },
  {
    id: "pyfin-20260807-b1-var-macro",
    language: "python",
    title: "Vector Autoregression (VAR) for Macro Factor Dynamics",
    tag: "time-series",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.vector_ar.var_model import VAR

# Simulate correlated macro factors: GDP growth, CPI inflation, policy rate
np.random.seed(42)
n = 200
eps = np.random.multivariate_normal(
    mean=[0, 0, 0],
    cov=[[1.0, 0.5, 0.3],
         [0.5, 1.0, 0.6],
         [0.3, 0.6, 1.0]],
    size=n
) * [0.5, 0.3, 0.2]

gdp = np.cumsum(eps[:, 0]) + 2.0
cpi = np.cumsum(eps[:, 1]) + 2.5
rate = np.cumsum(eps[:, 2]) + 1.5
rate = np.clip(rate, 0.0, None)  # rates floored at zero

df = pd.DataFrame({"gdp_growth": gdp, "cpi": cpi, "policy_rate": rate})

# Fit VAR model — automatic lag selection via AIC
model = VAR(df)
result = model.fit(maxlags=4, ic="aic")
print(result.summary())

# 10-step-ahead forecast
forecast = result.forecast(df.values[-result.k_ar:], steps=10)
forecast_df = pd.DataFrame(forecast, columns=df.columns)
print("\\n10-step forecast:")
print(forecast_df.round(3))

# Impulse response: effect of a 1-std GDP shock on all variables
irf = result.irf(10)
irf.plot(orth=True)`,
    explanation: "VAR(p) models vector time series as a linear function of its own p lags, capturing cross-variable dynamics — a GDP shock propagating to inflation and then to rates. In macro-factor risk models, VAR forecasts provide scenario paths for stress testing, and Granger causality tests identify which factors lead others."
  },
  {
    id: "pyfin-20260807-b1-gp-vol-surface",
    language: "python",
    title: "Gaussian Process Regression for Volatility Surface Interpolation",
    tag: "derivatives",
    code: `import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, WhiteKernel

# Sparse implied vol grid: (strike, expiry) → implied vol
# In practice, fetched from exchange or broker
strikes = np.array([90, 95, 100, 105, 110, 95, 100, 105])
expiries = np.array([0.25, 0.25, 0.25, 0.25, 0.25, 1.0, 1.0, 1.0])
ivols    = np.array([0.25, 0.22, 0.20, 0.21, 0.24, 0.23, 0.21, 0.22])

X_train = np.column_stack([strikes, expiries])
y_train = ivols

# Kernel: RBF captures smooth vol surface; WhiteKernel handles bid-ask noise
kernel = RBF(length_scale=[5.0, 0.3], length_scale_bounds=(1e-2, 10)) \
       + WhiteKernel(noise_level=0.001)

gp = GaussianProcessRegressor(kernel=kernel, n_restarts_optimizer=5, normalize_y=True)
gp.fit(X_train, y_train)

# Interpolate the full surface on a grid
K_grid = np.linspace(85, 115, 31)
T_grid = np.linspace(0.1, 1.5, 15)
KK, TT = np.meshgrid(K_grid, T_grid)
X_pred = np.column_stack([KK.ravel(), TT.ravel()])

mu, std = gp.predict(X_pred, return_std=True)
print(f"ATM 3M implied vol: {gp.predict([[100, 0.25]])[0]:.4f}")
print(f"Surface std (max): {std.max():.4f}")`,
    explanation: "Gaussian Process regression fits a non-parametric smooth surface through sparse observed implied vols while propagating uncertainty — the posterior standard deviation tells you where the surface is poorly constrained by market data. Unlike SABR or SVI parametric fits, GP doesn't assume a specific smile shape, making it robust for exotic term-structure patterns."
  },
  {
    id: "pyfin-20260807-b1-brinson-attribution",
    language: "python",
    title: "Brinson-Hood-Beebower Performance Attribution",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

# Portfolio and benchmark sector weights and returns
data = {
    "sector":       ["Tech", "Fin", "Energy", "Health", "Consumer"],
    "w_port":       [0.40, 0.20, 0.10, 0.20, 0.10],
    "w_bench":      [0.30, 0.25, 0.15, 0.15, 0.15],
    "r_port":       [0.18, 0.08, 0.05, 0.12, 0.09],
    "r_bench":      [0.15, 0.09, 0.04, 0.10, 0.07],
}
df = pd.DataFrame(data)
df = df.set_index("sector")

# Benchmark total return
R_b = (df["w_bench"] * df["r_bench"]).sum()

# BHB decomposition
df["alloc_effect"]  = (df["w_port"] - df["w_bench"]) * (df["r_bench"] - R_b)
df["select_effect"] = df["w_bench"] * (df["r_port"] - df["r_bench"])
df["interact_eff"]  = (df["w_port"] - df["w_bench"]) * (df["r_port"] - df["r_bench"])
df["total_contrib"] = df["alloc_effect"] + df["select_effect"] + df["interact_eff"]

R_p  = (df["w_port"] * df["r_port"]).sum()
active = R_p - R_b

print(df[["alloc_effect","select_effect","interact_eff","total_contrib"]].round(4))
print(f"\\nPortfolio return:  {R_p:.4f}")
print(f"Benchmark return:  {R_b:.4f}")
print(f"Active return:     {active:.4f}")
print(f"Sum of effects:    {df['total_contrib'].sum():.4f}")`,
    explanation: "The Brinson-Hood-Beebower (BHB) model decomposes active return into allocation effect (over/underweighting sectors), selection effect (choosing better stocks within sectors), and interaction (the combined bet). The three terms sum exactly to total active return, making BHB the standard framework for attributing equity portfolio alpha in client reports."
  },
  {
    id: "pyfin-20260807-b1-vol-targeting",
    language: "python",
    title: "Volatility Targeting with Dynamic Position Sizing",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def vol_targeting_backtest(returns: pd.Series, target_vol: float = 0.10,
                            lookback: int = 21, leverage_cap: float = 2.0):
    """
    Scale daily position size so that realised portfolio vol targets target_vol.
    Leverage = target_vol / rolling_vol, capped at leverage_cap.
    """
    # Exponentially weighted volatility estimator (faster response than rolling std)
    ewm_vol = returns.ewm(span=lookback, min_periods=lookback).std() * np.sqrt(252)

    leverage = (target_vol / ewm_vol).clip(upper=leverage_cap)
    # Position is determined the day before (no lookahead)
    scaled_returns = leverage.shift(1) * returns

    cum_port  = (1 + scaled_returns.dropna()).cumprod()
    cum_base  = (1 + returns.loc[scaled_returns.dropna().index]).cumprod()

    ann_vol_port = scaled_returns.dropna().std() * np.sqrt(252)
    ann_ret_port = scaled_returns.dropna().mean() * 252
    sharpe = ann_ret_port / ann_vol_port

    print(f"Target vol:  {target_vol:.0%}")
    print(f"Realized vol: {ann_vol_port:.2%}")
    print(f"Ann return:  {ann_ret_port:.2%}")
    print(f"Sharpe:      {sharpe:.2f}")
    return scaled_returns, leverage

np.random.seed(42)
ret = pd.Series(np.random.normal(0.0005, 0.012, 500))
vol_targeting_backtest(ret, target_vol=0.10)`,
    explanation: "Volatility targeting rescales exposure inversely to realised vol, automatically deleveraging in turbulent regimes and re-leveraging in calm ones — effectively buying volatility-adjusted units rather than dollar units. Empirically, this improves risk-adjusted returns by reducing the left-tail losses that compound catastrophically in crisis periods; AQR and Bridgewater both use variations of this."
  },
  {
    id: "pyfin-20260807-b1-ou-pairs",
    language: "python",
    title: "Ornstein-Uhlenbeck Process Calibration for Statistical Arbitrage",
    tag: "stat-arb",
    code: `import numpy as np
from scipy.optimize import minimize

def simulate_ou(theta, mu, sigma, T=252, dt=1/252, seed=42):
    """Simulate discrete OU: dX = theta(mu - X)dt + sigma dW."""
    rng = np.random.default_rng(seed)
    n = int(T / dt)
    X = np.zeros(n)
    X[0] = mu
    for t in range(1, n):
        X[t] = X[t-1] + theta*(mu - X[t-1])*dt + sigma*np.sqrt(dt)*rng.standard_normal()
    return X

def fit_ou_mle(spread: np.ndarray, dt: float = 1/252):
    """Maximum likelihood estimation of OU parameters from discrete observations."""
    n = len(spread) - 1
    x = spread[:-1]; y = spread[1:]

    # Conditional ML closed-form (Ohlstein 1996)
    Sx  = x.sum(); Sy  = y.sum()
    Sxx = (x**2).sum(); Syy = (y**2).sum(); Sxy = (x*y).sum()

    theta_est = -np.log(
        (n*Sxy - Sx*Sy) / (n*Sxx - Sx**2)
    ) / dt

    alpha = np.exp(-theta_est * dt)
    mu_est = (Sy - alpha*Sx) / (n*(1 - alpha))
    resid = y - alpha*x - mu_est*(1 - alpha)
    sigma_sq = resid.var() * 2 * theta_est / (1 - np.exp(-2*theta_est*dt))
    sigma_est = np.sqrt(sigma_sq)

    half_life = np.log(2) / theta_est
    print(f"theta={theta_est:.3f}  mu={mu_est:.4f}  sigma={sigma_est:.4f}  half-life={half_life:.1f}d")
    return theta_est, mu_est, sigma_est

# Simulate and recover parameters
spread = simulate_ou(theta=5.0, mu=0.0, sigma=0.02)
fit_ou_mle(spread)`,
    explanation: "The Ornstein-Uhlenbeck process is the continuous-time model underlying pairs trading: the spread mean-reverts with speed θ, so the half-life log(2)/θ tells you how quickly to expect convergence and sets the trade holding period. MLE provides closed-form estimates that are more efficient than OLS on the AR(1) discretisation, especially for fast-reverting spreads."
  },
  {
    id: "pyfin-20260807-b1-turnover-constrained",
    language: "python",
    title: "Turnover-Constrained Portfolio Optimization with cvxpy",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

np.random.seed(42)
n = 10  # assets

# Current holdings and market data
w_curr = np.array([0.1]*n)
mu = np.random.uniform(0.05, 0.15, n)

# Covariance from random correlation matrix
A = np.random.randn(n, n)
Sigma = A.T @ A / n + np.eye(n) * 0.01

# Decision variable: new weights
w = cp.Variable(n)
trades = w - w_curr      # relative trades from current position

# Risk and return
port_ret  = mu @ w
port_risk = cp.quad_form(w, Sigma)

# Constraints
constraints = [
    cp.sum(w) == 1,          # fully invested
    w >= 0,                   # long-only
    w <= 0.25,                # max 25% per asset
    # Turnover constraint: total one-way turnover <= 20%
    cp.norm1(trades) <= 0.40, # |buys| + |sells| <= 40% (20% one-way)
]

# Maximize risk-adjusted return minus transaction cost
tc_rate = 0.001  # 10 bps per unit traded
objective = cp.Maximize(port_ret - 0.5 * port_risk - tc_rate * cp.norm1(trades))
prob = cp.Problem(objective, constraints)
prob.solve(solver=cp.CLARABEL)

print("Optimal weights:", np.round(w.value, 3))
print(f"Expected return: {port_ret.value:.4f}")
print(f"Turnover: {np.abs(trades.value).sum()/2:.2%}")`,
    explanation: "Turnover constraints in MVO prevent the optimizer from churning the portfolio to capture tiny alpha improvements that would be eaten by transaction costs — without them, the unconstrained solution trades 100% every period. The L1 norm of the trade vector equals twice the one-way turnover, and cvxpy convexifies this naturally without binary variables."
  },
  {
    id: "pyfin-20260807-b1-factor-neutralize",
    language: "python",
    title: "Factor Neutralization via Regression Residuals for Alpha Signal",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

np.random.seed(42)
n_stocks = 100

# Simulate 3 risk factors (market, size, value)
F = np.random.randn(n_stocks, 3) * [1.0, 0.5, 0.3]
betas_true = np.array([1.0, 0.5, -0.3])

# Stock returns = factor exposure + alpha signal + noise
alpha_signal = np.random.randn(n_stocks) * 0.02  # the true signal
noise = np.random.randn(n_stocks) * 0.05
returns = F @ betas_true + alpha_signal + noise

# --- Factor Neutralization ---
# Regress returns on factor exposures
reg = LinearRegression(fit_intercept=True)
reg.fit(F, returns)

# Residuals = returns unexplained by factors = alpha + noise
neutralized = returns - reg.predict(F)  # factor-neutralized returns

# IC of raw signal vs neutralized signal
from scipy.stats import spearmanr
ic_raw, _ = spearmanr(alpha_signal, returns)
ic_neutral, _ = spearmanr(alpha_signal, neutralized)

print(f"IC (raw):        {ic_raw:.3f}")
print(f"IC (neutralized): {ic_neutral:.3f}  <- cleaner signal")
print(f"Factor coefs:    {reg.coef_.round(3)}")`,
    explanation: "Factor neutralization strips out systematic risk exposures (market, size, value) before measuring the signal's information coefficient — without it, a 'stock selection' signal might just be a disguised value bet, and its IC would reflect the factor performance rather than any idiosyncratic insight. Neutralized IC is the correct metric for evaluating pure alpha."
  },
  {
    id: "pyfin-20260807-b1-dcc-garch",
    language: "python",
    title: "Dynamic Conditional Correlation (DCC-GARCH) for Time-Varying Copula",
    tag: "risk",
    code: `import numpy as np

def garch11_variance(returns, omega, alpha, beta):
    """Recursively compute GARCH(1,1) conditional variance series."""
    n = len(returns)
    h = np.zeros(n)
    h[0] = returns.var()
    for t in range(1, n):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]
    return h

def dcc_update(a, b, Q_bar, z1, z2):
    """
    Single-step DCC update for two standardised residuals z1, z2.
    Q_t = (1-a-b)*Q_bar + a*z_{t-1}*z_{t-1}' + b*Q_{t-1}
    rho_t = Q_t[0,1] / sqrt(Q_t[0,0] * Q_t[1,1])
    """
    Q_bar_mat = Q_bar.copy()
    Q_prev = Q_bar_mat.copy()
    rhos = []
    for i in range(len(z1)):
        z = np.array([[z1[i], z2[i]]])
        Q = (1 - a - b) * Q_bar_mat + a * (z.T @ z) + b * Q_prev
        rho = Q[0, 1] / np.sqrt(Q[0, 0] * Q[1, 1])
        rhos.append(rho)
        Q_prev = Q
    return np.array(rhos)

np.random.seed(42)
T = 300
# Simulate two correlated return series with time-varying correlation
r1 = np.random.randn(T) * 0.01
r2 = 0.6 * r1 + np.sqrt(1 - 0.6**2) * np.random.randn(T) * 0.01

h1 = garch11_variance(r1, 1e-6, 0.05, 0.90)
h2 = garch11_variance(r2, 1e-6, 0.04, 0.91)

z1 = r1 / np.sqrt(h1)
z2 = r2 / np.sqrt(h2)
Q_bar = np.cov(np.array([z1, z2]))

rhos = dcc_update(a=0.05, b=0.90, Q_bar=Q_bar, z1=z1, z2=z2)
print(f"Mean DCC rho: {rhos.mean():.3f}")
print(f"Min rho: {rhos.min():.3f}  Max rho: {rhos.max():.3f}")`,
    explanation: "DCC-GARCH (Engle 2002) captures time-varying correlation between assets by first filtering out univariate volatility with GARCH, then modeling the correlation of standardised residuals with a mean-reverting dynamic. This matters for risk management: correlations spike during crashes (the 'correlation 1 in a crisis' phenomenon), and a static correlation assumption dramatically underestimates tail risk."
  },
  {
    id: "pyfin-20260807-b1-bbb-attribution",
    language: "python",
    title: "Fixed Income PV01 Ladder and Duration Vector for Rate Risk",
    tag: "fixed-income",
    code: `import numpy as np
import pandas as pd

# Key rate durations: sensitivity to a 1bp shift at each tenor
tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30]

def pv01_ladder(cashflows: dict, discount_rates: dict) -> pd.Series:
    """
    Compute PV01 (dollar value of 1bp) for each key rate tenor.
    cashflows: {maturity: amount}, discount_rates: {maturity: rate}.
    """
    pv01s = {}
    for tenor in tenors:
        bump = 0.0001  # 1bp
        pv_base = sum(
            cf * np.exp(-discount_rates.get(t, 0.05) * t)
            for t, cf in cashflows.items()
        )
        # Bump only rates at the given key tenor (simplified: parallel bump for demo)
        rates_up = {t: r + bump if abs(t - tenor) < 0.6 else r
                    for t, r in discount_rates.items()}
        pv_up = sum(
            cf * np.exp(-rates_up.get(t, 0.05) * t)
            for t, cf in cashflows.items()
        )
        pv01s[tenor] = (pv_up - pv_base)  # negative: higher rates → lower PV

    return pd.Series(pv01s, name="PV01 ($)")

# 5-year semi-annual bond: $100 face, 4% coupon
cashflows = {t: 2.0 for t in [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]}
cashflows[5] += 100.0  # principal

rates = {t: 0.04 + 0.002 * t for t in cashflows}  # upward sloping curve
ladder = pv01_ladder(cashflows, rates)
print(ladder.round(4))
print(f"\\nTotal PV01: {ladder.sum():.4f}")`,
    explanation: "The PV01 ladder (key rate duration profile) shows a bond's sensitivity to rate moves at each individual tenor — a parallel-shift duration collapses this into a single number that misses twist/butterfly exposures. Traders hedge using PV01 buckets matched to liquid instruments (OIS, futures, swaps) at each key rate to immunise against non-parallel curve moves."
  },
  {
    id: "pyfin-20260807-b1-risk-neutral-density",
    language: "python",
    title: "Risk-Neutral Density Extraction via Breeden-Litzenberger",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import UnivariateSpline
from scipy.stats import norm
import matplotlib
matplotlib.use("Agg")

def black_scholes_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

# Observed implied vol smile (from market quotes)
K_obs    = np.array([80, 85, 90, 95, 100, 105, 110, 115, 120], dtype=float)
sigma_obs = np.array([0.28, 0.25, 0.22, 0.21, 0.20, 0.21, 0.23, 0.25, 0.27])

S0, r, T = 100.0, 0.05, 1.0

# Call prices at each strike
C_obs = np.array([black_scholes_call(S0, K, r, s, T) for K, s in zip(K_obs, sigma_obs)])

# Fit smooth spline to call prices
spline = UnivariateSpline(K_obs, C_obs, k=4, s=0)

# Breeden-Litzenberger: RND(K) = e^{rT} * d^2C/dK^2
K_fine = np.linspace(75, 130, 200)
rnd = np.exp(r*T) * spline.derivative(n=2)(K_fine)
rnd = np.maximum(rnd, 0)  # numerical noise may give small negatives

# Normalise to probability
dk = K_fine[1] - K_fine[0]
rnd /= (rnd * dk).sum()

print(f"RND mode (risk-neutral most-likely price): {K_fine[np.argmax(rnd)]:.1f}")
print(f"RND mean: {(K_fine * rnd * dk).sum():.2f}")`,
    explanation: "The Breeden-Litzenberger theorem shows the second derivative of the call price with respect to strike equals the discounted risk-neutral density of the terminal asset price — so any complete smile (call prices at all strikes) fully pins down the market-implied probability distribution. Skewness in the RND captures the market's crash risk premium; kurtosis captures tail-event pricing."
  },
  {
    id: "pyfin-20260807-b1-fbm-simulation",
    language: "python",
    title: "Fractional Brownian Motion for Rough Volatility Models",
    tag: "derivatives",
    code: `import numpy as np

def simulate_fbm_cholesky(H: float, n: int, seed: int = 42) -> np.ndarray:
    """
    Simulate fractional Brownian motion with Hurst exponent H via Cholesky.
    H=0.5: standard BM. H<0.5: anti-persistent (rough vol). H>0.5: persistent.
    Rough Heston uses H~0.1 to match the observed power-law smile.
    """
    rng = np.random.default_rng(seed)
    t = np.arange(1, n + 1, dtype=float)

    # Covariance matrix: Cov(B^H_s, B^H_t) = 0.5*(s^{2H} + t^{2H} - |t-s|^{2H})
    s, tt = np.meshgrid(t, t, indexing="ij")
    cov = 0.5 * (s**(2*H) + tt**(2*H) - np.abs(s - tt)**(2*H))

    L = np.linalg.cholesky(cov + 1e-10 * np.eye(n))  # regularise
    Z = rng.standard_normal(n)
    return L @ Z

def rough_vol_path(H=0.1, xi0=0.04, nu=0.3, n=252, seed=42):
    """
    Rough Bergomi model (El Euch & Rosenbaum 2019) for spot vol.
    vol(t) = xi0 * exp(nu * W^H(t) - 0.5 * nu^2 * t^{2H})
    """
    W_H = simulate_fbm_cholesky(H, n, seed)
    t   = np.arange(1, n + 1) / 252.0
    log_vol = nu * W_H - 0.5 * nu**2 * t**(2*H)
    return np.sqrt(xi0 * np.exp(log_vol))

vols = rough_vol_path(H=0.1)
print(f"Mean vol: {vols.mean():.4f}")
print(f"Vol of vol: {vols.std():.4f}")
print(f"First 5 daily vols: {vols[:5].round(4)}")`,
    explanation: "Rough volatility models (Gatheral et al. 2018) use fractional Brownian motion with H≈0.1 — far below 0.5 — to reproduce the empirically observed power-law decay of the implied vol smile in short expiries and the H≈0.1 Hurst exponent estimated from realised variance time series. Standard Heston (H=0.5) cannot match this short-expiry skew without extreme parameters."
  },
  {
    id: "pyfin-20260807-b1-put-call-parity-arb",
    language: "python",
    title: "Put-Call Parity Violation Detection and Arbitrage P&L",
    tag: "derivatives",
    code: `import numpy as np
import pandas as pd

def check_put_call_parity(S0, r, T, options_df: pd.DataFrame, tol_bps=5):
    """
    Put-Call parity: C - P = S * exp(-q*T) - K * exp(-r*T)
    For each strike, compute theoretical vs observed spread and flag violations.
    options_df columns: strike, call_mid, put_mid, call_bid, call_ask, put_bid, put_ask
    """
    df = options_df.copy()
    pv_fwd = S0 - df["strike"] * np.exp(-r * T)  # forward PV (no dividends)

    df["theoretical_spread"] = pv_fwd
    df["observed_spread"]    = df["call_mid"] - df["put_mid"]
    df["deviation"]          = df["observed_spread"] - df["theoretical_spread"]
    df["deviation_bps"]      = df["deviation"] / S0 * 10000

    # Tradeable arb: check if bid-ask spreads allow profitable round-trip
    # Buy (C - P) at ask: pay call_ask, receive put_bid
    # Sell synthetic: receive S forward, pay K discount
    df["arb_pnl_buy_synth"]  = (pv_fwd - (df["call_ask"] - df["put_bid"])).clip(lower=0)
    df["arb_pnl_sell_synth"] = ((df["call_bid"] - df["put_ask"]) - pv_fwd).clip(lower=0)
    df["arb_exists"] = (df["arb_pnl_buy_synth"] > 0) | (df["arb_pnl_sell_synth"] > 0)

    violations = df[abs(df["deviation_bps"]) > tol_bps]
    print(df[["strike","deviation_bps","arb_exists"]].to_string())
    return violations

# Sample option chain
opts = pd.DataFrame({
    "strike":   [90, 95, 100, 105, 110],
    "call_mid": [11.2, 7.1, 4.0, 1.9, 0.8],
    "put_mid":  [ 0.9, 1.8, 3.7, 6.5, 10.4],
    "call_bid": [11.0, 6.9, 3.8, 1.7, 0.7],
    "call_ask": [11.4, 7.3, 4.2, 2.1, 0.9],
    "put_bid":  [ 0.7, 1.6, 3.5, 6.3, 10.2],
    "put_ask":  [ 1.1, 2.0, 3.9, 6.7, 10.6],
})
check_put_call_parity(S0=100, r=0.05, T=0.5, options_df=opts)`,
    explanation: "Put-call parity is a model-free no-arbitrage relationship — violations imply a risk-free profit after transaction costs. In practice, apparent violations arise from bid-ask spreads, early exercise premium on American options, dividend uncertainty, or locate fees for short stock; the tradeable arb calculation strips these out to find genuine opportunities."
  },
  {
    id: "pyfin-20260807-b1-robust-mv",
    language: "python",
    title: "Robust Mean-Variance Optimization with Ellipsoidal Uncertainty Sets",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

np.random.seed(42)
n = 8

# Estimated expected returns and their uncertainty (std of estimate)
mu_hat  = np.array([0.08, 0.10, 0.06, 0.12, 0.09, 0.07, 0.11, 0.08])
mu_std  = np.array([0.02, 0.03, 0.01, 0.04, 0.02, 0.02, 0.03, 0.02])

A = np.random.randn(n, n)
Sigma = A.T @ A / n + np.eye(n) * 0.005

w = cp.Variable(n)
gamma = 1.5    # risk aversion
kappa = 1.0    # robustness budget (1 = 1-std confidence set)

port_ret  = mu_hat @ w
port_risk = cp.quad_form(w, Sigma)
# Worst-case return deduction: subtract uncertainty scaled by weight magnitude
# Ellipsoidal set: min_{mu in U} mu'w = mu_hat'w - kappa * ||diag(mu_std)*w||_2
robust_penalty = kappa * cp.norm(cp.multiply(mu_std, w), 2)

constraints = [cp.sum(w) == 1, w >= 0, w <= 0.3]
objective = cp.Maximize(port_ret - robust_penalty - 0.5 * gamma * port_risk)
prob = cp.Problem(objective, constraints)
prob.solve(solver=cp.CLARABEL)

print("Robust weights:", np.round(w.value, 3))
print(f"Robust return: {(mu_hat @ w.value - kappa * np.linalg.norm(mu_std * w.value)):.4f}")`,
    explanation: "The ellipsoidal uncertainty set penalises the worst-case expected return within a confidence ellipsoid around the estimated mu — the optimizer automatically tilts away from assets with high return uncertainty (large mu_std) even if they look attractive in point-estimate MVO. This directly addresses the Michaud 'error maximiser' problem without Black-Litterman shrinkage."
  },
  {
    id: "pyfin-20260807-b1-pandas-resample-ohlcv",
    language: "python",
    title: "Pandas Resample for Custom OHLCV Bar Construction",
    tag: "data",
    code: `import numpy as np
import pandas as pd

# Generate 1-second tick data for one trading day
np.random.seed(42)
times = pd.date_range("2026-01-02 09:30:00", periods=23400, freq="1s")
prices = 100 + np.cumsum(np.random.randn(23400) * 0.01)
sizes  = np.random.randint(1, 500, 23400)

ticks = pd.DataFrame({"price": prices, "size": sizes}, index=times)

# Resample to 5-minute OHLCV bars
def ohlcv(df):
    return pd.DataFrame({
        "open":   df["price"].resample("5min").first(),
        "high":   df["price"].resample("5min").max(),
        "low":    df["price"].resample("5min").min(),
        "close":  df["price"].resample("5min").last(),
        "volume": df["size"].resample("5min").sum(),
        "vwap":   (df["price"] * df["size"]).resample("5min").sum()
                  / df["size"].resample("5min").sum(),
    })

bars = ohlcv(ticks)
bars["dollar_vol"] = bars["vwap"] * bars["volume"]
bars["range_pct"]  = (bars["high"] - bars["low"]) / bars["open"] * 100

print(bars.head())
print(f"\\nTotal bars: {len(bars)}, Total volume: {bars['volume'].sum():,}")`,
    explanation: "pandas resample groups time-series by calendar intervals — here constructing OHLCV bars from tick data in a single chain call. VWAP requires combining price and size resamples, not just averaging prices; the dollar_volume column enables downstream market impact estimation and liquidity filtering for signal generation."
  },
  {
    id: "pyfin-20260807-b1-numpy-einsum-cov",
    language: "python",
    title: "numpy.einsum for Efficient Multi-Asset Factor Covariance",
    tag: "data",
    code: `import numpy as np

def factor_covariance(B, F_cov, D):
    """
    Barra-style risk model: Sigma = B @ F_cov @ B.T + D
    B:     (n_assets, n_factors) factor loading matrix
    F_cov: (n_factors, n_factors) factor covariance
    D:     (n_assets,) idiosyncratic variances (diagonal)
    """
    # Equivalent to B @ F_cov @ B.T but einsum is clearer for higher-rank tensors
    systematic = np.einsum("ij,jk,lk->il", B, F_cov, B)  # B F_cov B^T
    return systematic + np.diag(D)

def portfolio_variance_einsum(w, B, F_cov, D):
    """w^T Sigma w decomposed into factor and idiosyncratic parts."""
    f_exposure = B.T @ w               # (n_factors,) factor exposures
    var_factor  = f_exposure @ F_cov @ f_exposure
    var_idio    = np.einsum("i,i,i->", w, D, w)  # sum(w_i^2 * D_i)
    return var_factor, var_idio, var_factor + var_idio

np.random.seed(42)
n_assets, n_factors = 200, 5

B = np.random.randn(n_assets, n_factors) * 0.5
F_raw = np.random.randn(n_factors, n_factors)
F_cov = F_raw.T @ F_raw / n_factors + np.eye(n_factors) * 0.01
D = np.abs(np.random.randn(n_assets)) * 0.01

Sigma = factor_covariance(B, F_cov, D)
w = np.ones(n_assets) / n_assets

var_f, var_i, var_total = portfolio_variance_einsum(w, B, F_cov, D)
print(f"Factor variance:      {var_f:.6f}")
print(f"Idiosyncratic var:    {var_i:.6f}")
print(f"Total portfolio var:  {var_total:.6f}")`,
    explanation: "einsum expresses the matrix chain B @ F_cov @ B.T as a single contraction with explicit index notation — avoiding intermediate n×n matrix allocations. For n=5000 assets and k=50 factors, the factor structure reduces the covariance computation from O(n²k) to O(nk²), which is the foundational efficiency of Barra-style risk models."
  },
  {
    id: "pyfin-20260807-b1-arima-forecast",
    language: "python",
    title: "ARIMA Model Selection and Forecasting with Residual Diagnostics",
    tag: "time-series",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.stats.diagnostic import acorr_ljungbox
from statsmodels.graphics.tsaplots import plot_acf

np.random.seed(42)
# Simulate an ARIMA(2,1,1) series
n = 300
eps = np.random.randn(n)
y = np.zeros(n)
for t in range(2, n):
    y[t] = 0.5*y[t-1] - 0.3*y[t-2] + eps[t] - 0.4*eps[t-1]
# Integrate once to make I(1)
y_obs = pd.Series(np.cumsum(y) + 50)

# Fit ARIMA(2,1,1) — order chosen via KPSS/ADF + ACF/PACF inspection
model = ARIMA(y_obs, order=(2, 1, 1))
res = model.fit()
print(res.summary())

# Residual diagnostics: Ljung-Box test for autocorrelation
lb_test = acorr_ljungbox(res.resid, lags=[10, 20], return_df=True)
print("\\nLjung-Box p-values (want > 0.05 for white noise):")
print(lb_test)

# 10-step forecast with 95% CI
fc = res.get_forecast(steps=10)
fc_df = fc.summary_frame(alpha=0.05)
print("\\n10-step forecast:")
print(fc_df[["mean","mean_ci_lower","mean_ci_upper"]].round(2))`,
    explanation: "ARIMA residual diagnostics are as important as the fit: the Ljung-Box test checks whether residuals are white noise (no remaining autocorrelation), and p-values below 0.05 indicate the model is misspecified — a common failure mode is using ARIMA on a series that actually requires a fractional integration (ARFIMA) or a structural break model."
  },
  {
    id: "pyfin-20260807-b1-credit-migration",
    language: "python",
    title: "Credit Migration Matrix and Multi-Period Default Probability",
    tag: "credit",
    code: `import numpy as np

# Moody's-style 1-year credit migration matrix (simplified)
# Rows/cols: AAA, AA, A, BBB, BB, B, CCC, Default
RATINGS = ["AAA","AA","A","BBB","BB","B","CCC","D"]
M = np.array([
    [0.921, 0.071, 0.006, 0.001, 0.000, 0.000, 0.000, 0.001],  # AAA
    [0.009, 0.900, 0.083, 0.006, 0.001, 0.000, 0.000, 0.001],  # AA
    [0.001, 0.021, 0.903, 0.060, 0.009, 0.003, 0.001, 0.002],  # A
    [0.000, 0.003, 0.049, 0.869, 0.063, 0.011, 0.002, 0.003],  # BBB
    [0.000, 0.001, 0.005, 0.076, 0.828, 0.072, 0.010, 0.008],  # BB
    [0.000, 0.000, 0.001, 0.005, 0.070, 0.828, 0.060, 0.036],  # B
    [0.000, 0.000, 0.001, 0.001, 0.030, 0.115, 0.617, 0.236],  # CCC
    [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 1.000],  # D (absorbing)
], dtype=float)

def multi_period_migration(M, years):
    """Compound the 1-year matrix via matrix power."""
    return np.linalg.matrix_power(M, years)

def default_prob(initial_rating, years):
    idx = RATINGS.index(initial_rating)
    M_n = multi_period_migration(M, years)
    return M_n[idx, RATINGS.index("D")]

print("5-year default probability by rating:")
for r in ["AAA","BBB","BB","B","CCC"]:
    pd5 = default_prob(r, 5)
    print(f"  {r}: {pd5:.4%}")`,
    explanation: "Compounding the 1-year migration matrix via matrix power gives n-year transition probabilities under the Markov assumption — the Default column gives cumulative default probabilities used to price bonds, CDS, and structured credit. The absorbing default state (row sums to 1 with D=1) ensures probability mass accumulates there over long horizons."
  },
  {
    id: "pyfin-20260807-b1-quantlib-dividends",
    language: "python",
    title: "QuantLib European Option with Discrete Dividend Yield",
    tag: "derivatives",
    code: `import QuantLib as ql

# Market inputs
S0      = 100.0
K       = 100.0
r       = 0.05
q       = 0.02   # continuous dividend yield
sigma   = 0.20
T_years = 1.0

today = ql.Date(7, 8, 2026)
ql.Settings.instance().evaluationDate = today
expiry = today + ql.Period(int(T_years * 365), ql.Days)

# Build yield curve and dividend curve handles
day_count  = ql.Actual365Fixed()
calendar   = ql.UnitedStates(ql.UnitedStates.NYSE)
spot_quote = ql.QuoteHandle(ql.SimpleQuote(S0))
r_ts  = ql.YieldTermStructureHandle(
            ql.FlatForward(today, r, day_count))
q_ts  = ql.YieldTermStructureHandle(
            ql.FlatForward(today, q, day_count))
vol_ts = ql.BlackVolTermStructureHandle(
             ql.BlackConstantVol(today, calendar, sigma, day_count))

# Black-Scholes-Merton process
process = ql.BlackScholesMertonProcess(spot_quote, q_ts, r_ts, vol_ts)

# Price European call
payoff = ql.PlainVanillaPayoff(ql.Option.Call, K)
exercise = ql.EuropeanExercise(expiry)
option = ql.VanillaOption(payoff, exercise)
option.setPricingEngine(ql.AnalyticEuropeanEngine(process))

print(f"Call price:  {option.NPV():.4f}")
print(f"Delta:       {option.delta():.4f}")
print(f"Gamma:       {option.gamma():.4f}")
print(f"Vega:        {option.vega():.4f}")
print(f"Theta:       {option.theta():.4f}")`,
    explanation: "QuantLib's BlackScholesMertonProcess includes a continuous dividend yield (q_ts) as a separate term structure — this correctly reduces the forward price and delta compared to a non-dividend model. QuantLib's handle/quote architecture allows repricing instantly when the market quote changes (via SimpleQuote.setValue) without rebuilding the object graph, which is essential for real-time Greeks updates."
  },
];
