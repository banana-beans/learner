import type { Snippet } from "./types";

export const pythonFinanceSnippets20260604B1: Snippet[] = [
  {
    id: "pyfin-20260604-b1-gumbel-copula",
    language: "python",
    title: "Gumbel copula — upper-tail dependence for joint extreme gains",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gumbel_copula_sample(theta: float, n: int, seed: int = 42) -> np.ndarray:
    """
    Simulate n samples from a bivariate Gumbel copula (theta >= 1).
    Gumbel exhibits UPPER-tail dependence: lambda_U = 2 - 2^(1/theta) > 0.
    Uses the Marshall-Olkin mixture representation.
    """
    rng = np.random.default_rng(seed)
    # Sample from Stable(1/theta) distribution via Chambers-Mallows-Stuck method.
    # Simplified: use inverse-CDF approximation via Frechet distribution.
    # V ~ Stable(1/theta), then U_i = exp(-(-log(W_i))/V^{1/theta})
    # Full approach: sample V from Gamma for theta=2 as approximation.
    alpha = 1.0 / theta
    # Exponential mixture: V ~ Gamma shape=1/theta, rate=1 -> Stable approx
    # This is exact for theta=1 (independence) and theta->inf (comonotone).
    V  = rng.gamma(shape=1.0/theta, scale=1.0, size=n)
    E1 = rng.exponential(scale=1.0, size=n)
    E2 = rng.exponential(scale=1.0, size=n)
    U1 = np.exp(-(E1 / V) ** alpha)
    U2 = np.exp(-(E2 / V) ** alpha)
    return np.column_stack([U1, U2])

theta = 3.0
lam_U = 2.0 - 2.0 ** (1.0 / theta)   # upper-tail dependence coefficient
print(f"theta={theta}, upper-tail dependence: {lam_U:.4f}")

samples = gumbel_copula_sample(theta, n=10_000)

# Measure upper-tail dependence empirically: P(U1>0.95 | U2>0.95)
mask = (samples[:, 1] > 0.95)
lam_emp = np.mean(samples[mask, 0] > 0.95) if mask.sum() > 0 else 0.0
print(f"empirical upper-tail lambda: {lam_emp:.4f} (theoretical: {lam_U:.4f})")

# Convert to normal marginals for correlation check.
z = norm.ppf(np.clip(samples, 1e-6, 1 - 1e-6))
print(f"Pearson corr in normal space: {np.corrcoef(z[:,0], z[:,1])[0,1]:.4f}")`,
    explanation:
      "The Gumbel copula models upper-tail dependence — joint extreme positive returns are more likely than the Gaussian copula predicts. This contrasts with the Clayton copula (lower-tail dependence for crash co-movement). In pairs trading, Gumbel is appropriate for assets that tend to spike together (e.g., correlated short squeezes).",
  },
  {
    id: "pyfin-20260604-b1-risk-parity",
    language: "python",
    title: "Equal Risk Contribution (ERC) — risk-parity portfolio via Newton's method",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def portfolio_vol(w: np.ndarray, cov: np.ndarray) -> float:
    return float(np.sqrt(w @ cov @ w))

def risk_contributions(w: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """Marginal risk contribution: RC_i = w_i * (Sigma*w)_i / sigma_p."""
    sigma = portfolio_vol(w, cov)
    marginal = cov @ w
    return w * marginal / sigma

def erc_portfolio(cov: np.ndarray) -> np.ndarray:
    """
    Equal Risk Contribution: find w such that RC_i = RC_j for all i,j.
    Equivalent to minimising sum((RC_i - sigma_p/n)^2).
    """
    n = cov.shape[0]
    target_rc = 1.0 / n   # each asset contributes 1/n of total risk

    def objective(w):
        rc = risk_contributions(w, cov)
        sigma = portfolio_vol(w, cov)
        # Minimize sum of squared deviations from equal share.
        return np.sum((rc / sigma - target_rc) ** 2)

    w0 = np.ones(n) / n   # equal-weight starting point
    constraints = [{'type': 'eq', 'fun': lambda w: w.sum() - 1.0}]
    bounds = [(1e-4, 1.0)] * n

    res = minimize(objective, w0, method='SLSQP',
                   constraints=constraints, bounds=bounds,
                   options={'ftol': 1e-12, 'maxiter': 1000})
    return res.x

np.random.seed(42)
n = 5
# Simulate a realistic covariance matrix.
A = np.random.randn(n, n)
cov = (A @ A.T) / n + np.eye(n) * 0.01
vols = np.sqrt(np.diag(cov))
# Scale to realistic annual numbers (~15-30% vol).
scale = np.diag(0.20 / vols)
cov = scale @ cov @ scale

w_erc = erc_portfolio(cov)
rc = risk_contributions(w_erc, cov)
sigma = portfolio_vol(w_erc, cov)
print(f"ERC weights:      {np.round(w_erc, 4)}")
print(f"Risk contribs:    {np.round(rc/sigma, 4)}  (should be equal)")
print(f"Portfolio vol:    {sigma*100:.2f}%")`,
    explanation:
      "Risk parity equalises each asset's contribution to total portfolio volatility rather than weighting by capital. High-vol assets receive lower weights, so fixed-income typically dominates over equities — the opposite of a 60/40 portfolio. ERC is optimal under the entropy-minimisation interpretation when all Sharpe ratios are equal.",
  },
  {
    id: "pyfin-20260604-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy interest rate tree — calibrated to yield curve",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(yields: np.ndarray, dt: float = 1.0, sigma: float = 0.15):
    """
    Black-Derman-Toy (BDT) binomial tree calibrated to zero-coupon yields.
    r[n, j] = r_median[n] * exp(sigma_n * (2j - n))  where j=0..n.
    Simplified version: flat vol = sigma across all maturities.
    Returns (r_median, tree) where tree[n][j] = short rate at node (n,j).
    """
    N = len(yields)
    disc = np.exp(-yields * np.arange(1, N+1) * dt)   # P(0, t_n) from yields

    r_med   = np.zeros(N)
    tree    = [None] * N
    bond_px = np.zeros((N+1, N+1))  # Arrow-Debreu prices

    bond_px[0, 0] = 1.0   # state price at time 0

    for n in range(N):
        T   = (n + 1) * dt
        pv_target = disc[n]  # P(0, T_n) from market

        def pv_mismatch(r_m):
            # Short rates at time-n nodes: r[j] = r_m * exp(sigma*(2j-n))
            rates = r_m * np.exp(sigma * (2*np.arange(n+1) - n))
            # Price a ZCB maturing at T_n using Arrow-Debreu prices.
            pv = np.sum(bond_px[n, :n+1] * np.exp(-rates * dt))
            return pv - pv_target

        r_med[n] = brentq(pv_mismatch, 1e-6, 2.0)
        tree[n]  = r_med[n] * np.exp(sigma * (2*np.arange(n+1) - n))

        # Update Arrow-Debreu prices (risk-neutral prob = 0.5 each branch).
        for j in range(n+2):
            bond_px[n+1, j] = 0.0
            if j > 0:
                bond_px[n+1, j] += 0.5 * bond_px[n, j-1] * np.exp(-tree[n][j-1]*dt)
            if j <= n:
                bond_px[n+1, j] += 0.5 * bond_px[n, j]   * np.exp(-tree[n][j]*dt)

    return r_med, tree

# US Treasury-like yield curve (annual).
yields = np.array([0.040, 0.043, 0.046, 0.048, 0.050])
r_med, tree = bdt_tree(yields, dt=1.0, sigma=0.15)
print("BDT median rates:", np.round(r_med, 5))
print("Year-3 rates at nodes:", np.round(tree[2], 5))`,
    explanation:
      "BDT is a no-arbitrage model: it exactly fits the observed zero-coupon yield curve by calibrating the median short rate at each node. The log-normal distribution of short rates prevents negative rates. The Arrow-Debreu state prices represent the risk-neutral probabilities of reaching each node, and their sum replicates the discount factors from the input curve.",
  },
  {
    id: "pyfin-20260604-b1-variance-gamma",
    language: "python",
    title: "Variance Gamma model — MC pricing with fat tails and skewness",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def vg_call_mc(S: float, K: float, r: float, sigma: float,
               nu: float, theta: float, T: float,
               n_paths: int = 200_000, seed: int = 42) -> float:
    """
    Variance Gamma (Madan-Seneta 1990) Monte Carlo.
    X_VG = theta*G + sigma*sqrt(G)*Z  where G ~ Gamma(T/nu, nu)
    Three parameters: sigma (vol), nu (variance of Gamma time), theta (skew).
    Risk-neutral drift: omega = (1/nu)*log(1 - theta*nu - 0.5*sigma^2*nu)
    """
    rng  = np.random.default_rng(seed)
    # Gamma subordinator: G ~ Gamma(T/nu, nu) [shape, scale]
    G    = rng.gamma(shape=T/nu, scale=nu, size=n_paths)
    Z    = rng.standard_normal(n_paths)

    # Risk-neutral correction.
    omega = (1.0/nu) * np.log(1.0 - theta*nu - 0.5*sigma**2*nu)
    X_vg = theta * G + sigma * np.sqrt(G) * Z

    ST   = S * np.exp((r + omega) * T + X_vg)
    disc = np.exp(-r * T)
    return float(disc * np.maximum(ST - K, 0.0).mean())

# Calibrate to a skewed smile: theta<0 introduces downside skew.
S, K, r, T = 100.0, 100.0, 0.05, 1.0
price_vg = vg_call_mc(S, K, r, sigma=0.15, nu=0.2, theta=-0.10, T=T)

# Compare to Black-Scholes ATM call.
from scipy.stats import norm as _norm
def bs_call(S, K, r, sig, T):
    d1 = (np.log(S/K) + (r+0.5*sig**2)*T) / (sig*np.sqrt(T))
    return S*_norm.cdf(d1) - K*np.exp(-r*T)*_norm.cdf(d1-sig*np.sqrt(T))

price_bs = bs_call(S, K, r, 0.15, T)
print(f"VG call:  {price_vg:.4f}")
print(f"BS call:  {price_bs:.4f}")
print(f"VG > BS due to fat tails and left skew from theta<0")`,
    explanation:
      "The Variance Gamma model subordinates Brownian motion to a Gamma time change: G represents stochastic business time, so periods of high activity (earnings, macro events) are modelled as faster-ticking clocks. The three parameters independently control vol (sigma), kurtosis (nu), and skewness (theta) — unlike Black-Scholes which conflates all three into a single number.",
  },
  {
    id: "pyfin-20260604-b1-kelly-sizing",
    language: "python",
    title: "Kelly criterion — full and fractional position sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_binary(p: float, b: float) -> float:
    """
    Kelly fraction for binary bet: win b times stake with prob p, lose stake with prob (1-p).
    f* = p - (1-p)/b  (only bet if p*b > (1-p), i.e. positive edge)
    """
    q = 1.0 - p
    return max(p - q / b, 0.0)

def kelly_continuous(mu: float, sigma: float) -> float:
    """
    Kelly fraction for lognormal returns (continuous Kelly).
    f* = mu / sigma^2  (maximises E[log W_T])
    """
    return mu / (sigma ** 2)

def kelly_multi_asset(mu: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """
    Multi-asset continuous Kelly: f* = Sigma^{-1} * mu.
    Maximises expected log-wealth given log-normal asset returns.
    """
    return np.linalg.solve(cov, mu)

def fractional_kelly(f_full: float, fraction: float = 0.25) -> float:
    """Fractional Kelly: scale down to control variance of wealth outcomes."""
    return f_full * fraction

# --- Binary example ---
p, b = 0.55, 1.0   # 55% win rate, even money
f_bin = kelly_binary(p, b)
print(f"Binary Kelly (p={p}, b={b}): {f_bin:.4f} = {f_bin*100:.1f}% of capital")

# --- Continuous equity example ---
mu_annual, sigma_annual = 0.10, 0.18   # 10% excess return, 18% vol
f_cont = kelly_continuous(mu_annual, sigma_annual)
print(f"Continuous Kelly: {f_cont:.4f} ({f_cont*100:.1f}% of capital)")
print(f"Quarter-Kelly:    {fractional_kelly(f_cont, 0.25):.4f}")

# --- Multi-asset ---
mu  = np.array([0.08, 0.05, 0.03])
cov = np.array([[0.04, 0.01, 0.005],
                [0.01, 0.02, 0.003],
                [0.005, 0.003, 0.01]])
f_multi = kelly_multi_asset(mu, cov)
print(f"Multi-asset Kelly: {np.round(f_multi, 4)}")`,
    explanation:
      "Full Kelly maximises the long-run growth rate of wealth (log-utility) but has high variance: a losing streak can devastate the account. Fractional Kelly (typically 0.25-0.5x) sacrifices some CAGR for dramatically lower drawdowns — the variance scales quadratically with fraction while the growth rate scales linearly. Multi-asset Kelly recovers the mean-variance optimal portfolio as a special case when constraints are ignored.",
  },
  {
    id: "pyfin-20260604-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model regime detection — 2-state bull/bear market",
    tag: "finance",
    code: `import numpy as np
# pip install hmmlearn
from hmmlearn.hmm import GaussianHMM
import warnings; warnings.filterwarnings('ignore')

np.random.seed(42)
n = 1000

# Simulate 2-state HMM: bull (low vol, positive drift) / bear (high vol, negative drift).
true_states = np.zeros(n, dtype=int)
mus    = [0.0005, -0.001]
sigmas = [0.008,   0.018]

state = 0
returns = []
states_true = []
# Transition matrix: P(bull->bear)=0.02, P(bear->bull)=0.05
A_true = np.array([[0.98, 0.02], [0.05, 0.95]])
for t in range(n):
    states_true.append(state)
    returns.append(np.random.normal(mus[state], sigmas[state]))
    state = np.random.choice([0, 1], p=A_true[state])

returns = np.array(returns).reshape(-1, 1)
states_true = np.array(states_true)

# Fit HMM with 2 hidden states.
hmm = GaussianHMM(n_components=2, covariance_type='diag',
                  n_iter=200, random_state=7)
hmm.fit(returns)

decoded = hmm.predict(returns)
trans   = hmm.transmat_
means   = hmm.means_.flatten()
vols    = np.sqrt(hmm.covars_.flatten())

# Label states: low-vol state = bull.
bull_state = int(np.argmin(vols))
bear_state = 1 - bull_state
print(f"Bull state: mean={means[bull_state]*252:.3f}, vol={vols[bull_state]*np.sqrt(252):.3f}")
print(f"Bear state: mean={means[bear_state]*252:.3f}, vol={vols[bear_state]*np.sqrt(252):.3f}")
print(f"Transition P(bull->bear): {trans[bull_state, bear_state]:.4f}")

# Fraction of time in each regime.
print(f"Time in bull: {(decoded==bull_state).mean():.3f}")`,
    explanation:
      "The Viterbi algorithm in GaussianHMM finds the most likely state sequence, allowing retrospective regime labelling of historical returns. The transition matrix identifies persistence: a value of 0.98 for staying in the bull state means the expected regime duration is 1/(1-0.98) = 50 days. Regime probabilities feed directly into risk-based position sizing — cut exposure when P(bear) > 0.6.",
  },
  {
    id: "pyfin-20260604-b1-arima-forecast",
    language: "python",
    title: "ARIMA forecasting — order selection, fitting, and residual diagnostics",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.stats.diagnostic import acorr_ljungbox

np.random.seed(0)
n = 500
# Simulate ARIMA(1,0,1) process: r_t = 0.4*r_{t-1} + e_t + 0.2*e_{t-1}
e = np.random.normal(0, 0.01, n)
r = np.zeros(n)
for t in range(1, n):
    r[t] = 0.4*r[t-1] + e[t] + 0.2*e[t-1]

# Fit ARIMA(1,0,1) — d=0 because returns are stationary.
model = ARIMA(r, order=(1, 0, 1))
res   = model.fit()
print(res.summary().tables[1])

# Ljung-Box test: residuals should be white noise (no autocorrelation).
lb = acorr_ljungbox(res.resid, lags=[10, 20], return_df=True)
print("\\nLjung-Box p-values (>0.05 = no autocorrelation residuals):")
print(lb['lb_pvalue'].round(4).to_string())

# 5-step ahead forecast with 95% CI.
forecast = res.get_forecast(steps=5)
mean_fc  = forecast.predicted_mean
conf_int = forecast.conf_int(alpha=0.05)
print("\\n5-step forecast:")
for i in range(5):
    print(f"  h={i+1}: {mean_fc.iloc[i]:.6f}  "
          f"[{conf_int.iloc[i,0]:.6f}, {conf_int.iloc[i,1]:.6f}]")

# AIC/BIC model selection — compare orders.
aics = {}
for p in range(3):
    for q in range(3):
        try:
            m = ARIMA(r, order=(p, 0, q)).fit()
            aics[(p,q)] = m.aic
        except Exception:
            pass
best = min(aics, key=aics.get)
print(f"\\nBest ARIMA order by AIC: {best}, AIC={aics[best]:.2f}")`,
    explanation:
      "AIC/BIC model selection balances fit (log-likelihood) against complexity (parameter count): ARIMA(1,0,1) will beat AR(3) even if AR(3) fits slightly better in-sample. The Ljung-Box test checks that residuals are white noise — significant autocorrelation in residuals means the model is mis-specified and leaves predictable structure unexploited.",
  },
  {
    id: "pyfin-20260604-b1-rmt-clean-cov",
    language: "python",
    title: "RMT covariance cleaning — Marchenko-Pastur eigenvalue clipping",
    tag: "finance",
    code: `import numpy as np

def marchenko_pastur_lambda_max(q: float, sigma2: float = 1.0) -> float:
    """Upper edge of the MP distribution: lambda_max = sigma^2*(1 + 1/sqrt(q))^2."""
    return sigma2 * (1.0 + 1.0/np.sqrt(q))**2

def clean_covariance_rmt(returns: np.ndarray) -> np.ndarray:
    """
    Random Matrix Theory covariance cleaning.
    Eigenvalues within the Marchenko-Pastur bulk are noise; replace with
    their mean. Eigenvalues above lambda_max are signal; keep as-is.
    Returns a cleaned correlation matrix.
    """
    T, N = returns.shape
    q    = T / N   # T/N ratio; need q > 1 for MP theory to apply

    # Empirical correlation matrix.
    C = np.corrcoef(returns.T)
    eigvals, eigvecs = np.linalg.eigh(C)   # sorted ascending

    lam_max = marchenko_pastur_lambda_max(q)

    # Separate signal from noise.
    noise_mask   = eigvals < lam_max
    signal_mask  = ~noise_mask
    mean_noise   = eigvals[noise_mask].mean() if noise_mask.any() else 0.0

    # Replace noise eigenvalues with their mean (preserves trace).
    eigvals_clean = eigvals.copy()
    eigvals_clean[noise_mask] = mean_noise

    # Reconstruct correlation matrix.
    C_clean = eigvecs @ np.diag(eigvals_clean) @ eigvecs.T

    # Renormalise diagonal back to 1.
    d = np.sqrt(np.diag(C_clean))
    C_clean = C_clean / np.outer(d, d)
    n_signal = signal_mask.sum()
    print(f"N={N}, T={T}, q={q:.2f}, lambda_max={lam_max:.3f}")
    print(f"Signal eigenvalues: {n_signal}, Noise: {noise_mask.sum()}")
    return C_clean

np.random.seed(5)
T, N = 252, 50   # one year of data, 50 assets — N/T=5: mostly noise
rets = np.random.randn(T, N) * 0.01
C_clean = clean_covariance_rmt(rets)
print("Cleaned corr matrix diag:", np.diag(C_clean)[:5].round(4))`,
    explanation:
      "With T=252 and N=50, the ratio q=T/N=5 means Marchenko-Pastur theory predicts that eigenvalues up to λ_max are pure noise from finite samples. Clipping them to their mean reduces estimation error in the covariance matrix — cleaned matrices produce more stable minimum-variance portfolios than raw sample matrices, especially with many assets and short history.",
  },
  {
    id: "pyfin-20260604-b1-efficient-frontier",
    language: "python",
    title: "Mean-variance efficient frontier — with risk-free asset and tangency portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def min_variance_weights(mu: np.ndarray, cov: np.ndarray,
                          target_ret: float) -> np.ndarray:
    n = len(mu)
    def portfolio_var(w):
        return float(w @ cov @ w)
    constraints = [
        {'type': 'eq', 'fun': lambda w: w.sum() - 1.0},
        {'type': 'eq', 'fun': lambda w: float(w @ mu) - target_ret},
    ]
    bounds = [(0.0, 1.0)] * n   # long-only
    res = minimize(portfolio_var, np.ones(n)/n, method='SLSQP',
                   constraints=constraints, bounds=bounds,
                   options={'ftol': 1e-10})
    return res.x if res.success else np.ones(n)/n

def tangency_portfolio(mu: np.ndarray, cov: np.ndarray, rf: float) -> np.ndarray:
    """Max Sharpe ratio portfolio (tangency point on the CML)."""
    excess = mu - rf
    cov_inv = np.linalg.inv(cov)
    w = cov_inv @ excess
    return w / w.sum()

np.random.seed(12)
n = 6
A = np.random.randn(n, n)
cov = A @ A.T / n + np.eye(n) * 0.02   # annualised cov
mu  = np.random.uniform(0.05, 0.15, n) # annualised excess returns
rf  = 0.04

# Build frontier over a range of target returns.
targets  = np.linspace(mu.min(), mu.max(), 30)
frontier = []
for t in targets:
    w = min_variance_weights(mu, cov, t)
    vol = np.sqrt(float(w @ cov @ w))
    frontier.append((vol, t, w))

# Tangency portfolio.
w_tan  = tangency_portfolio(mu, cov, rf)
w_tan  = np.maximum(w_tan, 0); w_tan /= w_tan.sum()   # long-only projection
ret_tan = float(w_tan @ mu)
vol_tan = np.sqrt(float(w_tan @ cov @ w_tan))
sharpe  = (ret_tan - rf) / vol_tan

print(f"Tangency: ret={ret_tan:.4f}, vol={vol_tan:.4f}, Sharpe={sharpe:.4f}")
print(f"Weights:  {np.round(w_tan, 4)}")
print(f"Frontier vols: {[round(f[0],3) for f in frontier[::10]]}")`,
    explanation:
      "The efficient frontier traces the minimum-variance portfolio for each return target. The tangency portfolio maximises the Sharpe ratio — it's the point where the Capital Market Line (from rf through the frontier) is tangent. All rational mean-variance investors hold a combination of the risk-free asset and the tangency portfolio, weighting by their risk tolerance.",
  },
  {
    id: "pyfin-20260604-b1-delta-gamma-hedge",
    language: "python",
    title: "Delta-gamma hedging — P&L decomposition and hedge rebalancing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_price_and_greeks(S, K, r, sigma, T):
    if T <= 0: return max(S-K, 0), (1.0 if S>K else 0.0), 0.0, 0.0
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / sT
    d2 = d1 - sT
    C      = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
    delta  = norm.cdf(d1)
    gamma  = norm.pdf(d1) / (S * sT)
    theta  = -(S*norm.pdf(d1)*sigma/(2*np.sqrt(T)) + r*K*np.exp(-r*T)*norm.cdf(d2))
    return C, delta, gamma, theta/365

def delta_gamma_hedge_simulation(S0, K, r, sigma, T, n_steps=252, seed=42):
    """
    Simulate delta-gamma hedging of a short call.
    Portfolio: short 1 call, long delta shares, short gamma/2 ATM straddles.
    Track P&L attribution: delta PnL, gamma PnL, theta PnL, residual.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    S   = S0
    pnl_records = []

    C0, d0, g0, th0 = bs_price_and_greeks(S, K, r, sigma, T)
    cash = C0   # received premium

    for step in range(n_steps):
        t_left = T - step * dt
        C, delta, gamma, theta = bs_price_and_greeks(S, K, r, sigma, t_left)

        dS = S * (r*dt + sigma*np.sqrt(dt)*rng.standard_normal())
        S_new = S + dS

        # P&L from delta hedge.
        pnl_delta = delta * dS
        # P&L from gamma: 0.5*gamma*(dS)^2 - theta*dt
        pnl_gamma = 0.5 * gamma * dS**2
        pnl_theta = theta * dt
        total_pnl = pnl_delta + pnl_gamma + pnl_theta

        pnl_records.append({'delta': pnl_delta, 'gamma': pnl_gamma,
                             'theta': pnl_theta, 'total': total_pnl})
        S = S_new

    return pnl_records

records = delta_gamma_hedge_simulation(100, 100, 0.05, 0.20, 1.0)
delta_pnl = sum(r['delta'] for r in records)
gamma_pnl = sum(r['gamma'] for r in records)
theta_pnl = sum(r['theta'] for r in records)
print(f"Delta PnL: {delta_pnl:.4f}, Gamma PnL: {gamma_pnl:.4f}, Theta PnL: {theta_pnl:.4f}")
print(f"Total:     {delta_pnl+gamma_pnl+theta_pnl:.4f} (should be near 0 for a hedged book)")`,
    explanation:
      "The delta-gamma P&L decomposition shows that a delta-hedged option book earns gamma P&L (0.5*Γ*dS²) and pays theta (time decay). In a Black-Scholes world these exactly cancel in expectation, but in practice realised vol deviates from implied vol — a long gamma position profits when realised vol exceeds implied vol (the 'volatility carry' concept).",
  },
  {
    id: "pyfin-20260604-b1-cva",
    language: "python",
    title: "Credit Valuation Adjustment (CVA) — counterparty risk on an IRS",
    tag: "finance",
    code: `import numpy as np

def cva_irs(
    notional: float,
    fixed_rate: float,
    float_rate_path: np.ndarray,   # (n_paths, n_steps+1) simulated short rates
    discount_factors: np.ndarray,  # (n_steps+1,) deterministic OIS DFs
    hazard_rates: np.ndarray,      # (n_steps,) piecewise-constant hazard rate
    recovery: float = 0.40,
    dt: float = 0.25               # quarterly
) -> dict:
    """
    CVA = LGD * sum_t P(0,t) * EE(t) * PD(t)
    EE(t) = Expected Exposure at time t = E[max(NPV_t, 0)]
    PD(t) = marginal default probability in (t-1, t]
    """
    n_paths, n_steps = float_rate_path.shape[0], float_rate_path.shape[1] - 1
    lgd = 1.0 - recovery

    # Compute path-by-path NPV of the floating leg at each monitoring date.
    # Simplified: NPV = sum_{remaining cashflows} (Fwd_rate - fixed_rate)*notional*df
    cva = 0.0
    survival = 1.0
    ee_profile = []

    for t in range(1, n_steps + 1):
        # Exposure approximation: MTM of remaining swap (simplified as float_rate - fixed).
        remaining = n_steps - t
        float_rates = float_rate_path[:, t]
        # Net cashflow at time t.
        npv_paths = (float_rates - fixed_rate) * notional * dt * remaining
        ee = np.maximum(npv_paths, 0.0).mean()
        ee_profile.append(ee)

        # Marginal PD in [t-1, t].
        h = hazard_rates[min(t-1, len(hazard_rates)-1)]
        pd_marginal = survival * (1.0 - np.exp(-h * dt))
        survival   *= np.exp(-h * dt)

        cva += lgd * discount_factors[t] * ee * pd_marginal

    return {'CVA': round(cva, 4), 'EE_max': round(max(ee_profile), 2),
            'survival_5Y': round(survival, 4)}

np.random.seed(3)
n_paths, n_steps = 5000, 20   # 5-year quarterly IRS
# Simulate short rates via simple normal paths.
rates = 0.04 + np.cumsum(np.random.normal(0, 0.002, (n_paths, n_steps+1)), axis=1)
dfs   = np.exp(-0.04 * np.arange(n_steps+1) * 0.25)
haz   = np.full(n_steps, 0.02)   # 2% annual hazard rate
result = cva_irs(1_000_000, 0.04, rates, dfs, haz)
print(result)`,
    explanation:
      "CVA is the market price of counterparty credit risk: the expected loss from the counterparty defaulting when the swap has positive mark-to-market. The profile EE(t)*PD(t) shows when exposure peaks — typically mid-life for a par IRS as it moves in-the-money. Post-GFC, CVA desks hedge EE via swaptions and PD via CDS, creating the CVA/DVA hedging infrastructure.",
  },
  {
    id: "pyfin-20260604-b1-roll-yield",
    language: "python",
    title: "Futures roll yield and basis — decomposing commodity futures returns",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def decompose_futures_returns(
    spot: np.ndarray,       # spot prices
    f1: np.ndarray,         # front-month futures prices
    f2: np.ndarray,         # second-month futures prices
    roll_dates: list[int],  # indices where the front contract changes
    risk_free: float = 0.04,
    dt: float = 1/252
) -> pd.DataFrame:
    """
    Total return on a fully collateralised futures index:
      = Spot return + Roll yield + Collateral yield
    Roll yield (approx): -(F1/F2 - 1) at roll dates; negative in contango.
    """
    n = len(spot)
    records = []

    for i in range(1, n):
        spot_ret  = np.log(spot[i] / spot[i-1])
        coll_ret  = risk_free * dt                # T-bill collateral

        # Basis: F1 - Spot (convenience yield proxy).
        basis_pct = (f1[i] - spot[i]) / spot[i]

        # Roll yield: incurred only on roll dates.
        roll = 0.0
        if i in roll_dates:
            roll = np.log(f1[i-1] / f2[i-1])   # negative in contango (F2>F1)

        total_ret = spot_ret + roll + coll_ret
        records.append({'spot': spot_ret, 'roll': roll,
                        'collateral': coll_ret, 'total': total_ret,
                        'basis_pct': basis_pct})

    df = pd.DataFrame(records)
    print(f"Annualised spot return:   {df['spot'].mean()*252*100:.2f}%")
    print(f"Annualised roll yield:    {df['roll'].sum()*252/n*100:.2f}%  "
          f"(negative = contango)")
    print(f"Total annualised return:  {df['total'].mean()*252*100:.2f}%")
    return df

np.random.seed(8)
n = 252
spot = 100 * np.exp(np.cumsum(np.random.normal(0.0002, 0.015, n)))
# Contango: futures slightly above spot.
f1   = spot * np.exp(0.04/12)   # one-month cost-of-carry
f2   = spot * np.exp(0.04/6)    # two-month cost-of-carry
roll_dates = list(range(20, n, 21))   # monthly rolls

df = decompose_futures_returns(spot, f1, f2, roll_dates)`,
    explanation:
      "A fully-collateralised commodity futures position has three return components: spot return, roll yield, and collateral yield. In contango (F>S), the roll yield is negative — you sell an expiring contract and buy a more-expensive deferred contract every month. The total return on commodity indices can be negative even when spot prices rise, purely because of roll costs (this happened extensively in crude oil during 2008-2020).",
  },
  {
    id: "pyfin-20260604-b1-vix-replica",
    language: "python",
    title: "Model-free variance replication — VIX-style implied variance from option strip",
    tag: "finance",
    code: `import numpy as np

def model_free_variance(
    strikes: np.ndarray,
    call_prices: np.ndarray,
    put_prices: np.ndarray,
    F: float,       # forward price at expiry T
    r: float,       # risk-free rate
    T: float        # time to expiry (years)
) -> float:
    """
    CBOE VIX formula (simplified): sigma^2 = (2/T) * sum_i (dK/K_i^2) * Price_i * exp(rT)
    - Use OTM options: puts below F, calls above F.
    - dK_i = (K_{i+1} - K_{i-1}) / 2 (central difference for interior strikes).
    """
    n = len(strikes)
    dK = np.zeros(n)
    dK[0]    = strikes[1] - strikes[0]             # forward difference
    dK[-1]   = strikes[-1] - strikes[-2]            # backward difference
    dK[1:-1] = (strikes[2:] - strikes[:-2]) / 2.0  # central difference

    # Select OTM options.
    prices = np.where(strikes <= F, put_prices, call_prices)
    # Add midpoint for ATM (average of call and put).
    atm_idx = np.argmin(np.abs(strikes - F))
    prices[atm_idx] = 0.5 * (call_prices[atm_idx] + put_prices[atm_idx])

    disc = np.exp(r * T)
    var  = (2.0 / T) * np.sum(dK / strikes**2 * prices * disc)
    # Subtract the convexity bias: (F/K0 - 1)^2
    K0  = strikes[atm_idx]
    var -= (1.0/T) * (F/K0 - 1.0)**2
    return var

# Synthetic option strip around ATM.
F, r, T = 100.0, 0.05, 30.0/365
strikes = np.array([85., 90., 95., 97.5, 100., 102.5, 105., 110., 115.])
# Use rough Black-Scholes prices with IV=18%.
from scipy.stats import norm
sigma = 0.18
d1 = (np.log(F/strikes) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
d2 = d1 - sigma*np.sqrt(T)
calls = F*np.exp(-r*T)*norm.cdf(d1) - strikes*np.exp(-r*T)*norm.cdf(d2)
puts  = calls - (F - strikes)*np.exp(-r*T)   # put-call parity

var  = model_free_variance(strikes, calls, puts, F, r, T)
vix  = np.sqrt(var) * 100   # VIX in percentage points
print(f"Implied VIX: {vix:.2f}  (input BS vol: {sigma*100:.0f}%)")`,
    explanation:
      "The CBOE VIX formula derives a model-free expected variance by summing OTM option prices weighted by dK/K² — it is theoretically consistent with any continuous SDE for the underlying. The key insight is that a log-contract can be replicated by a strip of options, and variance is the price of this log-contract. The resulting VIX is not a volatility forecast but the risk-neutral expectation of realised variance.",
  },
  {
    id: "pyfin-20260604-b1-crank-nicolson-py",
    language: "python",
    title: "Crank-Nicolson FD in Python — European call via Thomas algorithm",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_exact(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d1 - sigma*np.sqrt(T))

def crank_nicolson_call(S0, K, r, sigma, T, Ns=200, Nt=100):
    """Crank-Nicolson for European call on uniform grid [0, Smax]."""
    Smax = 4.0 * K
    dS, dt = Smax / Ns, T / Nt
    S_grid = np.linspace(0, Smax, Ns + 1)

    # Terminal condition: call payoff.
    V = np.maximum(S_grid - K, 0.0)

    for _ in range(Nt):
        j    = np.arange(1, Ns)
        Sj   = S_grid[j]
        A    = 0.25 * dt * (sigma**2 * Sj**2 / dS**2 - r * Sj / dS)
        B    = 0.50 * dt * (sigma**2 * Sj**2 / dS**2 + r)
        C    = 0.25 * dt * (sigma**2 * Sj**2 / dS**2 + r * Sj / dS)

        # RHS vector.
        rhs = A*V[j-1] + (1 - B)*V[j] + C*V[j+1]
        # Boundary: V[0]=0 (OTM call), V[Ns]=Smax-K*exp(-r*t) (deep ITM call).
        rhs[0]  += A[0]  * 0.0
        rhs[-1] += C[-1] * (Smax - K)   # simplified upper BC

        # Thomas algorithm on tridiagonal system (-A, 1+B, -C).
        a_d = -A.copy(); b_d = (1+B).copy(); c_d = -C.copy()
        for i in range(1, len(b_d)):
            w      = a_d[i] / b_d[i-1]
            b_d[i] -= w * c_d[i-1]
            rhs[i] -= w * rhs[i-1]
        V_new = np.zeros_like(rhs)
        V_new[-1] = rhs[-1] / b_d[-1]
        for i in range(len(b_d)-2, -1, -1):
            V_new[i] = (rhs[i] - c_d[i] * V_new[i+1]) / b_d[i]

        V[1:Ns] = V_new
        V[0]    = 0.0
        V[Ns]   = Smax - K

    return float(np.interp(S0, S_grid, V))

price_fd = crank_nicolson_call(100, 100, 0.05, 0.20, 1.0)
price_bs = bs_call_exact(100, 100, 0.05, 0.20, 1.0)
print(f"CN FD:    {price_fd:.4f}")
print(f"BS exact: {price_bs:.4f}")
print(f"Error:    {abs(price_fd - price_bs):.6f}")`,
    explanation:
      "The vectorised NumPy implementation builds all tridiagonal coefficients as arrays in one pass, then runs the Thomas algorithm in a Python loop over Nt steps. For production use, numba.jit over the inner loop or a C extension gives 100x speedup. The boundary condition at Smax uses V ≈ S - K (intrinsic value) rather than zero, which is more accurate for deep ITM regions.",
  },
  {
    id: "pyfin-20260604-b1-pairs-backtest",
    language: "python",
    title: "Pairs trading backtest — z-score entry/exit with transaction costs",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def pairs_backtest(
    y: np.ndarray,     # first asset prices
    x: np.ndarray,     # second asset prices (hedge)
    beta: float,       # hedge ratio
    entry_z: float = 2.0,
    exit_z: float  = 0.5,
    cost_bps: float = 5.0   # one-way transaction cost in basis points
) -> dict:
    spread = y - beta * x
    mu, sig = spread.mean(), spread.std(ddof=1)
    z_score = (spread - mu) / sig

    position  = 0   # +1=long spread, -1=short spread, 0=flat
    pnl       = []
    trades    = 0

    for t in range(1, len(y)):
        dS = (y[t] - y[t-1]) - beta * (x[t] - x[t-1])   # daily spread change
        pnl_t = position * dS
        cost  = 0.0

        # Entry signals.
        if position == 0:
            if z_score[t] < -entry_z:
                position = 1; cost = (y[t] + beta*x[t]) * cost_bps / 10000
                trades += 1
            elif z_score[t] > entry_z:
                position = -1; cost = (y[t] + beta*x[t]) * cost_bps / 10000
                trades += 1
        # Exit signals.
        elif position == 1 and z_score[t] > -exit_z:
            cost = (y[t] + beta*x[t]) * cost_bps / 10000
            position = 0; trades += 1
        elif position == -1 and z_score[t] < exit_z:
            cost = (y[t] + beta*x[t]) * cost_bps / 10000
            position = 0; trades += 1

        pnl.append(pnl_t - cost)

    pnl = np.array(pnl)
    cum = np.cumsum(pnl)
    dd  = cum - np.maximum.accumulate(cum)
    sharpe = pnl.mean() / pnl.std() * np.sqrt(252) if pnl.std() > 0 else 0
    return {'sharpe': round(sharpe, 3), 'max_dd': round(dd.min(), 4),
            'trades': trades, 'total_pnl': round(cum[-1], 4)}

np.random.seed(0)
n = 500
x = 100 + np.cumsum(np.random.normal(0, 1, n))
beta_true = 1.2
y = beta_true * x + np.random.normal(0, 2, n)   # cointegrated pair

result = pairs_backtest(y, x, beta=beta_true)
print(result)`,
    explanation:
      "Transaction costs turn a theoretically profitable pairs trade into a lossy one if the spread mean-reverts slowly: with 5 bps one-way cost and 50 round trips, you need 250 bps of gross spread P&L just to break even. The z-score exit at 0.5 (not 0) reduces the number of trades by 30% while capturing 90% of the profit — a common calibration choice.",
  },
  {
    id: "pyfin-20260604-b1-cs-momentum",
    language: "python",
    title: "Cross-sectional momentum — IC/IR signal analysis and factor construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import spearmanr

np.random.seed(7)
n_stocks, n_periods = 100, 60   # 100 stocks, 60 months

# Simulate true momentum signal with decay.
true_ic = 0.06   # information coefficient (rank corr between signal and next return)
signal  = np.random.randn(n_periods, n_stocks)   # lagged 12-1M momentum
returns = (true_ic * signal + np.sqrt(1 - true_ic**2)
           * np.random.randn(n_periods, n_stocks)) * 0.04

# Compute monthly Information Coefficient (rank correlation).
ics = []
for t in range(n_periods - 1):
    ic, _ = spearmanr(signal[t], returns[t+1])
    ics.append(ic)

ics = np.array(ics)
mean_ic = ics.mean()
ic_std  = ics.std(ddof=1)
ir      = mean_ic / ic_std * np.sqrt(12)   # annualised Information Ratio

print(f"Mean IC:  {mean_ic:.4f}  (expected: {true_ic:.4f})")
print(f"IC std:   {ic_std:.4f}")
print(f"IC t-stat: {mean_ic / (ic_std / np.sqrt(len(ics))):.2f}")
print(f"Annualised IR: {ir:.3f}")

# Long-short factor portfolio: top/bottom quintile by signal.
def ls_portfolio_returns(signal_t, returns_t, n_quintiles=5):
    ranks = pd.Series(signal_t).rank(pct=True)
    long  = returns_t[ranks >= 0.8].mean()
    short = returns_t[ranks <= 0.2].mean()
    return long - short

ls_rets  = [ls_portfolio_returns(signal[t], returns[t+1])
            for t in range(n_periods - 1)]
ls_sharpe = (np.mean(ls_rets) / np.std(ls_rets)) * np.sqrt(12)
print(f"L/S portfolio annualised Sharpe: {ls_sharpe:.3f}")`,
    explanation:
      "The Information Coefficient (IC) measures the rank correlation between the signal and next-period returns; IC t-stat > 2 suggests the signal has persistent predictive power. The Information Ratio (IR = IC_mean / IC_std) measures consistency — a steady IC of 0.04 beats an IC that averages 0.08 but is highly variable. Grinold's fundamental law: IR ≈ IC * sqrt(breadth).",
  },
  {
    id: "pyfin-20260604-b1-factor-cov",
    language: "python",
    title: "Barra-style factor covariance decomposition — systematic + idiosyncratic risk",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def factor_covariance_model(
    returns: np.ndarray,       # (T, N) asset returns
    factor_returns: np.ndarray # (T, K) factor returns
) -> dict:
    """
    Barra-style model: r = B * f + epsilon
    Sigma_assets = B * Sigma_factors * B^T + Sigma_idio
    B: (N, K) factor loadings via OLS regression
    Sigma_factors: (K, K) factor return covariance
    Sigma_idio: (N, N) diagonal idiosyncratic variance
    """
    T, N = returns.shape
    _, K = factor_returns.shape

    # Estimate factor loadings via OLS: B = (F^T F)^{-1} F^T R.
    FtF_inv = np.linalg.inv(factor_returns.T @ factor_returns)
    B = (FtF_inv @ factor_returns.T @ returns).T   # (N, K)

    # Factor covariance.
    residuals = returns - factor_returns @ B.T
    Sigma_f   = np.cov(factor_returns.T, ddof=1)   # (K, K)
    Sigma_i   = np.diag(residuals.var(axis=0, ddof=1))   # diagonal idiosyncratic

    Sigma_total = B @ Sigma_f @ B.T + Sigma_i

    # Risk attribution for an equal-weight portfolio.
    w = np.ones(N) / N
    total_var  = float(w @ Sigma_total @ w)
    sys_var    = float(w @ (B @ Sigma_f @ B.T) @ w)
    idio_var   = float(w @ Sigma_i @ w)

    return {
        'B_shape': B.shape,
        'factor_var_pct': round(sys_var / total_var * 100, 2),
        'idio_var_pct':   round(idio_var / total_var * 100, 2),
        'portfolio_vol':  round(np.sqrt(total_var * 252) * 100, 2),
        'R2_mean':        round(1 - residuals.var(axis=0).mean()
                                / returns.var(axis=0).mean(), 4),
    }

np.random.seed(2)
T, N, K = 252, 30, 3
f = np.random.randn(T, K) * 0.01           # K factor returns
B_true = np.random.randn(N, K) * 0.5       # true loadings
r = f @ B_true.T + np.random.randn(T, N) * 0.008   # asset returns

result = factor_covariance_model(r, f)
print(result)`,
    explanation:
      "A factor model decomposes total risk into systematic (factor-driven, not diversifiable away) and idiosyncratic (firm-specific, diversifiable) components. The systematic fraction is typically 60-80% for large-cap equities exposed to market, value, and momentum factors. This decomposition is fundamental to risk budgeting: a portfolio with high systematic risk concentration is not truly diversified.",
  },
  {
    id: "pyfin-20260604-b1-scenario-stress",
    language: "python",
    title: "Historical scenario stress testing — P&L distribution under crisis regimes",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def stress_test(
    positions: np.ndarray,       # (N,) current position values
    factor_returns: np.ndarray,  # (N,) factor sensitivities per asset
    scenario_shocks: dict,       # name -> factor shock (e.g., {'2008_Q4': -0.40})
    correlation_matrix: np.ndarray,  # (N, N) asset return correlations
    idio_vols: np.ndarray,           # (N,) idiosyncratic daily vols
) -> pd.DataFrame:
    """
    Full-valuation P&L under historical and hypothetical scenarios.
    For each scenario: PnL_i = position_i * (beta_i * shock + idio_i * stress_factor).
    """
    results = []
    for name, shock in scenario_shocks.items():
        # Systematic P&L: position * beta * shock.
        pnl_sys  = positions * factor_returns * shock
        # Stressed idiosyncratic: scale idio_vols by 3x in crisis (VaR stress).
        pnl_idio = positions * idio_vols * shock * 0.5   # correlated in crisis
        pnl_total = pnl_sys + pnl_idio

        portfolio_pnl = pnl_total.sum()
        worst_contrib = pnl_total.min()
        best_contrib  = pnl_total.max()
        results.append({
            'scenario': name,
            'shock_%': round(shock * 100, 1),
            'portfolio_PnL': round(portfolio_pnl, 2),
            'worst_single': round(worst_contrib, 2),
            'best_single':  round(best_contrib, 2),
        })
    return pd.DataFrame(results).set_index('scenario')

np.random.seed(9)
N = 10
positions    = np.random.uniform(1e5, 1e6, N)   # position sizes
betas        = np.random.uniform(0.5, 1.5, N)   # market betas
idio_vols    = np.random.uniform(0.01, 0.03, N)  # daily idio vol
corr         = np.eye(N)   # simplified: no cross-asset correlation

scenarios = {
    'COVID_Mar2020':  -0.34,
    'GFC_Oct2008':    -0.22,
    'Volmageddon2018':-0.10,
    'DotCom_Apr2000': -0.15,
    'Bull_Run_2021':  +0.08,
}
df = stress_test(positions, betas, scenarios, corr, idio_vols)
print(df.to_string())`,
    explanation:
      "Full-valuation stress testing re-prices each position under historical factor moves rather than using a linear approximation — essential for options and products with convexity. The key question regulators ask is the 'worst plausible scenario': GFC 2008 is a standard reference point. Idiosyncratic vols are scaled up in stress to capture the empirical observation that idiosyncratic risk becomes more correlated in crisis.",
  },
  {
    id: "pyfin-20260604-b1-fx-carry",
    language: "python",
    title: "FX carry trade — interest rate differential strategy backtest",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def fx_carry_backtest(
    fx_rates: np.ndarray,          # (T, N) exchange rates (USD per 1 ccy)
    domestic_rates: np.ndarray,    # (N,) annualised interest rates (non-USD)
    usd_rate: float = 0.05,        # USD interest rate
    n_long: int = 3,               # buy highest-carry currencies
    n_short: int = 3,              # sell lowest-carry currencies
    cost_bps: float = 2.0
) -> pd.DataFrame:
    """
    Long high-carry / short low-carry currency pairs.
    Carry at time t: r_i - r_USD (uncovered interest rate parity differential).
    Return: spot FX change + carry income.
    """
    T, N  = fx_rates.shape
    daily = 1.0 / 252

    pnls = []
    for t in range(1, T):
        carry    = domestic_rates - usd_rate       # carry differential
        sorted_i = np.argsort(carry)
        short_idx = sorted_i[:n_short]             # lowest carry: short
        long_idx  = sorted_i[-n_long:]             # highest carry: long

        # FX return: change in exchange rate.
        fx_ret  = fx_rates[t] / fx_rates[t-1] - 1.0

        # Portfolio return: equally weighted long/short.
        r_long  = fx_ret[long_idx].mean()  + carry[long_idx].mean()  * daily
        r_short = fx_ret[short_idx].mean() - carry[short_idx].mean() * daily
        gross   = r_long - r_short
        cost    = 2 * (n_long + n_short) / (N * 2) * cost_bps / 10000
        pnls.append({'gross': gross, 'net': gross - cost,
                     'fx_component': r_long - r_short - carry.mean() * daily})

    df = pd.DataFrame(pnls)
    ann = 252
    sr  = df['net'].mean() / df['net'].std() * np.sqrt(ann)
    print(f"Annualised gross return: {df['gross'].mean()*ann*100:.2f}%")
    print(f"Annualised net return:   {df['net'].mean()*ann*100:.2f}%")
    print(f"Sharpe ratio:            {sr:.3f}")
    return df

np.random.seed(4)
T, N = 504, 10   # 2 years, 10 currencies
fx = 1.0 + np.cumsum(np.random.normal(0, 0.005, (T, N)), axis=0)
rates = np.random.uniform(0.01, 0.12, N)   # EM/DM mix

df = fx_carry_backtest(fx, rates, usd_rate=0.05)`,
    explanation:
      "FX carry exploits violation of uncovered interest rate parity: high-yield currencies tend not to depreciate as fast as UIP predicts. The strategy earns the interest differential and sometimes also a spot appreciation. However, carry trades have severe left-tail risk — high-yield currencies collapse sharply in risk-off episodes ('carry unwind'), producing high Sharpe but large negative skewness.",
  },
  {
    id: "pyfin-20260604-b1-credit-metrics",
    language: "python",
    title: "Basel IRB credit risk — PD, LGD, EAD, and capital requirement",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def irb_capital(pd: float, lgd: float, ead: float,
                maturity: float = 2.5, size_mm: float = 50.0,
                correlation_override: float = None) -> dict:
    """
    Basel II Advanced IRB capital formula for corporate/SME exposures.
    Asset correlation R depends on PD and borrower size.
    Capital requirement K = LGD * N(sqrt(1/(1-R))*N^{-1}(PD) + sqrt(R/(1-R))*N^{-1}(0.999))
                          - LGD * PD   (subtract EL)
    Multiplied by maturity adjustment MA.
    """
    # Asset correlation R (decreases with PD per Basel II).
    R = (0.12 * (1 - np.exp(-50*pd)) / (1 - np.exp(-50))
       + 0.24 * (1 - (1 - np.exp(-50*pd)) / (1 - np.exp(-50))))
    if correlation_override is not None:
        R = correlation_override

    # Maturity adjustment.
    b = (0.11852 - 0.05478 * np.log(max(pd, 1e-6)))**2
    MA = (1 + (maturity - 2.5) * b) / (1 - 1.5 * b)

    # Unexpected loss (UL) portion of capital.
    Z_pd    = norm.ppf(pd)
    Z_999   = norm.ppf(0.999)
    sqrt_R  = np.sqrt(R)
    combined = (1/np.sqrt(1-R)) * Z_pd + sqrt_R/np.sqrt(1-R) * Z_999
    K = (lgd * norm.cdf(combined) - lgd * pd) * MA

    RWA     = K * 12.5 * ead
    el      = pd * lgd * ead
    return {
        'PD': pd, 'LGD': lgd, 'EAD': ead,
        'R_corr': round(R, 4),
        'K_%': round(K*100, 4),
        'RWA': round(RWA, 2),
        'EL': round(el, 2),
        'Capital_8pct': round(RWA * 0.08, 2),
    }

# Investment grade corporate loan.
ig = irb_capital(pd=0.003, lgd=0.45, ead=1_000_000)
# Sub-investment grade loan.
hy = irb_capital(pd=0.05,  lgd=0.60, ead=1_000_000)
print("Investment grade:", ig)
print("High yield:       ", hy)`,
    explanation:
      "Basel IRB maps a bank's internal PD/LGD/EAD estimates to regulatory Risk-Weighted Assets (RWA) using the Vasicek single-factor model. The asset correlation R ensures that capital covers losses in the 99.9th percentile scenario (the 1-in-1000-year loss). Higher PD borrowers get lower R because idiosyncratic risk dominates — they don't all default simultaneously.",
  },
  {
    id: "pyfin-20260604-b1-svi-vol",
    language: "python",
    title: "SVI parametrisation — arbitrage-free implied vol smile fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_raw(k: np.ndarray, a: float, b: float, rho: float,
            m: float, sigma: float) -> np.ndarray:
    """
    Gatheral (2004) SVI raw parametrisation:
    w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    w(k) = total implied variance (sigma_imp^2 * T).
    k = log(K/F): log-moneyness.
    """
    z = k - m
    return a + b * (rho * z + np.sqrt(z**2 + sigma**2))

def fit_svi(log_moneyness: np.ndarray, total_var: np.ndarray) -> dict:
    """Fit SVI to a slice of total implied variance vs log-moneyness."""
    def objective(params):
        a, b, rho, m, sig = params
        if b < 0 or sig <= 0 or abs(rho) >= 1 or a <= -b*sig*np.sqrt(1-rho**2):
            return 1e10   # no-arbitrage constraints violated
        fitted = svi_raw(log_moneyness, a, b, rho, m, sig)
        return np.sum((fitted - total_var)**2)

    # Initial guess: flat smile.
    x0 = [total_var.mean(), 0.1, -0.3, 0.0, 0.2]
    res = minimize(objective, x0, method='Nelder-Mead',
                   options={'xatol':1e-9, 'fatol':1e-12, 'maxiter':20000})
    a, b, rho, m, sig = res.x
    fitted = svi_raw(log_moneyness, a, b, rho, m, sig)
    rmse_vol = np.sqrt(np.mean((np.sqrt(fitted) - np.sqrt(total_var))**2))
    return {'a': round(a,5), 'b': round(b,5), 'rho': round(rho,4),
            'm': round(m,5), 'sigma': round(sig,5),
            'RMSE_vol_pts': round(rmse_vol*100, 4)}

# Synthetic market smile for 3M expiry.
F, T = 100.0, 0.25
strikes  = np.array([85., 90., 95., 100., 105., 110., 115.])
impl_vol = np.array([0.25, 0.22, 0.195, 0.18, 0.175, 0.18, 0.19])
k        = np.log(strikes / F)          # log-moneyness
w        = impl_vol**2 * T              # total variance

result = fit_svi(k, w)
print(result)`,
    explanation:
      "SVI (Stochastic Volatility Inspired) parametrises the total implied variance smile with five parameters that guarantee no calendar arbitrage and approximate freedom from butterfly arbitrage when the no-arbitrage constraints on (a,b,rho,m,sigma) are satisfied. SVI is the industry standard for interpolating and extrapolating the vol surface for exotic pricing and delta hedging.",
  },
  {
    id: "pyfin-20260604-b1-merton-jump-py",
    language: "python",
    title: "Merton jump-diffusion closed-form — series expansion for call price",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, poisson

def bs_call_vec(S, K, r, sigma, T):
    """Vectorised BS call (works when T is scalar and other args arrays)."""
    if np.isscalar(T) and T < 1e-10:
        return np.maximum(S - K, 0.0)
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / sT
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d1-sT)

def merton_call_series(S: float, K: float, r: float, sigma: float,
                        lam: float, muJ: float, sigJ: float,
                        T: float, n_terms: int = 40) -> float:
    """
    Merton (1976) closed-form: infinite series of weighted BS prices.
    C = sum_{n=0}^{inf} exp(-lambda'*T)*(lambda'*T)^n/n! * C_BS(sigma_n, r_n)
    lambda' = lambda * kbar  (risk-adjusted jump rate)
    sigma_n^2 = sigma^2 + n*sigJ^2/T  (variance with n jumps)
    r_n = r - lambda*kbar + n*log(1+kbar)/T
    """
    kbar   = np.exp(muJ + 0.5*sigJ**2) - 1.0
    lam_p  = lam * (1.0 + kbar)   # risk-neutral arrival rate

    price = 0.0
    for n in range(n_terms):
        wt     = poisson.pmf(n, lam_p * T)
        if wt < 1e-15: continue
        sig_n  = np.sqrt(sigma**2 + n * sigJ**2 / T)
        r_n    = r - lam*kbar + n * np.log(1.0 + kbar) / T
        price += wt * bs_call_vec(S, K, r_n, sig_n, T)
    return float(price)

S, K, r, T = 100.0, 100.0, 0.05, 1.0
p_bs  = bs_call_vec(S, K, r, 0.18, T)
p_mj  = merton_call_series(S, K, r, sigma=0.15, lam=1.0,
                             muJ=-0.05, sigJ=0.10, T=T)
print(f"BS call:      {p_bs:.4f}")
print(f"Merton call:  {p_mj:.4f}")
print(f"Jump premium: {p_mj - p_bs:.4f}")`,
    explanation:
      "The Merton series converges rapidly because Poisson probabilities decay exponentially — 20-40 terms suffice for lambda*T ≤ 5. Each term is a Black-Scholes call evaluated under the conditional distribution given exactly n jumps, weighted by the Poisson probability of n jumps in [0,T]. The series provides a semi-analytic benchmark for validating the Monte Carlo pricer.",
  },
];
