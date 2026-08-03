import type { Snippet } from "./types";

export const pythonFinanceSnippets20260803B1: Snippet[] = [
  {
    id: "pyfin-20260803-b1-johansen-coint",
    language: "python",
    title: "Johansen Cointegration Test for Pairs Trading",
    tag: "stat-arb",
    code: `import numpy as np
from statsmodels.tsa.vector_ar.vecm import coint_johansen

def johansen_hedge_ratio(s1: np.ndarray, s2: np.ndarray) -> float:
    """Return hedge ratio beta such that s1 - beta*s2 is stationary."""
    data = np.column_stack([s1, s2])
    result = coint_johansen(data, det_order=0, k_ar_diff=1)
    # First eigenvector (highest eigenvalue) gives the hedge weights
    evec = result.evec[:, 0]
    return -evec[1] / evec[0]

# Usage
import numpy as np
rng = np.random.default_rng(42)
t   = np.arange(500)
z   = np.cumsum(rng.normal(0, 1, 500))   # common factor
s1  = 2.0 * z + rng.normal(0, 0.5, 500)
s2  = 1.0 * z + rng.normal(0, 0.5, 500)
beta = johansen_hedge_ratio(s1, s2)
spread = s1 - beta * s2
print(f"Hedge ratio: {beta:.4f}, spread std: {spread.std():.4f}")`,
    explanation: "The Johansen test finds the linear combination of multiple I(1) series that is I(0). The first eigenvector of the trace-statistic matrix gives the cointegrating vector, whose ratio defines the hedge ratio for pairs or basket trading."
  },
  {
    id: "pyfin-20260803-b1-kalman-hedge",
    language: "python",
    title: "Kalman Filter for Dynamic Hedge Ratio",
    tag: "stat-arb",
    code: `import numpy as np

def kalman_hedge_ratio(s1: np.ndarray, s2: np.ndarray,
                       delta: float = 1e-4, Ve: float = 0.001):
    """Track time-varying hedge ratio beta via Kalman filter."""
    n = len(s1)
    beta  = np.zeros(n)
    P     = np.ones(n)       # state variance
    Vw    = delta / (1 - delta)   # process noise
    beta[0], P[0] = 0.0, 1.0

    for t in range(1, n):
        # Predict
        beta_pred = beta[t-1]
        P_pred    = P[t-1] + Vw
        # Update
        y_pred  = beta_pred * s2[t]
        innov   = s1[t] - y_pred
        S       = s2[t]**2 * P_pred + Ve
        K       = P_pred * s2[t] / S
        beta[t] = beta_pred + K * innov
        P[t]    = (1 - K * s2[t]) * P_pred
    return beta

rng = np.random.default_rng(0)
z = np.cumsum(rng.normal(0, 1, 300))
s1 = 2.0 * z + rng.normal(0, 0.3, 300)
s2 = 1.0 * z + rng.normal(0, 0.3, 300)
betas = kalman_hedge_ratio(s1, s2)
print(f"Final beta={betas[-1]:.4f} (true=2.0)")`,
    explanation: "A scalar Kalman filter treats the hedge ratio as a latent state that evolves as a random walk. The gain K determines how quickly the estimate tracks regime changes: larger delta increases process noise, making the filter more responsive but noisier."
  },
  {
    id: "pyfin-20260803-b1-kelly-criterion",
    language: "python",
    title: "Kelly Criterion with Estimation Risk",
    tag: "portfolio",
    code: `import numpy as np

def kelly_fraction(mu: float, sigma: float, f_cap: float = 0.25) -> float:
    """Full-Kelly fraction f* = mu/sigma^2, capped at f_cap."""
    return min(mu / sigma**2, f_cap)

def half_kelly(mu: float, sigma: float) -> float:
    return kelly_fraction(mu, sigma) / 2.0

def multi_asset_kelly(mu: np.ndarray, Sigma: np.ndarray,
                      f_scale: float = 0.5) -> np.ndarray:
    """Continuous-time multi-asset Kelly: f* = Sigma^-1 mu."""
    f_full = np.linalg.solve(Sigma, mu)
    return f_scale * f_full

# Example
mu    = np.array([0.10, 0.08, 0.12])
Sigma = np.array([[0.04, 0.01, 0.005],
                  [0.01, 0.03, 0.006],
                  [0.005, 0.006, 0.05]])
f = multi_asset_kelly(mu, Sigma, f_scale=0.5)
print("Half-Kelly allocations:", np.round(f, 4))
print("Sum of weights:", f.sum().round(4))`,
    explanation: "Kelly maximises the expected log-wealth growth rate. The multi-asset version inverts the covariance matrix times expected returns. Half-Kelly halves the theoretically optimal bet to reduce variance of wealth at the cost of slightly lower expected growth."
  },
  {
    id: "pyfin-20260803-b1-fama-french",
    language: "python",
    title: "Fama-French Three-Factor Model Estimation",
    tag: "factor-models",
    code: `import numpy as np
from numpy.linalg import lstsq

def fama_french_betas(ret: np.ndarray, mkt: np.ndarray,
                      smb: np.ndarray, hml: np.ndarray):
    """OLS regression of excess return on FF3 factors."""
    X = np.column_stack([np.ones(len(ret)), mkt, smb, hml])
    betas, res, _, _ = lstsq(X, ret, rcond=None)
    ss_res = res[0] if len(res) else np.sum((ret - X @ betas)**2)
    ss_tot = np.sum((ret - ret.mean())**2)
    r2 = 1 - ss_res / ss_tot
    return dict(alpha=betas[0], beta_mkt=betas[1],
                beta_smb=betas[2], beta_hml=betas[3], r2=r2)

rng = np.random.default_rng(7)
n = 120
mkt = rng.normal(0.005, 0.04, n)
smb = rng.normal(0.002, 0.02, n)
hml = rng.normal(0.001, 0.02, n)
ret = 0.001 + 1.1*mkt + 0.3*smb - 0.2*hml + rng.normal(0, 0.01, n)
result = fama_french_betas(ret, mkt, smb, hml)
print(result)`,
    explanation: "Fama-French three-factor model augments CAPM with SMB (small-minus-big) and HML (high-minus-low) factors that capture size and value premia. OLS estimates alpha (abnormal return) and loadings on each factor. R² measures how much cross-sectional return variation the factors explain."
  },
  {
    id: "pyfin-20260803-b1-sabr-calib",
    language: "python",
    title: "SABR Calibration via Hagan Approximation",
    tag: "vol-surface",
    code: `import numpy as np
from scipy.optimize import minimize

def hagan_sabr_iv(F, K, T, alpha, beta, rho, nu):
    eps = 1e-7
    if abs(F - K) < eps:
        FK_beta = F**(1 - beta)
        numer = alpha * (1 + ((1-beta)**2/24 * alpha**2/FK_beta**2
                              + rho*beta*nu*alpha/(4*FK_beta)
                              + (2-3*rho**2)*nu**2/24) * T)
        return numer / FK_beta
    z   = (nu/alpha) * (F*K)**((1-beta)/2) * np.log(F/K)
    xz  = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A   = alpha / ((F*K)**((1-beta)/2) *
                   (1 + (1-beta)**2/24*np.log(F/K)**2
                      + (1-beta)**4/1920*np.log(F/K)**4))
    B   = (1 + ((1-beta)**2/24 * alpha**2/((F*K)**(1-beta))
                + rho*beta*nu*alpha/(4*(F*K)**((1-beta)/2))
                + (2-3*rho**2)*nu**2/24) * T)
    return A * (z/xz) * B

def calibrate_sabr(F, Ks, T, market_ivs, beta=0.5):
    def err(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e6
        model = np.array([hagan_sabr_iv(F, K, T, alpha, beta, rho, nu) for K in Ks])
        return np.sum((model - market_ivs)**2)
    res = minimize(err, [0.2, -0.3, 0.5], method='Nelder-Mead')
    return dict(alpha=res.x[0], rho=res.x[1], nu=res.x[2])

F, T = 100.0, 1.0
Ks   = np.array([85, 90, 95, 100, 105, 110, 115], dtype=float)
ivs  = np.array([0.28, 0.25, 0.22, 0.20, 0.21, 0.23, 0.26])
params = calibrate_sabr(F, Ks, T, ivs)
print(params)`,
    explanation: "SABR (Stochastic Alpha Beta Rho) is a stochastic volatility model. The Hagan et al. closed-form approximation maps SABR parameters (alpha, beta, rho, nu) to implied vols. Calibration minimises the sum of squared errors between model and market implied vols using Nelder-Mead."
  },
  {
    id: "pyfin-20260803-b1-antithetic-mc",
    language: "python",
    title: "Antithetic Variates for Variance Reduction in MC",
    tag: "derivatives",
    code: `import numpy as np

def mc_eu_call_antithetic(S0, K, r, sigma, T, n_paths=200_000):
    rng = np.random.default_rng(42)
    Z   = rng.standard_normal(n_paths // 2)
    # GBM terminal price for +Z and -Z (antithetic)
    factor = np.exp((r - 0.5*sigma**2)*T)
    ST_p = S0 * factor * np.exp(sigma * np.sqrt(T) *  Z)
    ST_m = S0 * factor * np.exp(sigma * np.sqrt(T) * -Z)
    pay_p = np.maximum(ST_p - K, 0.0)
    pay_m = np.maximum(ST_m - K, 0.0)
    paired = 0.5 * (pay_p + pay_m)
    price  = np.exp(-r*T) * paired.mean()
    se     = np.exp(-r*T) * paired.std() / np.sqrt(len(paired))
    return price, se

price, se = mc_eu_call_antithetic(100, 100, 0.05, 0.2, 1.0)
print(f"Price: {price:.4f}  SE: {se:.6f}")

# Naive for comparison
def mc_naive(S0, K, r, sigma, T, n_paths=200_000):
    rng = np.random.default_rng(42)
    Z   = rng.standard_normal(n_paths)
    ST  = S0 * np.exp((r-0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    pay = np.maximum(ST - K, 0)
    return np.exp(-r*T)*pay.mean(), np.exp(-r*T)*pay.std()/np.sqrt(n_paths)

p2, se2 = mc_naive(100, 100, 0.05, 0.2, 1.0)
print(f"Naive SE: {se2:.6f}  Ratio: {se2/se:.2f}x")`,
    explanation: "Antithetic variates pairs each random draw Z with its mirror -Z. Because the payoff is monotone in S_T, the two payoffs are negatively correlated, which can reduce variance by 50-80 % compared to naive Monte Carlo for European options — halving the sample size needed for a given SE target."
  },
  {
    id: "pyfin-20260803-b1-ewma-var",
    language: "python",
    title: "EWMA VaR and Expected Shortfall",
    tag: "risk",
    code: `import numpy as np

def ewma_var_es(returns: np.ndarray, lam: float = 0.94,
                conf: float = 0.99) -> tuple[float, float]:
    """
    Parametric EWMA VaR and ES.
    lam: decay factor (RiskMetrics default 0.94 daily)
    conf: confidence level
    """
    from scipy.stats import norm
    n   = len(returns)
    # EWMA variance (recursive)
    sig2 = returns[0]**2
    for r in returns[1:]:
        sig2 = lam * sig2 + (1 - lam) * r**2
    sig = np.sqrt(sig2)
    z   = norm.ppf(1 - conf)          # negative quantile
    VaR = -sig * z                    # positive number = loss
    ES  = sig * norm.pdf(z) / (1 - conf)
    return VaR, ES

rng = np.random.default_rng(1)
rets = rng.normal(0, 0.01, 500)
VaR, ES = ewma_var_es(rets, lam=0.94, conf=0.99)
print(f"1-day 99% VaR: {VaR*100:.4f}%")
print(f"1-day 99% ES : {ES*100:.4f}%")`,
    explanation: "EWMA (RiskMetrics) estimates volatility by exponentially downweighting older squared returns with decay factor lambda=0.94. Parametric VaR assumes conditional normality: VaR = sigma * z_{1-alpha}. ES (CVaR) is the average loss beyond VaR and equals sigma * phi(z)/(1-alpha) under normality."
  },
  {
    id: "pyfin-20260803-b1-regime-hmm",
    language: "python",
    title: "Hidden Markov Regime Switching for Volatility",
    tag: "macro",
    code: `import numpy as np
from hmmlearn import hmm

def fit_volatility_regimes(log_returns: np.ndarray, n_states: int = 2):
    model = hmm.GaussianHMM(n_components=n_states, covariance_type="diag",
                             n_iter=200, random_state=42)
    X = log_returns.reshape(-1, 1)
    model.fit(X)
    states = model.predict(X)
    means  = model.means_.flatten()
    stds   = np.sqrt(model.covars_.flatten())
    return states, means, stds, model

rng = np.random.default_rng(3)
n   = 500
# Simulate two-regime returns
regime = np.zeros(n, dtype=int)
r      = np.zeros(n)
for t in range(1, n):
    # Transition: 0->1 with p=0.02, 1->0 with p=0.05
    if regime[t-1] == 0:
        regime[t] = 1 if rng.random() < 0.02 else 0
    else:
        regime[t] = 0 if rng.random() < 0.05 else 1
    sig = 0.01 if regime[t] == 0 else 0.03
    r[t] = rng.normal(0, sig)

states, means, stds, model = fit_volatility_regimes(r)
print("Detected state means:", means.round(5))
print("Detected state stds :", stds.round(5))
print("Transition matrix:\\n", model.transmat_.round(3))`,
    explanation: "A Gaussian HMM models returns as drawn from a mixture of Gaussian emission distributions with Markov state transitions. EM fitting (Baum-Welch) estimates transition probabilities and emission parameters. In practice regime 0 captures low-vol (trending) markets and regime 1 high-vol (crisis) markets."
  },
  {
    id: "pyfin-20260803-b1-dupire-localvol",
    language: "python",
    title: "Dupire Local Volatility from Call Price Surface",
    tag: "vol-surface",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(Ks: np.ndarray, Ts: np.ndarray,
                     C: np.ndarray, r: float, S0: float) -> np.ndarray:
    """
    Dupire (1994): sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) /
                                       (0.5*K^2*d2C/dK2)
    C[i,j] = call price at Ks[j], Ts[i]
    """
    spl  = RectBivariateSpline(Ts, Ks, C, kx=3, ky=3)
    dCdT = spl(Ts, Ks, dx=1, dy=0)    # shape (nT, nK)
    dCdK = spl(Ts, Ks, dx=0, dy=1)
    d2CdK2 = spl(Ts, Ks, dx=0, dy=2)
    # Broadcast K across time axis
    K2d = Ks[np.newaxis, :]
    numer = dCdT + r * K2d * dCdK
    denom = 0.5 * K2d**2 * d2CdK2
    local_var = np.where(np.abs(denom) > 1e-8, numer / denom, np.nan)
    return np.sqrt(np.clip(local_var, 0, None))

# Toy surface
Ks = np.linspace(80, 120, 9)
Ts = np.linspace(0.1, 2.0, 8)
from scipy.stats import norm
def bs_call(S, K, T, r, sig):
    d1 = (np.log(S/K)+(r+0.5*sig**2)*T)/(sig*np.sqrt(T))
    d2 = d1 - sig*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
S0, r_val = 100.0, 0.05
C_grid = np.array([[bs_call(S0, K, T, r_val, 0.20) for K in Ks] for T in Ts])
lv = dupire_local_vol(Ks, Ts, C_grid, r_val, S0)
print("Local vol slice (T=1):", lv[4].round(4))`,
    explanation: "Dupire's formula derives a unique local volatility surface from the observed call price surface such that the model prices reproduce all market call prices exactly. Numerical differentiation via bicubic spline interpolation gives the required dC/dT and d²C/dK² terms."
  },
  {
    id: "pyfin-20260803-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Short-Rate Tree",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(maturities: list[float], yields: list[float],
             vols: list[float], dt: float = 1.0):
    """Calibrate BDT log-normal short-rate tree to yield curve."""
    n = len(maturities)
    # Bond prices from yields
    P = [np.exp(-y * T) for y, T in zip(yields, maturities)]
    r = np.zeros((n, n))   # r[t, j] = short rate at step t, node j (up=j)
    # Step 0: r[0,0] calibrated to first bond
    r[0, 0] = yields[0]

    for t in range(1, n):
        sig = vols[t-1]
        # r[t,j] = r[t,0] * exp(2*sig*j*sqrt(dt))
        def price_err(r0):
            rt = np.array([r0 * np.exp(2*sig*j*np.sqrt(dt))
                           for j in range(t+1)])
            # Roll back discount factors (risk-neutral p=0.5)
            V = np.ones(t+1)
            for step in range(t-1, -1, -1):
                V_new = np.zeros(step+1)
                for j in range(step+1):
                    V_new[j] = 0.5*(V[j] + V[j+1]) / (1 + r[step, j]*dt)
                V = V_new
            disc = V[0] / (1 + r0*dt)
            return disc - P[t]
        r[t, 0] = brentq(price_err, 1e-6, 0.5)
        for j in range(1, t+1):
            r[t, j] = r[t, 0] * np.exp(2*sig*j*np.sqrt(dt))
    return r

mats = [1, 2, 3, 4, 5]
ylds = [0.03, 0.035, 0.04, 0.043, 0.045]
vols = [0.20, 0.19, 0.18, 0.17, 0.16]
tree = bdt_tree(mats, ylds, vols)
print("BDT tree (rates):")
for t in range(len(mats)):
    row = [f"{tree[t,j]*100:.2f}%" for j in range(t+1)]
    print(f"  t={t}: {row}")`,
    explanation: "The Black-Derman-Toy model specifies log-normal short rates where the ratio of adjacent node rates equals exp(2*sigma*sqrt(dt)). The base rate r[t,0] is calibrated at each step by root-finding so that the tree reproduces the observed zero-coupon bond price for maturity t+1."
  },
  {
    id: "pyfin-20260803-b1-vol-surface-interp",
    language: "python",
    title: "Implied Volatility Surface via SVI Parametrisation",
    tag: "vol-surface",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_w(k: np.ndarray, a, b, rho, m, sigma) -> np.ndarray:
    """SVI raw parametrisation: w(k) = a + b*(rho*(k-m)+sqrt((k-m)^2+sigma^2))."""
    d = k - m
    return a + b * (rho * d + np.sqrt(d**2 + sigma**2))

def svi_iv(k: np.ndarray, T: float, params) -> np.ndarray:
    """Total variance w -> implied vol."""
    w = svi_w(k, *params)
    return np.sqrt(np.clip(w / T, 0, None))

def calibrate_svi(k: np.ndarray, T: float, iv_mkt: np.ndarray):
    w_mkt = iv_mkt**2 * T
    def err(p):
        a, b, rho, m, sigma = p
        if b < 0 or sigma <= 0 or abs(rho) >= 1:
            return 1e9
        w = svi_w(k, a, b, rho, m, sigma)
        if np.any(w < 0):
            return 1e9
        # Butterfly arbitrage: w''*(1 - k*w'/(2w))^2 - 0.25*(1/4 + 1/w)*w'^2 >= 0
        return np.sum((w - w_mkt)**2)
    res = minimize(err, [0.04, 0.1, -0.3, 0.0, 0.1], method='Nelder-Mead')
    return res.x

# Example slice at T=0.5
k    = np.array([-0.4, -0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3])
T    = 0.5
# Synthetic market smile
iv_m = 0.20 + 0.04*np.exp(-5*k) - 0.02*k
params = calibrate_svi(k, T, iv_m)
print("SVI params (a,b,rho,m,sigma):", np.round(params, 4))
iv_fit = svi_iv(k, T, params)
print("Max fit error:", np.abs(iv_fit - iv_m).max().round(5))`,
    explanation: "SVI (Stochastic Volatility Inspired) parametrises the total implied variance as a function of log-moneyness k = log(K/F). The five parameters (a, b, rho, m, sigma) jointly control the ATM level, skew, and wings. SVI is widely used in FX and equity because it can fit the full smile with few parameters while being easy to interpolate across strikes."
  },
  {
    id: "pyfin-20260803-b1-barra-risk",
    language: "python",
    title: "Barra-Style Factor Risk Decomposition",
    tag: "risk",
    code: `import numpy as np

def barra_risk_decompose(w: np.ndarray, B: np.ndarray,
                         F: np.ndarray, D: np.ndarray):
    """
    w: portfolio weights (n,)
    B: factor exposures (n x k)
    F: factor covariance (k x k)
    D: specific risk diagonal (n x n)
    Returns total, systematic, specific variance.
    """
    systematic = w @ B @ F @ B.T @ w
    specific   = w @ D @ w
    total      = systematic + specific
    # Factor contribution
    h = B.T @ w          # factor exposure of portfolio
    factor_contrib = F @ np.outer(h, h) / total
    return dict(total=total, systematic=systematic,
                specific=specific, factor_contrib=np.diag(factor_contrib))

n, k = 50, 5
rng  = np.random.default_rng(99)
w    = rng.dirichlet(np.ones(n))          # long-only portfolio
B    = rng.normal(0, 1, (n, k))           # factor loadings
F    = rng.random((k, k)); F = F @ F.T / k
D    = np.diag(rng.uniform(0.01, 0.04, n)**2)
res  = barra_risk_decompose(w, B, F, D)
print(f"Total variance : {res['total']:.6f}")
print(f"Systematic     : {res['systematic']:.6f}")
print(f"Specific       : {res['specific']:.6f}")
print(f"Factor contribs: {np.round(res['factor_contrib']*100,2)}%")`,
    explanation: "Barra decomposes portfolio variance into systematic (factor) and idiosyncratic (specific) components: Var = w'*B*F*B'*w + w'*D*w. Factor contribution is the diagonal of F*(h*h')/Var_total where h=B'w is the portfolio's factor exposure vector. This guides hedging decisions."
  },
  {
    id: "pyfin-20260803-b1-bump-revalue",
    language: "python",
    title: "Bump-and-Revalue Greeks for Exotic Options",
    tag: "derivatives",
    code: `import numpy as np

def mc_price(S0, K, r, sigma, T, barrier, n=50_000, seed=0):
    """Down-and-out call via MC."""
    rng   = np.random.default_rng(seed)
    n_steps = 252
    dt    = T / n_steps
    paths = S0 * np.exp(np.cumsum(
        (r - 0.5*sigma**2)*dt
        + sigma*np.sqrt(dt)*rng.standard_normal((n, n_steps)), axis=1))
    alive = (paths.min(axis=1) > barrier)
    payoff = np.maximum(paths[:, -1] - K, 0) * alive
    return np.exp(-r*T) * payoff.mean()

def bump_delta(S0, K, r, sigma, T, barrier, h=0.5):
    pu = mc_price(S0+h, K, r, sigma, T, barrier)
    pd = mc_price(S0-h, K, r, sigma, T, barrier)
    return (pu - pd) / (2*h)

def bump_vega(S0, K, r, sigma, T, barrier, h=0.001):
    pu = mc_price(S0, K, r, sigma+h, T, barrier)
    pd = mc_price(S0, K, r, sigma-h, T, barrier)
    return (pu - pd) / (2*h)

S0, K, r, sig, T, B = 100, 100, 0.05, 0.20, 1.0, 90
price = mc_price(S0, K, r, sig, T, B)
delta = bump_delta(S0, K, r, sig, T, B)
vega  = bump_vega(S0, K, r, sig, T, B)
print(f"Price={price:.4f}  Delta={delta:.4f}  Vega={vega:.4f}")`,
    explanation: "Bump-and-revalue computes finite-difference Greeks by shifting each input by a small h and repricing. For exotic options lacking closed-form Greeks, this is the standard approach. The same random seed (common random numbers) keeps variance low by ensuring correlated simulation paths across bumps."
  },
  {
    id: "pyfin-20260803-b1-cap-floor",
    language: "python",
    title: "Interest Rate Cap and Floor via Black's Formula",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.stats import norm

def black_caplet(F, K, sigma, T, df, notional=1e6):
    """Black's formula for a single caplet."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return notional * df * (F*norm.cdf(d1) - K*norm.cdf(d2))

def black_floorlet(F, K, sigma, T, df, notional=1e6):
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return notional * df * (K*norm.cdf(-d2) - F*norm.cdf(-d1))

def price_cap(forwards, K, sigmas, maturities, discount_factors, notional=1e6):
    """Sum of caplets on each forward rate."""
    return sum(black_caplet(F, K, sig, T, df, notional)
               for F, sig, T, df in zip(forwards, sigmas, maturities, discount_factors))

# 3-cap on quarterly resets
forwards = [0.045, 0.048, 0.050]     # forward LIBORs
K        = 0.046                      # cap strike
sigmas   = [0.25, 0.24, 0.23]
maturities = [0.25, 0.50, 0.75]
dfs      = [np.exp(-0.04*T) for T in maturities]
cap_val  = price_cap(forwards, K, sigmas, maturities, dfs, notional=1_000_000)
print(f"Cap value: \${cap_val:,.2f}")

# Put-call parity: Cap - Floor = Swap
floor_val = sum(black_floorlet(F, K, sig, T, df, 1_000_000)
                for F, sig, T, df in zip(forwards, sigmas, maturities, dfs))
print(f"Floor value: \${floor_val:,.2f}")`,
    explanation: "A cap is a portfolio of caplets, each paying max(L-K,0)*notional*alpha where L is the realised LIBOR and alpha the accrual fraction. Black's formula (log-normal forward rate) gives the closed-form caplet price. Cap - Floor = Floating - Fixed = value of the forward-starting swap (put-call parity for rates)."
  },
  {
    id: "pyfin-20260803-b1-merton-jump-py",
    language: "python",
    title: "Merton Jump-Diffusion Option Pricing (Python)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm, poisson

def merton_call(S0, K, r, sigma, T, lam, mu_j, sig_j, n_terms=50):
    """
    Merton (1976) closed-form for European call under jump-diffusion.
    lam: jump intensity (jumps/year)
    mu_j, sig_j: log-jump mean and std
    """
    k   = np.exp(mu_j + 0.5*sig_j**2) - 1   # mean jump size
    r_n = r - lam*k   # risk-adjusted drift
    total = 0.0
    lam_T = lam * T
    for n in range(n_terms):
        w  = poisson.pmf(n, lam_T)
        if w < 1e-15:
            break
        sig_n = np.sqrt(sigma**2 + n*sig_j**2/T)
        r_n_  = r_n + n*(mu_j + 0.5*sig_j**2)/T
        d1 = (np.log(S0/K) + (r_n_ + 0.5*sig_n**2)*T) / (sig_n*np.sqrt(T))
        d2 = d1 - sig_n*np.sqrt(T)
        bs = np.exp(-r_n_*T)*(S0*np.exp(r_n_*T)*norm.cdf(d1) - K*norm.cdf(d2))
        total += w * bs
    return np.exp(-lam*k*T) * total   # correction factor

price = merton_call(100, 100, 0.05, 0.15, 1.0, lam=1.0, mu_j=-0.05, sig_j=0.10)
print(f"Merton jump-diffusion call: {price:.4f}")`,
    explanation: "Merton's jump-diffusion model adds a compound Poisson jump process to GBM. The closed-form prices each Poisson scenario (n jumps in [0,T]) with a Black-Scholes formula using adjusted drift and volatility, weighted by the Poisson probability. Infinite sum truncates safely since Poisson tails decay rapidly."
  },
  {
    id: "pyfin-20260803-b1-component-var",
    language: "python",
    title: "Component VaR for Portfolio Risk Attribution",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def component_var(w: np.ndarray, Sigma: np.ndarray,
                  conf: float = 0.99) -> dict:
    """
    Parametric component VaR: CVaR_i = w_i * (Sigma @ w)_i / sigma_p * z
    w: portfolio weights
    Sigma: covariance matrix
    """
    z       = norm.ppf(conf)
    Sigma_w = Sigma @ w
    var_p   = np.sqrt(w @ Sigma_w)           # portfolio vol
    VaR_p   = z * var_p
    # Marginal VaR (per unit of weight)
    MVaR_i  = z * Sigma_w / var_p
    # Component VaR
    CVaR_i  = w * MVaR_i
    pct     = CVaR_i / VaR_p * 100
    return dict(VaR_portfolio=VaR_p, component_VaR=CVaR_i,
                pct_contribution=pct, marginal_VaR=MVaR_i)

rng   = np.random.default_rng(77)
n     = 6
w     = rng.dirichlet(np.ones(n))
vols  = rng.uniform(0.10, 0.35, n)
corrs = np.eye(n)
for i in range(n):
    for j in range(i+1, n):
        c = rng.uniform(0.1, 0.7)
        corrs[i,j] = corrs[j,i] = c
Sigma = np.outer(vols, vols) * corrs
res   = component_var(w, Sigma)
for i in range(n):
    print(f"  Asset {i}: w={w[i]:.3f}  CVaR%={res['pct_contribution'][i]:.1f}%")`,
    explanation: "Component VaR decomposes portfolio VaR additively: Sum(CVaR_i) = VaR_portfolio exactly. CVaR_i = w_i * (dVaR/dw_i) where the marginal VaR equals z * (Sigma*w)_i / sigma_p. Components exceeding their weight share are risk concentrations; negative CVaR means a position is a diversifier."
  },
  {
    id: "pyfin-20260803-b1-sector-neutral",
    language: "python",
    title: "Sector-Neutral Long-Short Portfolio Construction",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import linprog

def sector_neutral_lsportfolio(alpha: np.ndarray, sectors: list[int],
                                n_sectors: int, gross_lev: float = 1.0):
    """
    Maximise alpha @ w subject to:
    - sum(w) = 0  (dollar-neutral)
    - sum(w[s==k]) = 0 for each sector k  (sector-neutral)
    - sum(|w|) <= gross_lev
    Solved as LP by splitting w = w+ - w-.
    """
    n = len(alpha)
    # Variables: [w+, w-] each of length n
    # Objective: minimise -alpha @ (w+ - w-)
    c = np.concatenate([-alpha, alpha])

    # Equality constraints
    rows, rhs = [], []
    # Dollar neutral
    rows.append(np.concatenate([np.ones(n), -np.ones(n)]))
    rhs.append(0.0)
    # Sector neutral
    for k in range(n_sectors):
        mask = np.array([1.0 if s == k else 0.0 for s in sectors])
        rows.append(np.concatenate([mask, -mask]))
        rhs.append(0.0)
    A_eq = np.array(rows); b_eq = np.array(rhs)
    # Gross leverage <= gross_lev
    A_ub = np.ones((1, 2*n)); b_ub = np.array([gross_lev])
    bounds = [(0, None)] * (2*n)

    res = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                  bounds=bounds, method='highs')
    if not res.success:
        return None
    w = res.x[:n] - res.x[n:]
    return w

rng     = np.random.default_rng(5)
n       = 12
alpha   = rng.normal(0, 1, n)
sectors = [0,0,0,1,1,1,2,2,2,3,3,3]
w = sector_neutral_lsportfolio(alpha, sectors, n_sectors=4)
print("Weights:", np.round(w, 4))
print("Dollar neutral:", np.abs(w.sum()) < 1e-9)
print("Sector sums:", [round(w[[s==k for s in sectors]].sum(),9) for k in range(4)])`,
    explanation: "Sector-neutral L/S portfolios eliminate sector-level beta exposures. Formulated as an LP by splitting weights into long (w+) and short (w-) parts, with equality constraints enforcing zero net sector exposure and a gross leverage cap. HiGHS solves the LP efficiently in O(n*k) variables."
  },
  {
    id: "pyfin-20260803-b1-rolling-betas",
    language: "python",
    title: "Rolling Market Beta Estimation with NumPy Stride Tricks",
    tag: "factor-models",
    code: `import numpy as np

def rolling_beta(asset: np.ndarray, market: np.ndarray,
                 window: int = 60) -> np.ndarray:
    """
    Vectorised rolling beta using stride_tricks.
    Returns array of length n-window+1.
    """
    n    = len(asset)
    assert len(market) == n
    # Create rolling windows (view, no copy)
    shape   = (n - window + 1, window)
    strides = (asset.strides[0], asset.strides[0])
    a_win   = np.lib.stride_tricks.as_strided(asset,  shape, strides)
    m_win   = np.lib.stride_tricks.as_strided(market, shape, strides)
    # Demean each window
    a_dm = a_win - a_win.mean(axis=1, keepdims=True)
    m_dm = m_win - m_win.mean(axis=1, keepdims=True)
    cov_am  = (a_dm * m_dm).mean(axis=1)
    var_m   = (m_dm**2).mean(axis=1)
    return cov_am / (var_m + 1e-12)

rng    = np.random.default_rng(11)
mkt    = rng.normal(0, 0.01, 500)
asset  = 1.2 * mkt + rng.normal(0, 0.008, 500)
betas  = rolling_beta(asset, mkt, window=60)
print(f"Rolling beta: mean={betas.mean():.4f}  std={betas.std():.4f}")`,
    explanation: "Stride tricks creates a sliding-window view of the array without copying data, enabling vectorised computation of rolling covariance and variance. Each window is demeaned independently, matching the OLS regression estimator. This is 10-50x faster than a Python loop for long time series."
  },
  {
    id: "pyfin-20260803-b1-einsum-portfolio",
    language: "python",
    title: "Portfolio Analytics with np.einsum",
    tag: "portfolio",
    code: `import numpy as np

def portfolio_analytics(W: np.ndarray, R: np.ndarray) -> dict:
    """
    W: (P, N) weight matrix, P portfolios, N assets
    R: (T, N) return matrix, T time periods
    Returns portfolio returns, vol, Sharpe (annualised 252).
    """
    # Portfolio returns: (T, P)
    port_ret = np.einsum('tn,pn->tp', R, W)
    mu    = port_ret.mean(axis=0) * 252
    sig   = port_ret.std(axis=0)  * np.sqrt(252)
    sharpe = mu / (sig + 1e-9)

    # Covariance between portfolios: (P, P)
    Sigma_port = np.einsum('pn,nm,qm->pq', W, np.cov(R.T), W)

    return dict(mu=mu, sigma=sig, sharpe=sharpe, cov_port=Sigma_port)

rng = np.random.default_rng(42)
T, N, P = 252, 20, 5
R = rng.normal(0.0004, 0.01, (T, N))   # daily returns
# Random weight matrices (normalised long-only)
W = rng.dirichlet(np.ones(N), size=P)
res = portfolio_analytics(W, R)
for i in range(P):
    print(f"Port {i}: mu={res['mu'][i]:.2%}  sig={res['sigma'][i]:.2%}  Sharpe={res['sharpe'][i]:.3f}")`,
    explanation: "np.einsum expresses multi-dimensional contractions compactly and efficiently. 'tn,pn->tp' computes portfolio returns for all portfolios simultaneously: sum over assets n of daily return t times weight. 'pn,nm,qm->pq' computes the P×P covariance matrix of portfolio returns via the bilinear form W*Cov*W'."
  },
  {
    id: "pyfin-20260803-b1-control-variate",
    language: "python",
    title: "Control Variate with Asian Option MC",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_eu_call(S0, K, r, sigma, T):
    d1 = (np.log(S0/K)+(r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    return S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d1-sigma*np.sqrt(T))

def asian_call_cv(S0, K, r, sigma, T, n_paths=100_000, n_steps=52):
    """
    Arithmetic-average Asian call priced with European call as control variate.
    """
    rng = np.random.default_rng(0)
    dt  = T / n_steps
    Z   = rng.standard_normal((n_paths, n_steps))
    log_S = np.log(S0) + np.cumsum(
        (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S  = np.exp(log_S)
    # Asian payoff (arithmetic average)
    avg = S.mean(axis=1)
    pay_asian = np.maximum(avg - K, 0)
    # Control: European (final price)
    pay_eu = np.maximum(S[:, -1] - K, 0)
    # Black-Scholes price of European
    eu_true = bs_eu_call(S0, K, r, sigma, T)
    eu_mc   = np.exp(-r*T) * pay_eu
    # OLS coefficient for control
    cov_mat = np.cov(pay_asian, eu_mc)
    c_opt   = -cov_mat[0, 1] / cov_mat[1, 1]
    # Adjusted estimator
    adj = np.exp(-r*T)*pay_asian + c_opt*(eu_mc - eu_true)
    price = adj.mean()
    se    = adj.std() / np.sqrt(n_paths)
    return price, se

price, se = asian_call_cv(100, 100, 0.05, 0.20, 1.0)
print(f"Asian call (CV): {price:.4f} ± {se:.6f}")`,
    explanation: "Control variate uses a correlated, analytically-known quantity (the European call price) to reduce Monte Carlo variance. The optimal coefficient c* = -Cov(Y,C)/Var(C) minimises variance of the adjusted estimator Y + c*(C - E[C]). Variance reduction can reach 90 % for at-the-money Asian options."
  },
  {
    id: "pyfin-20260803-b1-omega-ratio",
    language: "python",
    title: "Omega Ratio and Sortino Ratio for Return Distributions",
    tag: "portfolio",
    code: `import numpy as np

def omega_ratio(returns: np.ndarray, threshold: float = 0.0) -> float:
    """
    Omega = E[max(R-L,0)] / E[max(L-R,0)]
    where L is the threshold return.
    """
    gains  = np.maximum(returns - threshold, 0).mean()
    losses = np.maximum(threshold - returns, 0).mean()
    return gains / (losses + 1e-12)

def sortino_ratio(returns: np.ndarray, threshold: float = 0.0,
                  annualise: int = 252) -> float:
    """Sortino = (mean - threshold) / downside_deviation."""
    excess  = returns - threshold / annualise
    downdev = np.sqrt(np.mean(np.minimum(excess, 0)**2))
    return (returns.mean() - threshold/annualise) / (downdev + 1e-12) * np.sqrt(annualise)

def calmar_ratio(returns: np.ndarray, annualise: int = 252) -> float:
    """Calmar = annualised return / max drawdown."""
    cum = np.cumprod(1 + returns)
    dd  = (cum / np.maximum.accumulate(cum) - 1).min()
    return returns.mean() * annualise / (abs(dd) + 1e-12)

rng  = np.random.default_rng(8)
rets = rng.normal(0.0005, 0.012, 1000)
print(f"Omega   : {omega_ratio(rets):.4f}")
print(f"Sortino : {sortino_ratio(rets):.4f}")
print(f"Calmar  : {calmar_ratio(rets):.4f}")
print(f"Sharpe  : {rets.mean()/rets.std()*np.sqrt(252):.4f}")`,
    explanation: "Omega counts the probability-weighted gains above a threshold against losses below it — capturing the full return distribution without normality assumptions. Sortino penalises only downside deviation, not total volatility. Calmar focuses on drawdown. These measures are preferred over Sharpe when return distributions are skewed or fat-tailed."
  },
  {
    id: "pyfin-20260803-b1-heston-cos",
    language: "python",
    title: "Heston Model Option Pricing via COS Method",
    tag: "derivatives",
    code: `import numpy as np

def heston_cf(u: complex, S0, K, T, r, kappa, theta, xi, rho, v0) -> complex:
    """Characteristic function of log-price under Heston."""
    x  = np.log(S0/K)
    d  = np.sqrt((rho*xi*1j*u - kappa)**2 + xi**2*(1j*u + u**2))
    g  = (kappa - rho*xi*1j*u - d) / (kappa - rho*xi*1j*u + d)
    C  = r*1j*u*T + (kappa*theta/xi**2)*((kappa - rho*xi*1j*u - d)*T
         - 2*np.log((1 - g*np.exp(-d*T))/(1 - g)))
    D  = ((kappa - rho*xi*1j*u - d)/xi**2) * (1 - np.exp(-d*T)) / (1 - g*np.exp(-d*T))
    return np.exp(C + D*v0 + 1j*u*x)

def heston_cos_call(S0, K, T, r, kappa, theta, xi, rho, v0,
                    N: int = 128, L: float = 12.0) -> float:
    """COS method for Heston call price."""
    x  = np.log(S0/K)
    a, b = x - L, x + L
    k    = np.arange(N)
    u    = k * np.pi / (b - a)
    # Payoff cosine coefficients for call: Vk
    def chi(c, d, k_):
        if k_ == 0:
            return d - c
        return (d*np.cos(k_*np.pi*(d-a)/(b-a))
                - c*np.cos(k_*np.pi*(c-a)/(b-a))
                + k_*np.pi/(b-a)*(d*np.sin(k_*np.pi*(d-a)/(b-a))
                - c*np.sin(k_*np.pi*(c-a)/(b-a)))) / (1 + (k_*np.pi/(b-a))**2)
    def psi(c, d, k_):
        if k_ == 0:
            return d - c
        return ((np.sin(k_*np.pi*(d-a)/(b-a))
                 - np.sin(k_*np.pi*(c-a)/(b-a)))
                * (b-a)/(k_*np.pi))

    Vk = np.array([2/(b-a) * K*(chi(0, b-x, k_) - psi(0, b-x, k_))
                   for k_ in k])
    phi = np.array([heston_cf(u[j], S0, K, T, r, kappa, theta, xi, rho, v0)
                    for j in range(N)])
    phi *= np.exp(-1j*u*a)
    Vk[0] /= 2
    return np.exp(-r*T) * np.real(np.dot(phi, Vk))

price = heston_cos_call(100, 100, 1.0, 0.05, 2.0, 0.04, 0.3, -0.7, 0.04)
print(f"Heston COS call: {price:.4f}")`,
    explanation: "The COS method (Fang & Oosterlee 2008) expands the risk-neutral density in a cosine series on [a,b] and expresses the option price as a dot product of characteristic function evaluations and analytic payoff coefficients. It achieves spectral convergence — doubling N halves the error exponentially — and is O(N log N) when combined with FFT."
  },
];
