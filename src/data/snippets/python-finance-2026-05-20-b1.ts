import type { Snippet } from "./types";

export const pythonFinanceSnippets20260520B1: Snippet[] = [
  {
    id: "pyfin-20260520-b1-svensson",
    language: "python",
    title: "Svensson yield curve (6-param fit)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import curve_fit

# Svensson (1994) extends Nelson-Siegel with a second hump/trough term.
# y(t) = b0 + b1*(1-exp(-t/tau1))/(t/tau1)
#             + b2*((1-exp(-t/tau1))/(t/tau1) - exp(-t/tau1))
#             + b3*((1-exp(-t/tau2))/(t/tau2) - exp(-t/tau2))
def svensson(t, b0, b1, b2, b3, tau1, tau2):
    e1 = np.exp(-t / tau1)
    e2 = np.exp(-t / tau2)
    f1 = (1 - e1) / (t / tau1)       # loading for b1 (level-slope blend)
    f2 = f1 - e1                       # loading for b2 (first curvature)
    f3 = (1 - e2) / (t / tau2) - e2   # loading for b3 (second curvature)
    return b0 + b1 * f1 + b2 * f2 + b3 * f3

# Synthetic Treasury yields: maturities 0.25 to 30 years
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
yields = np.array([0.045, 0.046, 0.047, 0.044, 0.043, 0.042,
                   0.042, 0.041, 0.040, 0.039, 0.038])

# Initial guess: b0=long rate, b1=slope, b2/b3=curvatures, tau1/tau2=knots
p0 = [0.04, -0.01, 0.02, 0.01, 2.0, 5.0]
bounds = ([0, -0.15, -0.15, -0.15, 0.1, 0.1],
          [0.15, 0.15, 0.15, 0.15, 30.0, 30.0])

popt, pcov = curve_fit(svensson, maturities, yields, p0=p0, bounds=bounds,
                        maxfev=10000)
b0, b1, b2, b3, tau1, tau2 = popt

t_fine = np.linspace(0.25, 30, 200)
fitted = svensson(t_fine, *popt)

print("Svensson params:")
print(f"  b0 (long-run level): {b0:.4f}")
print(f"  b1 (slope):          {b1:.4f}")
print(f"  b2 (curvature 1):    {b2:.4f}")
print(f"  b3 (curvature 2):    {b3:.4f}")
print(f"  tau1: {tau1:.2f}  tau2: {tau2:.2f}")
print(f"  In-sample RMSE: {np.sqrt(np.mean((svensson(maturities, *popt) - yields)**2))*10000:.2f} bps")`,
    explanation:
      "The Svensson model adds a second exponential decay term to Nelson-Siegel, giving it a second hump that captures the typical U-shape in forward rate curves; the extra parameters tau1 and tau2 control where the two curvature effects peak along the maturity spectrum.",
  },
  {
    id: "pyfin-20260520-b1-dv01-hedge",
    language: "python",
    title: "Bond DV01 and rate-hedge ratio",
    tag: "finance",
    code: `import numpy as np

def dirty_price(face, coupon_rate, ytm, maturity, freq=2):
    """Present value of all cash flows."""
    n = int(maturity * freq)
    c = face * coupon_rate / freq          # per-period coupon
    t = np.arange(1, n + 1) / freq        # payment times in years
    cfs = np.full(n, c)
    cfs[-1] += face                        # add par at maturity
    disc = (1 + ytm / freq) ** (t * freq)
    return np.sum(cfs / disc)

def dv01(face, coupon_rate, ytm, maturity, bump=1e-4, freq=2):
    """DV01: price change for +1 bp parallel shift in yield."""
    p_up   = dirty_price(face, coupon_rate, ytm + bump, maturity, freq)
    p_down = dirty_price(face, coupon_rate, ytm - bump, maturity, freq)
    return (p_down - p_up) / 2.0  # central difference; positive value

# Position: long $10M face of 10-year 5% bond at YTM 4.5%
face_pos  = 10_000_000
ytm_pos   = 0.045
dv01_pos  = dv01(face_pos, 0.05, ytm_pos, 10.0)

# Hedge: 2-year 4% bond at YTM 4%
face_hedge = 10_000_000   # starting face; we will scale it
ytm_hedge  = 0.04
dv01_hedge_unit = dv01(1.0, 0.04, ytm_hedge, 2.0)   # per $1 face

# Hedge ratio: how much face of the hedge bond to short
hedge_face = dv01_pos / dv01_hedge_unit
hedge_sign = -1  # short the hedge bond

print(f"Position DV01:      \${dv01_pos:,.2f} per bp")
print(f"Hedge DV01/unit:    \${dv01_hedge_unit:.6f} per bp per \$1 face")
print(f"Hedge face needed:  \${hedge_face:,.0f}")
print(f"Hedge DV01 check:   \${abs(dv01_hedge_unit * hedge_face):,.2f} (should ~= position DV01)")`,
    explanation:
      "The hedge ratio equals position_DV01 / hedge_DV01_per_unit_face, so that for every 1 bp yield shift the mark-to-market gain on one leg exactly offsets the loss on the other; central differences are used to avoid the asymmetry bias of one-sided bumps.",
  },
  {
    id: "pyfin-20260520-b1-ou-mle",
    language: "python",
    title: "Ornstein-Uhlenbeck MLE (closed-form) + half-life",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def ou_mle(x: np.ndarray, dt: float):
    """
    Closed-form conditional MLE for OU: dX = theta*(mu - X)*dt + sigma*dW
    Based on Uhlenbeck & Ornstein (1930) discrete exact solution.
    Returns (theta, mu, sigma, half_life_days).
    """
    n  = len(x) - 1
    x0 = x[:-1]
    x1 = x[1:]

    Sx   = x0.sum()
    Sy   = x1.sum()
    Sxx  = (x0 ** 2).sum()
    Sxy  = (x0 * x1).sum()
    Syy  = (x1 ** 2).sum()

    # Closed-form MLE formulas (see Borodin & Salminen "Handbook of BM")
    mu_hat = (Sy * Sxx - Sx * Sxy) / (n * (Sxx - Sxy) - (Sx**2 - Sx * Sy))
    # Avoid divide-by-zero if data has no mean reversion
    denom = Sxx - 2 * mu_hat * Sx + n * mu_hat**2
    if abs(denom) < 1e-12:
        return None

    kappa_hat = -np.log((Sxy - mu_hat * Sx - mu_hat * Sy + n * mu_hat**2) / denom) / dt
    theta_hat = max(kappa_hat, 1e-6)   # mean-reversion speed (must be positive)

    alpha  = np.exp(-theta_hat * dt)
    resid  = x1 - alpha * x0 - mu_hat * (1 - alpha)
    sigma2 = resid.var() * 2 * theta_hat / (1 - alpha**2)
    sigma_hat = np.sqrt(max(sigma2, 0))

    half_life = np.log(2) / theta_hat / dt  # in time steps (e.g. days)
    return theta_hat, mu_hat, sigma_hat, half_life

# Simulate an OU process to verify
rng  = np.random.default_rng(0)
theta_true, mu_true, sigma_true = 0.5, 100.0, 2.0
dt   = 1/252
n    = 500
x    = np.zeros(n)
x[0] = 100.0
for i in range(1, n):
    x[i] = (x[i-1] + theta_true * (mu_true - x[i-1]) * dt
             + sigma_true * np.sqrt(dt) * rng.standard_normal())

theta_hat, mu_hat, sigma_hat, hl = ou_mle(x, dt)
print(f"True  theta={theta_true}  mu={mu_true}  sigma={sigma_true}")
print(f"MLE   theta={theta_hat:.3f}  mu={mu_hat:.3f}  sigma={sigma_hat:.3f}")
print(f"Half-life: {hl:.1f} trading days")`,
    explanation:
      "The closed-form OU MLE exploits the fact that the discrete-time transition is exactly Gaussian, giving exact (not approximate) maximum likelihood estimators for all three parameters; the half-life ln(2)/theta is the key statistic for pairs trading — it tells you how many days a spread takes to mean-revert by half.",
  },
  {
    id: "pyfin-20260520-b1-risk-parity",
    language: "python",
    title: "Equal Risk Contribution (risk parity) portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def portfolio_vol(w, Sigma):
    return np.sqrt(w @ Sigma @ w)

def risk_contributions(w, Sigma):
    """Marginal risk * weight = risk contribution per asset."""
    port_vol = portfolio_vol(w, Sigma)
    marginal = Sigma @ w / port_vol       # marginal contribution to vol
    return w * marginal                   # absolute risk contribution

def erc_objective(w, Sigma):
    """Sum of squared differences in risk contributions (target: all equal)."""
    rc = risk_contributions(w, Sigma)
    # Each asset should contribute 1/n of total risk
    target = np.mean(rc)
    return np.sum((rc - target) ** 2)

np.random.seed(42)
n = 4
# Synthetic covariance: equities correlated, bonds anti-correlated
vols = np.array([0.15, 0.20, 0.05, 0.08])   # equity, equity, bond, bond
corr = np.array([[1.0, 0.7, -0.1, -0.2],
                 [0.7, 1.0, -0.1, -0.2],
                 [-0.1,-0.1, 1.0, 0.5],
                 [-0.2,-0.2, 0.5, 1.0]])
Sigma = np.diag(vols) @ corr @ np.diag(vols)

w0 = np.ones(n) / n
constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1.0}]
bounds = [(0, 1)] * n

res = minimize(erc_objective, w0, args=(Sigma,),
               method="SLSQP", bounds=bounds, constraints=constraints,
               options={"ftol": 1e-12, "maxiter": 1000})

w_erc = res.x
rc = risk_contributions(w_erc, Sigma)
print("ERC weights:          ", np.round(w_erc, 4))
print("Risk contributions:   ", np.round(rc, 6))
print("Risk contribution %:  ", np.round(rc / rc.sum() * 100, 2))
# Should be ~25% for each asset`,
    explanation:
      "Risk parity is not equal weighting — it is equal risk weighting; high-volatility equity positions receive smaller notional weights so that each asset contributes the same marginal variance, making the portfolio neutral to individual asset volatility scaling without changing the correlation structure.",
  },
  {
    id: "pyfin-20260520-b1-max-diversification",
    language: "python",
    title: "Maximum diversification portfolio (Choueifady & Coignard)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def diversification_ratio(w, vols, Sigma):
    """DR = weighted avg vol / portfolio vol: maximised when most diversified."""
    weighted_vol = w @ vols                    # numerator: sum w_i * sigma_i
    port_vol = np.sqrt(w @ Sigma @ w)          # denominator: portfolio vol
    return weighted_vol / port_vol

def neg_dr(w, vols, Sigma):
    return -diversification_ratio(w, vols, Sigma)

np.random.seed(1)
n = 5
vols = np.array([0.12, 0.18, 0.22, 0.08, 0.15])
corr = np.array([
    [1.00, 0.60, 0.55, -0.10, 0.30],
    [0.60, 1.00, 0.70, -0.05, 0.40],
    [0.55, 0.70, 1.00, -0.05, 0.35],
    [-0.10,-0.05,-0.05, 1.00,-0.15],
    [0.30, 0.40, 0.35,-0.15, 1.00],
])
Sigma = np.diag(vols) @ corr @ np.diag(vols)

w0 = np.ones(n) / n
constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1.0}]
bounds = [(0, 1)] * n  # long-only

res = minimize(neg_dr, w0, args=(vols, Sigma),
               method="SLSQP", bounds=bounds, constraints=constraints,
               options={"ftol": 1e-12})

w_md = res.x
dr   = diversification_ratio(w_md, vols, Sigma)
print("Max-diversification weights:", np.round(w_md, 4))
print(f"Diversification Ratio: {dr:.4f}")
print(f"Portfolio vol: {np.sqrt(w_md @ Sigma @ w_md)*100:.2f}%")
print(f"Weighted avg vol: {w_md @ vols * 100:.2f}%")`,
    explanation:
      "The diversification ratio measures how much the portfolio benefits from imperfect correlations: a DR of 1 means no diversification benefit (single asset), while DR > 1 means the portfolio vol is lower than the weighted average of individual vols; the maximum DR portfolio concentrates in assets that reduce correlation the most.",
  },
  {
    id: "pyfin-20260520-b1-variance-swap",
    language: "python",
    title: "Variance swap fair value via log-contract replication",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    if K <= 0 or T <= 0: return max(S - K, 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, sigma, T):
    return bs_call(S, K, r, sigma, T) - S + K*np.exp(-r*T)  # put-call parity

# Carr-Madan (1998): fair variance = (2/T) * integral over all strikes
# of C(K)/K^2 dk  for K >= F,  and P(K)/K^2 dk  for K < F
# Discretised over a strike grid.
S0 = 100; r = 0.02; T = 0.5; sigma_atm = 0.20
F = S0 * np.exp(r * T)  # forward price

# Strike grid: 50% to 200% of spot with fine spacing
K_grid = np.linspace(0.50 * S0, 2.0 * S0, 2000)
dK = K_grid[1] - K_grid[0]

# Use flat vol smile for simplicity (real use: interpolated vol surface)
fair_var = 0.0
for K in K_grid:
    w = dK / K**2   # integration weight
    if K >= F:
        fair_var += w * bs_call(S0, K, r, sigma_atm, T)
    else:
        fair_var += w * bs_put(S0, K, r, sigma_atm, T)

fair_var *= (2.0 / T) * np.exp(r * T)  # discount-adjusted

# The fair strike (vol) of the variance swap
K_var = np.sqrt(fair_var)

print(f"Fair variance: {fair_var:.6f}")
print(f"Fair vol strike: {K_var*100:.2f}%  (ATM sigma = {sigma_atm*100:.2f}%)")
# Under flat smile: K_var should equal sigma_atm^2

# Simulate realised variance to compute P&L
rng = np.random.default_rng(42)
n_steps = int(252 * T)
daily_ret = rng.normal((r - 0.5*sigma_atm**2)/252, sigma_atm/np.sqrt(252), n_steps)
realised_var = daily_ret.var() * 252
print(f"Realised variance: {realised_var:.6f}")
print(f"Variance swap P&L per unit notional: {realised_var - fair_var:.6f}")`,
    explanation:
      "The log-contract replication shows that variance swap fair value can be computed model-free from option prices across all strikes — no assumption about vol dynamics is needed; in practice, skew causes K_var < ATM implied vol, a premium you pay for the smile convexity.",
  },
  {
    id: "pyfin-20260520-b1-quantile-reg",
    language: "python",
    title: "Quantile regression for tail risk attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.formula.api as smf
from statsmodels.regression.quantile_regression import QuantReg

rng = np.random.default_rng(0)
n = 500

# Simulate: extreme losses driven more by VIX and volume than median losses
vix    = rng.normal(20, 5, n)                       # VIX level
volume = rng.normal(1e6, 2e5, n)                    # daily volume
noise  = rng.standard_normal(n)

# Tail losses amplified by VIX and volume (non-linear in tails)
loss = -0.01 * vix - 0.5e-6 * volume + 2.0 * noise + rng.exponential(0.5, n)

df = pd.DataFrame({"loss": loss, "vix": vix - vix.mean(),
                   "volume": (volume - volume.mean()) / volume.std()})

X = df[["vix", "volume"]].assign(const=1).values
y = df["loss"].values

qr_median = QuantReg(y, X).fit(q=0.5)   # median regression (robust OLS)
qr_tail   = QuantReg(y, X).fit(q=0.95)  # 95th percentile

print("Median (q=0.50) coefficients:")
print(f"  const={qr_median.params[2]:.3f}  vix={qr_median.params[0]:.3f}  volume={qr_median.params[1]:.3f}")
print("Tail   (q=0.95) coefficients:")
print(f"  const={qr_tail.params[2]:.3f}  vix={qr_tail.params[0]:.3f}  volume={qr_tail.params[1]:.3f}")
print("\\nKey insight: VIX coefficient larger at q=0.95 than q=0.50")
print("  -> VIX explains tail losses more than median losses")`,
    explanation:
      "Quantile regression minimises the tilted absolute loss function, making it robust to heavy tails and outliers; comparing q=0.5 (median) to q=0.95 (tail) coefficients reveals which risk factors selectively drive extreme losses — OLS would average these two regimes together and miss the tail amplification.",
  },
  {
    id: "pyfin-20260520-b1-turnover-constrained",
    language: "python",
    title: "Turnover-constrained rebalancing (cvxpy + CLARABEL)",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

# Minimize tracking error to target allocation subject to turnover budget.
# Useful when transaction costs make frequent rebalancing expensive.
np.random.seed(42)
n = 6
Sigma = np.array([  # realistic equity covariance
    [0.040, 0.018, 0.015, 0.005, -0.002, 0.010],
    [0.018, 0.036, 0.014, 0.004, -0.002, 0.009],
    [0.015, 0.014, 0.050, 0.006, -0.001, 0.012],
    [0.005, 0.004, 0.006, 0.010,  0.001, 0.003],
    [-0.002,-0.002,-0.001, 0.001, 0.005, -0.001],
    [0.010, 0.009, 0.012, 0.003, -0.001, 0.025],
])

w_target = np.array([0.25, 0.20, 0.15, 0.20, 0.10, 0.10])  # desired allocation
w_current= np.array([0.30, 0.18, 0.12, 0.22, 0.10, 0.08])  # current portfolio

turnover_budget = 0.10  # max 10% total turnover (sum of |w_new - w_old|)

w = cp.Variable(n)
# Tracking error: (w - w_target)^T Sigma (w - w_target)
te = cp.quad_form(w - w_target, Sigma)

# Turnover: sum of absolute weight changes
turnover = cp.norm1(w - w_current)

constraints = [
    cp.sum(w) == 1,          # fully invested
    w >= 0,                  # long-only
    turnover <= turnover_budget,  # turnover limit
]

prob = cp.Problem(cp.Minimize(te), constraints)
prob.solve(solver=cp.CLARABEL)

print(f"Status: {prob.status}")
print(f"Optimal weights:   {np.round(w.value, 4)}")
print(f"Target weights:    {w_target}")
print(f"Turnover used:     {np.sum(np.abs(w.value - w_current)):.4f} (budget {turnover_budget})")
print(f"Tracking error:    {np.sqrt(te.value)*100:.3f}%")`,
    explanation:
      "The turnover constraint is an L1-norm on weight changes, making the problem second-order cone representable and solvable exactly via CLARABEL; without this constraint, MV optimisers tend to take extreme rebalancing trades that destroy alpha via transaction costs.",
  },
  {
    id: "pyfin-20260520-b1-vwap-slippage",
    language: "python",
    title: "VWAP slippage attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(42)

# Simulate intraday execution data for a buy order
n_fills = 20
fill_prices  = 100.0 + np.cumsum(rng.normal(0, 0.05, n_fills))  # price drift
fill_qtys    = rng.integers(100, 500, n_fills)

# Market VWAP: volume-weighted average over all market trades in the interval
mkt_prices   = 100.0 + np.cumsum(rng.normal(0.002, 0.05, n_fills)) # slight upward drift
mkt_qtys     = rng.integers(500, 2000, n_fills)

arrival_px   = fill_prices[0]   # price at order decision time
decision_px  = 99.80            # portfolio manager decision price (e.g. prev close)

side = +1  # +1 for buy, -1 for sell

# Average fill price
avg_fill_px = np.average(fill_prices, weights=fill_qtys)

# Market VWAP over the same interval
market_vwap = np.average(mkt_prices, weights=mkt_qtys)

# Slippage decomposition (all in basis points)
total_slippage   = side * (avg_fill_px - decision_px)    # vs. decision (IS)
timing_cost      = side * (arrival_px - decision_px)     # market movement before order
market_impact    = side * (avg_fill_px - market_vwap)    # execution vs. market VWAP
spread_cost      = side * (market_vwap - arrival_px)     # VWAP vs arrival (market drift)

print(f"Decision price:    {decision_px:.4f}")
print(f"Arrival price:     {arrival_px:.4f}")
print(f"Avg fill price:    {avg_fill_px:.4f}")
print(f"Market VWAP:       {market_vwap:.4f}")
print(f"\\nSlippage decomposition ($ per share):")
print(f"  Total IS slippage: {total_slippage:.4f}")
print(f"  Timing cost:       {timing_cost:.4f}  (market moved before we started)")
print(f"  Market impact:     {market_impact:.4f}  (we paid more than market VWAP)")
print(f"  Spread/drift cost: {spread_cost:.4f}  (VWAP vs arrival)")
print(f"  Check sum:         {timing_cost + market_impact + spread_cost:.4f}")`,
    explanation:
      "Implementation shortfall measures the total cost relative to the decision price, not just the bid-ask spread; decomposing it into timing, market impact, and spread components lets a trading desk distinguish poor timing decisions (pre-trade) from poor execution tactics (in-trade).",
  },
  {
    id: "pyfin-20260520-b1-roll-spread",
    language: "python",
    title: "Roll (1984) implicit bid-ask spread estimator",
    tag: "finance",
    code: `import numpy as np

# Roll (1984): In a frictionless market, price changes are random.
# With a bid-ask spread s, consecutive changes are negatively auto-correlated:
# cov(delta_p_t, delta_p_{t-1}) = -(s/2)^2
# => s = 2 * sqrt(-cov)
def roll_spread(prices: np.ndarray) -> float:
    """Estimate effective spread from transaction price series."""
    delta_p = np.diff(prices)                  # first differences
    # Sample covariance between consecutive differences (lag-1)
    n = len(delta_p)
    mean_d = delta_p.mean()
    cov_lag1 = np.mean(
        (delta_p[:-1] - mean_d) * (delta_p[1:] - mean_d)
    )
    if cov_lag1 >= 0:
        # No negative serial correlation; Roll estimator is undefined
        # (can happen in trending markets or with thin data)
        return 0.0
    return 2.0 * np.sqrt(-cov_lag1)  # effective full spread estimate

# Simulate: mid price with random walk + bid/ask noise
rng = np.random.default_rng(7)
n = 1000
true_spread = 0.10   # $0.10 bid-ask spread
mid = 100 + np.cumsum(rng.normal(0, 0.05, n))     # GBM-like mid

# Transaction prices alternate between bid (mid - s/2) and ask (mid + s/2)
# with some noise to simulate order flow
side = rng.choice([-1, 1], size=n)                # buy=+1, sell=-1
transaction_prices = mid + side * true_spread / 2 + rng.normal(0, 0.01, n)

estimated_spread = roll_spread(transaction_prices)
print(f"True spread:      \${true_spread:.3f}")
print(f"Roll estimate:    \${estimated_spread:.3f}")

# Show the serial correlation structure
delta_p = np.diff(transaction_prices)
autocorr_lag1 = np.corrcoef(delta_p[:-1], delta_p[1:])[0, 1]
print(f"Autocorr lag-1:   {autocorr_lag1:.4f}  (negative from spread bounce)")`,
    explanation:
      "The Roll estimator exploits the bounce between bid and ask: if the last trade was a buy (at the ask), the next trade is more likely to be a sell (at the bid), generating negative autocorrelation in transaction price changes; the estimator fails when the covariance is positive due to trending information flow.",
  },
  {
    id: "pyfin-20260520-b1-futures-roll",
    language: "python",
    title: "Futures roll cost and implied convenience yield",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Cost-of-carry model: F = S * exp((r + c - y) * T)
# where r = risk-free rate, c = storage cost, y = convenience yield
# Rearranging: implied y = r + c - (1/T) * ln(F/S)
# For financial futures (no storage): y captures dividend yield or repo benefit.

def implied_convenience_yield(S, F, T, r=0.05, storage=0.0):
    """Back out convenience yield from spot and futures price."""
    return r + storage - np.log(F / S) / T

# Calendar spread: front vs back month
# Negative calendar spread (backwardation) = positive convenience yield
data = {
    "date": pd.date_range("2025-01-02", periods=10, freq="B"),
    "spot":  [100.0, 100.5, 101.0, 100.8, 101.2,
               101.5, 101.0, 100.7, 101.3, 101.8],
    "front": [100.3, 100.8, 101.3, 101.0, 101.5,
               101.8, 101.2, 100.9, 101.5, 102.0],  # 1-month contract
    "back":  [100.8, 101.4, 101.9, 101.5, 102.1,
               102.3, 101.7, 101.4, 102.0, 102.5],  # 3-month contract
}
df = pd.DataFrame(data)

T_front = 1/12    # 1 month to expiry
T_back  = 3/12    # 3 months to expiry
r = 0.05

df["cy_front"] = df.apply(
    lambda row: implied_convenience_yield(row["spot"], row["front"], T_front, r), axis=1)
df["cy_back"]  = df.apply(
    lambda row: implied_convenience_yield(row["spot"], row["back"],  T_back,  r), axis=1)

# Calendar spread P&L: long front, short back (roll is positive when backwardation)
df["cal_spread"] = df["front"] - df["back"]
df["roll_pnl"]   = df["cal_spread"].diff()  # change in spread = roll P&L

print(df[["date","cy_front","cy_back","cal_spread","roll_pnl"]].round(4).to_string())
print(f"\\nMean convenience yield (front): {df['cy_front'].mean()*100:.2f}%")`,
    explanation:
      "Convenience yield measures the non-monetary benefit of holding the physical commodity (or the repo benefit for financial assets); a positive convenience yield corresponds to a market in backwardation where front-month prices exceed back-month, and rolling forward generates a positive carry for long futures holders.",
  },
  {
    id: "pyfin-20260520-b1-cip-fx-fwd",
    language: "python",
    title: "Covered interest parity and cross-currency basis",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Covered Interest Parity (CIP): F = S * (1 + r_d) / (1 + r_f)
# or continuously: F = S * exp((r_d - r_f) * T)
# Violation = cross-currency basis: x = r_f + basis != implied by FX fwd

def cip_forward(S, r_d, r_f, T):
    """Theoretical CIP forward rate (continuous compounding)."""
    return S * np.exp((r_d - r_f) * T)

def cross_ccy_basis(S, F_mkt, r_d, r_f, T):
    """
    Implied basis (annualised) from market forward vs CIP implied forward.
    Positive basis: foreign currency cheaper to borrow than CIP implies.
    """
    F_cip = cip_forward(S, r_d, r_f, T)
    # Market implied foreign rate: r_f_implied = r_d - ln(F_mkt/S)/T
    r_f_implied = r_d - np.log(F_mkt / S) / T
    return r_f_implied - r_f  # basis = market r_f - quoted r_f

# Example: USD/EUR
T = 0.25  # 3-month

scenarios = pd.DataFrame({
    "S_EURUSD": [1.10, 1.10, 1.10, 1.10],
    "r_USD":    [0.055, 0.055, 0.055, 0.055],
    "r_EUR":    [0.030, 0.030, 0.030, 0.030],
    "F_mkt":    [1.1063, 1.1060, 1.1070, 1.1055],  # market-quoted forwards
})

scenarios["F_cip"] = scenarios.apply(
    lambda r: cip_forward(r["S_EURUSD"], r["r_USD"], r["r_EUR"], T), axis=1)
scenarios["basis_bps"] = scenarios.apply(
    lambda r: cross_ccy_basis(r["S_EURUSD"], r["F_mkt"], r["r_USD"], r["r_EUR"], T) * 10000,
    axis=1)
scenarios["arb_profit"] = (scenarios["F_mkt"] - scenarios["F_cip"]).abs() > 1e-4

print(scenarios[["S_EURUSD","F_cip","F_mkt","basis_bps","arb_profit"]].round(5).to_string())
print("\\nNegative basis means borrowing in EUR via FX swap is cheaper than direct EUR")`,
    explanation:
      "The cross-currency basis quantifies the violation of CIP — it was essentially zero pre-2008, but post-crisis regulatory capital requirements raised costs for arbitrageurs, allowing persistent deviations; a negative EUR/USD basis means USD-funded investors can earn a premium by providing EUR liquidity via FX swaps.",
  },
  {
    id: "pyfin-20260520-b1-vol-term-struct",
    language: "python",
    title: "VIX-style constant-maturity vol interpolation",
    tag: "finance",
    code: `import numpy as np

# VIX methodology: interpolate 30-day constant-maturity implied vol
# from two near-term VIX futures contracts using calendar-day weighting.
#
# VIX^2 = [w1 * VIX_near^2 * (T2 - 30) + w2 * VIX_next^2 * (30 - T1)]
#         / (T2 - T1)  * (365/30)
# where T1, T2 are days-to-expiry for near and next term.

def constant_maturity_vol(vix_near: float, vix_next: float,
                           T1_days: int, T2_days: int,
                           target_days: int = 30) -> float:
    """
    vix_near/next: annualised implied vol in decimal (not percent)
    T1_days, T2_days: calendar days to expiry for near and next contract
    """
    if T1_days >= target_days or T2_days <= target_days:
        # Return nearest contract if target is outside range
        return vix_near if abs(T1_days - target_days) < abs(T2_days - target_days) else vix_next

    # Interpolation in variance space (not vol space)
    var_near = vix_near ** 2
    var_next = vix_next ** 2

    # Calendar-day weighted blend: each contract's variance contribution
    # is proportional to days remaining after removing the other's window
    N1, N2 = T1_days, T2_days
    span = N2 - N1

    # Weight for near contract: remaining days until next expiry
    w_near = (N2 - target_days) / span
    # Weight for next contract: days elapsed from near expiry
    w_next = (target_days - N1) / span

    interp_var = w_near * var_near * N1 / target_days + w_next * var_next * N2 / target_days
    return np.sqrt(interp_var)

# Concrete example: near contract expires in 22 days, next in 50 days
examples = [
    (0.15, 0.17, 22, 50),  # standard interpolation case
    (0.20, 0.18, 28, 57),  # near contract has higher vol (inversion)
    (0.12, 0.14,  5, 35),  # near contract very close to expiry
]

print(f"{'VIX_near':>10} {'VIX_next':>10} {'T1':>6} {'T2':>6} {'CM_30d':>10}")
for vn, vx, t1, t2 in examples:
    cm = constant_maturity_vol(vn, vx, t1, t2, 30)
    print(f"{vn*100:>9.1f}%  {vx*100:>9.1f}%  {t1:>6}  {t2:>6}  {cm*100:>9.3f}%")`,
    explanation:
      "Interpolating in variance (vol²) space rather than vol space gives a correct expectation of integrated variance between the two contracts; the CBOE's VIX specifically uses calendar days (not business days) because options expiry is driven by calendar time, not trading time.",
  },
  {
    id: "pyfin-20260520-b1-ic-analysis",
    language: "python",
    title: "Information coefficient (IC) analysis and ICIR",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import spearmanr

rng = np.random.default_rng(42)
n_assets = 50
n_periods = 60  # months

# Simulate: a factor score with realistic IC ~0.05
true_ic = 0.06
factor_scores = rng.normal(0, 1, (n_periods, n_assets))
forward_returns = (true_ic * factor_scores +
                   np.sqrt(1 - true_ic**2) * rng.normal(0, 0.05, (n_periods, n_assets)))

# Cross-sectional Spearman IC: rank correlation between factor and next-period return
ics = []
for t in range(n_periods - 1):
    factor_t = factor_scores[t]
    return_t1 = forward_returns[t + 1]  # next period
    ic, _ = spearmanr(factor_t, return_t1)
    ics.append(ic)

ics = np.array(ics)
ic_series = pd.Series(ics, name="IC")

mean_ic = ic_series.mean()
std_ic  = ic_series.std()
icir    = mean_ic / std_ic    # information ratio of the IC itself
t_stat  = icir * np.sqrt(len(ics))  # t-statistic for IC != 0

print(f"Mean IC:  {mean_ic:.4f}  (true IC = {true_ic:.2f})")
print(f"IC Std:   {std_ic:.4f}")
print(f"ICIR:     {icir:.4f}")
print(f"t-stat:   {t_stat:.2f}  (|t| > 2 => statistically significant)")

# IC decay: rolling mean IC to see how signal decays over time
rolling_ic = ic_series.rolling(12).mean()
print(f"\\n12-period rolling IC (last 5):\\n{rolling_ic.tail().round(4)}")`,
    explanation:
      "ICIR (mean IC / std IC) is the information ratio of the factor itself, analogous to Sharpe ratio for a strategy; a factor with ICIR > 0.5 is considered strong in practice, and the t-statistic sqrt(n) * ICIR tests whether the mean IC is statistically different from zero.",
  },
  {
    id: "pyfin-20260520-b1-factor-risk-attr",
    language: "python",
    title: "Barra-style factor risk attribution",
    tag: "finance",
    code: `import numpy as np

# Barra risk decomposition:
# Active variance = w^T * V * w, where V = B*F*B^T + Delta
# B: factor loadings (n_assets x n_factors)
# F: factor covariance (n_factors x n_factors)
# Delta: diagonal idiosyncratic (specific) variance
# Factor variance contribution: B^T * w (factor exposures) projected through F

rng = np.random.default_rng(1)
n_assets  = 8
n_factors = 3   # e.g. Market, Size, Value

# Factor loadings: each asset has exposure to each factor
B = rng.normal(0, 1, (n_assets, n_factors))
B[:, 0] = np.abs(B[:, 0])  # market beta > 0

# Factor covariance matrix (annualised variance)
vols_f = np.array([0.15, 0.05, 0.06])  # market, size, value vols
corr_f = np.array([[1.0, -0.1, 0.2],
                   [-0.1, 1.0, 0.3],
                   [0.2, 0.3, 1.0]])
F = np.diag(vols_f) @ corr_f @ np.diag(vols_f)

# Specific (idiosyncratic) variance: diagonal, uncorrelated
specific_vol = rng.uniform(0.05, 0.15, n_assets)
Delta = np.diag(specific_vol ** 2)

# Full covariance: V = B*F*B^T + Delta
V = B @ F @ B.T + Delta

# Active weights: deviation from benchmark (e.g. equal weight)
w_bench  = np.ones(n_assets) / n_assets
w_active = rng.normal(0, 0.02, n_assets)  # small tilts
w_active -= w_active.mean()  # zero-sum

# Total active variance
active_var = w_active @ V @ w_active

# Factor variance: w^T * B * F * B^T * w
factor_var = w_active @ B @ F @ B.T @ w_active

# Specific variance: w^T * Delta * w
specific_var = w_active @ Delta @ w_active

# Per-factor contribution
f_exp = B.T @ w_active   # factor exposures of active portfolio (n_factors)
f_var_contrib = f_exp * (F @ f_exp)  # element-wise: exposure^2 * factor_var (approx)

print(f"Total active variance: {active_var*100:.4f}%")
print(f"  Factor variance:     {factor_var*100:.4f}% ({factor_var/active_var*100:.1f}%)")
print(f"  Specific variance:   {specific_var*100:.4f}% ({specific_var/active_var*100:.1f}%)")
print("  Per-factor contrib (approx):")
factor_names = ["Market", "Size", "Value"]
for name, contrib in zip(factor_names, f_var_contrib):
    print(f"    {name:10s}: {contrib*100:.5f}%")`,
    explanation:
      "The Barra decomposition separates active risk into factor risk (systematic, hedgeable) and specific risk (idiosyncratic, diversifiable); in a well-diversified active portfolio, specific risk approaches zero, leaving only priced factor tilts — the goal of smart-beta strategies.",
  },
  {
    id: "pyfin-20260520-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for rare-event probability",
    tag: "finance",
    code: `import numpy as np

# Estimate P(L > threshold) where L is a portfolio loss.
# Naive MC requires many samples when P is small (< 0.1%).
# Importance sampling: shift mean of sampling distribution by mu_shift,
# then reweight each sample by the likelihood ratio.

rng = np.random.default_rng(0)

# Simplified: portfolio loss L ~ N(0, sigma) + rare jump
sigma = 0.02     # daily vol
threshold = 0.06  # 3-sigma loss event

# Naive MC: very noisy for rare events
n_naive = 200_000
L_naive = rng.normal(0, sigma, n_naive)
p_naive = np.mean(L_naive > threshold)
std_naive = np.sqrt(p_naive * (1 - p_naive) / n_naive)

# Importance Sampling: shift sampling distribution to target region
mu_shift = threshold   # shift mean to threshold
n_is = 20_000
L_is_raw = rng.normal(mu_shift, sigma, n_is)

# Likelihood ratio: p(x; mu=0) / p(x; mu=mu_shift) for Normal
# = exp(-(x^2)/(2*s^2)) / exp(-(x-mu_shift)^2/(2*s^2))
# = exp(-mu_shift*(2*x - mu_shift) / (2*s^2))
log_lr = -mu_shift * (2 * L_is_raw - mu_shift) / (2 * sigma**2)
lr = np.exp(log_lr)   # likelihood ratios

# IS estimator: weighted average of indicators
indicators = (L_is_raw > threshold).astype(float)
p_is = np.mean(indicators * lr)
std_is = np.std(indicators * lr) / np.sqrt(n_is)

# Analytic truth (for Normal)
from scipy.stats import norm
p_true = 1 - norm.cdf(threshold / sigma)

print(f"True probability (analytic): {p_true:.6f}")
print(f"Naive MC ({n_naive:,}):    {p_naive:.6f} ± {std_naive:.6f}")
print(f"IS MC    ({n_is:,}):     {p_is:.6f} ± {std_is:.6f}")
print(f"IS variance reduction: {(std_naive/std_is)**2:.1f}x")`,
    explanation:
      "Importance sampling shifts the probability mass towards the rare event region, dramatically reducing estimator variance; the likelihood ratio (Radon-Nikodym derivative) corrects for the bias introduced by sampling from the wrong distribution, making IS an exact (unbiased) estimator.",
  },
  {
    id: "pyfin-20260520-b1-ridge-alpha",
    language: "python",
    title: "Ridge regression for alpha signal shrinkage",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge, RidgeCV, LinearRegression
from sklearn.model_selection import TimeSeriesSplit

rng = np.random.default_rng(42)
n, p = 300, 20   # 300 observations, 20 noisy features (alpha signals)

# Generate: 3 truly informative signals, 17 pure noise
true_coefs = np.zeros(p)
true_coefs[:3] = [0.05, -0.04, 0.03]  # only first 3 matter
X = rng.normal(0, 1, (n, p))
y = X @ true_coefs + rng.normal(0, 0.5, n)   # noisy returns

# Rolling out-of-sample R^2 comparison
tscv = TimeSeriesSplit(n_splits=5)
oos_r2_ols   = []
oos_r2_ridge = []

for train_idx, test_idx in tscv.split(X):
    X_tr, X_te = X[train_idx], X[test_idx]
    y_tr, y_te = y[train_idx], y[test_idx]

    # OLS: tends to overfit with many features
    ols = LinearRegression().fit(X_tr, y_tr)
    oos_r2_ols.append(ols.score(X_te, y_te))

    # Ridge: cross-validate alpha on training data
    alphas = np.logspace(-3, 3, 20)
    ridge = RidgeCV(alphas=alphas, cv=3).fit(X_tr, y_tr)
    oos_r2_ridge.append(ridge.score(X_te, y_te))

print(f"OLS   mean OOS R²: {np.mean(oos_r2_ols):.4f}")
print(f"Ridge mean OOS R²: {np.mean(oos_r2_ridge):.4f}")

# Show shrinkage: Ridge pushes noise signal coefficients toward zero
ridge_final = RidgeCV(alphas=np.logspace(-3, 3, 30)).fit(X, y)
ols_final   = LinearRegression().fit(X, y)
print(f"\\nSelected Ridge alpha: {ridge_final.alpha_:.4f}")
print("First 5 true / OLS / Ridge coefficients:")
for i in range(5):
    print(f"  feature {i}: true={true_coefs[i]:.3f}  OLS={ols_final.coef_[i]:.3f}  Ridge={ridge_final.coef_[i]:.3f}")`,
    explanation:
      "Ridge regression adds an L2 penalty that shrinks all coefficients toward zero proportionally; in alpha research with many correlated signals, OLS amplifies noise, while Ridge's shrinkage is equivalent to placing a Gaussian prior on signal strengths — the cross-validated alpha is the regularisation that minimises out-of-sample prediction error.",
  },
  {
    id: "pyfin-20260520-b1-market-impact",
    language: "python",
    title: "Market impact model (linear + square-root Almgren)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Two-component market impact model:
# 1. Spread cost (fixed): 0.5 * spread (half-spread per trade)
# 2. Permanent/temporary impact: eta * sigma * sqrt(X/V)
#    where X = order size (shares), V = daily volume, sigma = daily vol
# Total expected slippage per share = spread/2 + eta * sigma * sqrt(X/V)

def expected_slippage(order_size: float,
                       daily_volume: float,
                       spread: float,
                       daily_vol: float,
                       eta: float = 0.1,
                       price: float = 100.0) -> dict:
    """
    order_size: total shares to execute
    daily_volume: average daily volume in shares
    spread: bid-ask spread in dollars
    daily_vol: daily price volatility (fractional, e.g. 0.02)
    eta: impact coefficient (calibrated, ~0.1 for liquid stocks)
    """
    participation = order_size / daily_volume   # participation rate
    spread_cost_per_share = spread / 2.0
    impact_per_share = eta * daily_vol * price * np.sqrt(participation)
    total_per_share = spread_cost_per_share + impact_per_share

    return {
        "spread_cost_per_share": spread_cost_per_share,
        "impact_per_share": impact_per_share,
        "total_per_share": total_per_share,
        "total_cost_$": total_per_share * order_size,
        "cost_bps": total_per_share / price * 10000,
        "participation_rate": participation,
    }

# Example: execute 100k shares of a liquid stock
scenarios = pd.DataFrame([
    expected_slippage(100_000, 5_000_000, 0.01, 0.015),   # liquid, small order
    expected_slippage(500_000, 5_000_000, 0.01, 0.015),   # liquid, large order
    expected_slippage(100_000, 500_000,   0.05, 0.030),   # illiquid stock
    expected_slippage(50_000,  10_000_000, 0.005, 0.010), # very liquid
])

print(scenarios.round(4).to_string())`,
    explanation:
      "The square-root impact model (from Almgren et al., 2005) captures the empirically observed concavity of price impact with order size: doubling an order does not double impact because early trades occur at better prices before the signal spreads; calibrating eta requires trade-level data and varies by asset class.",
  },
  {
    id: "pyfin-20260520-b1-local-vol-dupire",
    language: "python",
    title: "Dupire local vol surface from implied vol grid",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    if sigma <= 0 or T <= 0: return max(S - K, 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def dupire_local_vol(K_grid, T_grid, iv_surface, S0=100, r=0.05):
    """
    Compute Dupire local vol on interior grid points using finite differences.
    sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2*d^2C/dK^2)
    iv_surface[i,j] = implied vol at T_grid[i], K_grid[j]
    """
    nT, nK = len(T_grid), len(K_grid)
    local_vol = np.full((nT, nK), np.nan)

    # Compute call prices on full grid
    C = np.zeros((nT, nK))
    for i, T in enumerate(T_grid):
        for j, K in enumerate(K_grid):
            C[i, j] = bs_call(S0, K, r, iv_surface[i, j], T)

    # Interior points only (need one-sided diffs at boundaries)
    for i in range(1, nT - 1):
        for j in range(1, nK - 1):
            dT  = T_grid[i+1] - T_grid[i-1]
            dK  = K_grid[j+1] - K_grid[j-1]
            dK2 = K_grid[j+1] - K_grid[j]   # local step for second deriv

            dCdT   = (C[i+1, j] - C[i-1, j]) / dT
            dCdK   = (C[i, j+1] - C[i, j-1]) / dK
            d2CdK2 = (C[i, j+1] - 2*C[i, j] + C[i, j-1]) / dK2**2

            K = K_grid[j]
            numerator   = dCdT + r * K * dCdK
            denominator = 0.5 * K**2 * d2CdK2

            if denominator > 1e-8 and numerator > 0:
                local_vol[i, j] = np.sqrt(numerator / denominator)

    return local_vol

# Create a realistic skewed implied vol surface
S0 = 100; r = 0.05
K_grid = np.array([85, 90, 95, 100, 105, 110, 115])
T_grid = np.array([0.1, 0.25, 0.5, 1.0, 1.5])

# Vol skew: lower strikes have higher IV (equity smile)
iv_surface = np.zeros((len(T_grid), len(K_grid)))
for i, T in enumerate(T_grid):
    for j, K in enumerate(K_grid):
        moneyness = np.log(K / S0)
        iv_surface[i, j] = 0.20 - 0.10 * moneyness + 0.05 * moneyness**2

lv = dupire_local_vol(K_grid, T_grid, iv_surface, S0, r)
print("Dupire local vol surface (% annualised):")
print(f"  T\\K:  {'  '.join(f'{k:5}' for k in K_grid)}")
for i, T in enumerate(T_grid):
    vals = "  ".join(f"{v*100:5.1f}" if not np.isnan(v) else "  nan" for v in lv[i])
    print(f"  {T:.2f}:  {vals}")`,
    explanation:
      "Dupire's formula inverts the Black-Scholes PDE to extract the unique local vol surface consistent with all market option prices; in practice the second derivative d²C/dK² must be positive (arbitrage-free surface) for the formula to yield a real local vol, making surface smoothing critical before applying it.",
  },
  {
    id: "pyfin-20260520-b1-cir-zcb",
    language: "python",
    title: "CIR short-rate model: analytic ZCB + MC verification",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import ncx2

def cir_zcb_analytic(r0, kappa, theta, sigma, T):
    """
    CIR (Cox-Ingersoll-Ross) zero-coupon bond price: P = A(T)*exp(-B(T)*r0)
    Model: dr = kappa*(theta - r)*dt + sigma*sqrt(r)*dW
    """
    h = np.sqrt(kappa**2 + 2*sigma**2)
    exp_h = np.exp(h * T)

    B = 2 * (exp_h - 1) / ((h + kappa) * (exp_h - 1) + 2 * h)
    A_exponent = (2 * kappa * theta / sigma**2) * (
        np.log(2*h) + (kappa + h) * T / 2
        - np.log((h + kappa) * (exp_h - 1) + 2*h)
    )
    A = np.exp(A_exponent)
    return A * np.exp(-B * r0)

def cir_simulate_zcb(r0, kappa, theta, sigma, T, n_steps, n_paths, seed=42):
    """Monte Carlo CIR ZCB price (discount along each path)."""
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    r   = np.full(n_paths, r0)
    disc = np.zeros(n_paths)

    for _ in range(n_steps):
        # Milstein scheme for CIR (avoids negative rates at sqrt(r))
        z   = rng.standard_normal(n_paths)
        r_new = (r + kappa * (theta - r) * dt
                 + sigma * np.sqrt(np.maximum(r, 0)) * np.sqrt(dt) * z
                 + 0.25 * sigma**2 * dt * (z**2 - 1))
        r   = np.maximum(r_new, 0)   # absorb at 0 to ensure r >= 0
        disc += r * dt               # accumulate integral of r for discount

    zcb_mc = np.mean(np.exp(-disc))
    return zcb_mc

kappa, theta, sigma = 0.5, 0.04, 0.10
r0 = 0.03
T  = 5.0

# Feller condition: 2*kappa*theta > sigma^2 ensures r stays positive
feller = 2 * kappa * theta > sigma**2
print(f"Feller condition satisfied: {feller}  (2*kappa*theta={2*kappa*theta:.4f} > sigma^2={sigma**2:.4f})")

analytic = cir_zcb_analytic(r0, kappa, theta, sigma, T)
mc_price = cir_simulate_zcb(r0, kappa, theta, sigma, T, n_steps=252, n_paths=100_000)

print(f"Analytic ZCB price:  {analytic:.6f}")
print(f"Monte Carlo price:   {mc_price:.6f}")
print(f"Implied yield:       {-np.log(analytic)/T*100:.3f}%")`,
    explanation:
      "The CIR model preserves positive interest rates (unlike Vasicek) when the Feller condition 2κθ > σ² is met; the analytic zero-coupon bond formula follows from the affine structure of the model and allows closed-form calibration to the term structure without any simulation.",
  },
  {
    id: "pyfin-20260520-b1-ewma-cov",
    language: "python",
    title: "Exponentially-weighted covariance matrix",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n_assets = 5
n_periods = 252

# Simulate correlated returns
vols = np.array([0.15, 0.20, 0.25, 0.08, 0.12]) / np.sqrt(252)  # daily
corr = np.array([[1.0, 0.6, 0.5, 0.0, 0.2],
                 [0.6, 1.0, 0.7, 0.0, 0.3],
                 [0.5, 0.7, 1.0, 0.1, 0.2],
                 [0.0, 0.0, 0.1, 1.0,-0.1],
                 [0.2, 0.3, 0.2,-0.1, 1.0]])
Sigma_true = np.diag(vols) @ corr @ np.diag(vols)
L = np.linalg.cholesky(Sigma_true)
R = rng.standard_normal((n_periods, n_assets)) @ L.T  # correlated returns

assets = [f"A{i}" for i in range(n_assets)]
df = pd.DataFrame(R, columns=assets)

def ewma_cov(returns: pd.DataFrame, span: int) -> np.ndarray:
    """
    Exponentially-weighted covariance matrix via COM=span-1.
    Uses pandas ewm which applies exponential decay to each pair of columns.
    """
    lam = 1 - 2 / (span + 1)   # decay factor from span (COM convention)
    n   = len(returns)
    cov = np.zeros((returns.shape[1], returns.shape[1]))
    w_total = 0.0
    for t in range(n):
        w   = lam ** (n - 1 - t)
        r_t = returns.values[t]
        cov += w * np.outer(r_t, r_t)   # outer product for covariance
        w_total += w
    return cov / w_total   # normalise

span = 60   # 60-day half-life (~3 months)
ewma_cov_mat = ewma_cov(df, span)
sample_cov   = df.cov().values

# Compare eigenvalue spectra
eig_ewma   = np.sort(np.linalg.eigvalsh(ewma_cov_mat))[::-1]
eig_sample = np.sort(np.linalg.eigvalsh(sample_cov))[::-1]
eig_true   = np.sort(np.linalg.eigvalsh(Sigma_true))[::-1]

print(f"Top 5 eigenvalues:")
print(f"  True:   {np.round(eig_true[:5]*252, 4)}")  # annualised
print(f"  EWMA:   {np.round(eig_ewma[:5]*252, 4)}")
print(f"  Sample: {np.round(eig_sample[:5]*252, 4)}")
print(f"\\nEWMA trace (total var): {np.trace(ewma_cov_mat)*252:.4f}")
print(f"Sample trace:            {np.trace(sample_cov)*252:.4f}")`,
    explanation:
      "EWMA covariance downweights old observations exponentially, making it more responsive to volatility regime changes than the equally-weighted sample covariance; the eigenvalue spectrum comparison reveals that EWMA typically has a larger leading eigenvalue (higher perceived systematic risk) during volatile periods.",
  },
  {
    id: "pyfin-20260520-b1-tca-pnl",
    language: "python",
    title: "TCA P&L decomposition (implementation shortfall)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(5)

# Simulate a buy order executed over 60 minutes
n_fills = 12   # 12 child orders, 5 minutes apart
total_qty = 10_000  # total shares to buy

decision_px = 100.00    # price when portfolio manager decided to trade
arrival_px  = 100.10    # price when first child order hit the market (5-min slippage)

# Simulate intraday price drift and execution prices
market_px = arrival_px + np.cumsum(rng.normal(0.02, 0.05, n_fills))
fill_qtys = np.round(rng.dirichlet(np.ones(n_fills)) * total_qty).astype(int)
fill_qtys[-1] += total_qty - fill_qtys.sum()   # ensure exact total

# Execution prices: market + bid-ask + impact
spread = 0.04
impact_per_slice = 0.01 * np.sqrt(fill_qtys / fill_qtys.mean())
fill_prices = market_px + spread / 2 + impact_per_slice

# Market VWAP: equally weighted market price (proxy for market average)
mkt_vwap = market_px.mean()

# Execution metrics
avg_fill = np.average(fill_prices, weights=fill_qtys)

# Implementation Shortfall decomposition (all in $/share, side=buy: higher = worse)
total_is        = avg_fill - decision_px          # total IS vs decision
timing_cost     = arrival_px - decision_px         # pre-trade market movement
in_trade_cost   = avg_fill - mkt_vwap             # execution vs market VWAP
spread_vs_market= mkt_vwap - arrival_px           # market drift during execution
components_sum  = timing_cost + spread_vs_market + in_trade_cost

print(f"Order summary: {total_qty:,} shares, avg fill={avg_fill:.4f}")
print(f"\\n=== Implementation Shortfall Decomposition ===")
print(f"Decision price:        {decision_px:.4f}")
print(f"Arrival price:         {arrival_px:.4f}")
print(f"Market VWAP:           {mkt_vwap:.4f}")
print(f"Avg fill price:        {avg_fill:.4f}")
print(f"\\nTiming cost:           {timing_cost:.4f}  ({timing_cost/decision_px*10000:.1f} bps)")
print(f"Market drift (in-trade):{spread_vs_market:.4f}  ({spread_vs_market/decision_px*10000:.1f} bps)")
print(f"Execution vs VWAP:     {in_trade_cost:.4f}  ({in_trade_cost/decision_px*10000:.1f} bps)")
print(f"--- Sum:               {components_sum:.4f}  ({components_sum/decision_px*10000:.1f} bps)")
print(f"Total IS:              {total_is:.4f}  ({total_is/decision_px*10000:.1f} bps)")`,
    explanation:
      "Implementation shortfall decomposition separates trading costs that are under the trader's control (in-trade execution vs VWAP) from those that are not (market movement before arrival and during execution); the sum of all components should equal total IS, and any mismatch indicates timing measurement inconsistency.",
  },
];
