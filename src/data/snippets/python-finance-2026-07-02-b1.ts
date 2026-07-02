import type { Snippet } from "./types";

export const pythonFinanceSnippets20260702B1: Snippet[] = [
  {
    id: "pyfin-20260702-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Vol Monte Carlo (Broadie-Kaya QE Scheme)",
    tag: "finance",
    code: `import numpy as np

def heston_call_mc(
    S0: float, K: float, r: float, T: float,
    v0: float, kappa: float, theta: float, xi: float, rho: float,
    paths: int = 100_000, steps: int = 100, seed: int = 42
) -> dict:
    """
    Heston (1993) stochastic vol model: dS = r*S*dt + sqrt(v)*S*dW1
                                         dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW2
    Quadratic Exponential (QE) scheme for variance process (Andersen 2008).
    Avoids negative variance while matching first two moments exactly.
    """
    rng   = np.random.default_rng(seed)
    dt    = T / steps
    sqrt_dt = np.sqrt(dt)

    # Cholesky for correlated Brownians
    rho2  = np.sqrt(1 - rho**2)

    S = np.full(paths, S0, dtype=np.float64)
    v = np.full(paths, v0, dtype=np.float64)

    for _ in range(steps):
        z1 = rng.standard_normal(paths)
        z2 = rng.standard_normal(paths)
        dW1 = z1 * sqrt_dt
        dW2 = (rho * z1 + rho2 * z2) * sqrt_dt

        # QE scheme for variance: choose exponential or quadratic form
        kT   = np.exp(-kappa * dt)
        m    = theta + (v - theta) * kT
        s2   = (v * xi**2 * kT / kappa * (1 - kT)
                + theta * xi**2 / (2*kappa) * (1 - kT)**2)

        # Psi = s2 / m^2: switch between approximations
        psi  = np.where(m > 1e-10, s2 / m**2, 0.0)

        # For psi <= 1.5: quadratic form
        b2   = np.maximum(2/psi - 1 + np.sqrt(2/psi * (2/psi - 1)), 0.0)
        a    = m / (1 + b2)
        v_quad = a * (np.sqrt(b2) + z1)**2

        # For psi > 1.5: exponential form
        p    = (psi - 1) / (psi + 1)
        beta = (1 - p) / m
        u    = rng.uniform(size=paths)
        v_exp = np.where(u > p,
                         np.log((1 - p) / (1 - u)) / beta,
                         0.0)

        v_new = np.where(psi <= 1.5, v_quad, v_exp)

        # Log-price update with variance average (trapezoidal)
        v_avg = 0.5 * (v + v_new)
        S    *= np.exp((r - 0.5 * v_avg) * dt + np.sqrt(v_avg) * dW1)
        v     = v_new

    payoff = np.maximum(S - K, 0.0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(paths)
    return {"price": price, "se": se}

result = heston_call_mc(
    S0=100, K=100, r=0.05, T=1.0,
    v0=0.04, kappa=2.0, theta=0.04, xi=0.3, rho=-0.7)
print(f"Heston call (QE MC): {result['price']:.4f} +/- {result['se']:.4f}")`,
    explanation: "The Andersen QE discretisation of the CIR variance process avoids negative variance without truncation or reflection: it switches between a quadratic (low psi) and exponential (high psi) approximation to match the exact conditional moments. This eliminates the 'full truncation' bias that plagues Euler schemes for Heston when xi is large relative to kappa.",
  },
  {
    id: "pyfin-20260702-b1-sabr-implied",
    language: "python",
    title: "SABR Model Implied Vol via Hagan Analytic Formula",
    tag: "finance",
    code: `import numpy as np

def sabr_implied_vol(
    F: float, K: float, T: float,
    alpha: float, beta: float, rho: float, nu: float,
    shift: float = 0.0
) -> float:
    """
    Hagan et al. (2002) SABR implied Black vol formula.
    F:     forward price
    K:     strike
    alpha: initial vol (ATM vol for beta=1)
    beta:  CEV exponent in [0,1] (0=normal, 1=log-normal)
    rho:   vol-spot correlation
    nu:    vol of vol
    shift: used in shifted-SABR for negative rates

    Returns: Black lognormal implied vol.
    """
    F_s = F + shift
    K_s = K + shift

    if abs(F_s - K_s) < 1e-10:  # ATM formula
        FK_mid = F_s
        fk_beta = FK_mid**(1 - beta)
        A = alpha / (fk_beta * (1 + (1-beta)**2/24 * np.log(FK_mid)**2
                                  + (1-beta)**4/1920 * np.log(FK_mid)**4))
        B = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**(2*(1-beta))
                + rho*beta*nu*alpha / FK_mid**(1-beta) / 4
                + nu**2 * (2 - 3*rho**2) / 24) * T
        return A * B

    log_FK = np.log(F_s / K_s)
    FK_mid = (F_s * K_s)**0.5
    fk_beta = FK_mid**(1 - beta)

    z     = nu / alpha * fk_beta * log_FK
    x_z   = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    numer = alpha * (1 + ((1-beta)**2/24 * alpha**2 / fk_beta**2
                         + rho*beta*nu*alpha/(4*fk_beta)
                         + nu**2*(2-3*rho**2)/24) * T)
    denom = fk_beta * (1 + (1-beta)**2/24 * log_FK**2
                          + (1-beta)**4/1920 * log_FK**4)
    return numer / denom * z / x_z

# Calibrate implied vol surface for a range of strikes
F, T = 100.0, 1.0
alpha, beta, rho, nu = 0.20, 0.5, -0.3, 0.4
print("SABR implied vol surface:")
for K in [80, 90, 95, 100, 105, 110, 120]:
    iv = sabr_implied_vol(F, K, T, alpha, beta, rho, nu)
    print(f"  K={K:3d}: {iv:.4%}")`,
    explanation: "The SABR model (Hagan 2002) is the market standard for interest rate swaption and cap/floor vol surfaces because it produces realistic smiles and its analytic implied vol formula enables fast calibration. The ATM regime requires a separate formula to avoid 0/0 in the z/x(z) ratio; shifted-SABR extends it to negative rates by adding a positive shift to both F and K.",
  },
  {
    id: "pyfin-20260702-b1-garch-fit",
    language: "python",
    title: "GARCH(1,1) MLE Calibration with scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def garch11_loglik(params: np.ndarray, returns: np.ndarray) -> float:
    """
    GARCH(1,1): sigma2_t = omega + alpha*eps_{t-1}^2 + beta*sigma2_{t-1}
    Returns NEGATIVE log-likelihood (for minimisation).
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10  # infeasible parameters

    T = len(returns)
    sigma2 = np.empty(T)
    sigma2[0] = np.var(returns)    # initialise with sample variance

    for t in range(1, T):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    # Gaussian log-likelihood
    ll = -0.5 * np.sum(np.log(2*np.pi) + np.log(sigma2) + returns**2 / sigma2)
    return -ll  # negate for minimisation

def fit_garch11(returns: np.ndarray) -> dict:
    x0 = np.array([1e-6, 0.05, 0.90])
    bounds = [(1e-8, None), (0.0, 1.0), (0.0, 1.0)]
    res = minimize(garch11_loglik, x0, args=(returns,),
                   method='L-BFGS-B', bounds=bounds,
                   options={'ftol': 1e-12, 'gtol': 1e-8})
    omega, alpha, beta = res.x
    # Long-run variance: omega / (1 - alpha - beta)
    lr_var = omega / (1 - alpha - beta)
    return {
        "omega":   omega,
        "alpha":   alpha,
        "beta":    beta,
        "persistence": alpha + beta,
        "lr_vol": np.sqrt(lr_var * 252) * 100,  # annualised %
        "loglik": -res.fun,
    }

np.random.seed(42)
# Simulate GARCH returns for testing
n = 500
true_params = (1e-6, 0.08, 0.90)
eps = np.random.randn(n)
sigma2 = np.full(n, true_params[0] / (1 - true_params[1] - true_params[2]))
r = np.empty(n)
for t in range(n):
    r[t] = np.sqrt(sigma2[t]) * eps[t]
    if t < n-1:
        sigma2[t+1] = true_params[0] + true_params[1]*r[t]**2 + true_params[2]*sigma2[t]

result = fit_garch11(r)
for k, v in result.items():
    print(f"{k:>15}: {v:.6f}")`,
    explanation: "GARCH(1,1) captures volatility clustering — high vol tends to follow high vol — via the persistence parameter alpha + beta (near 1 for equity returns). MLE via L-BFGS-B is efficient with analytic gradient approximation; the parameter constraint alpha + beta < 1 ensures covariance stationarity. The long-run volatility sqrt(omega/(1-alpha-beta)) is the steady-state conditional vol level.",
  },
  {
    id: "pyfin-20260702-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel-Svensson Yield Curve Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nss_yield(tau: np.ndarray, b0: float, b1: float, b2: float, b3: float,
              lam1: float, lam2: float) -> np.ndarray:
    """
    Svensson (1994) extension of Nelson-Siegel (1987).
    y(tau) = b0 + b1*(1-exp(-tau/lam1))/(tau/lam1)
           + b2*[(1-exp(-tau/lam1))/(tau/lam1) - exp(-tau/lam1)]
           + b3*[(1-exp(-tau/lam2))/(tau/lam2) - exp(-tau/lam2)]
    """
    t1  = tau / lam1
    t2  = tau / lam2
    f1  = (1 - np.exp(-t1)) / t1
    f2  = (1 - np.exp(-t2)) / t2
    return (b0
            + b1 * f1
            + b2 * (f1 - np.exp(-t1))
            + b3 * (f2 - np.exp(-t2)))

def fit_nss(maturities: np.ndarray, yields: np.ndarray) -> dict:
    """Fit NSS to observed yields via least-squares."""
    def loss(params):
        b0, b1, b2, b3, lam1, lam2 = params
        if lam1 <= 0 or lam2 <= 0:
            return 1e10
        fitted = nss_yield(maturities, b0, b1, b2, b3, lam1, lam2)
        return np.sum((fitted - yields)**2)

    # Multiple restarts to avoid local minima
    best = None
    for lam1_init in [1.0, 2.0, 5.0]:
        for lam2_init in [3.0, 7.0, 15.0]:
            x0 = [yields[-1], -0.01, 0.01, 0.01, lam1_init, lam2_init]
            res = minimize(loss, x0, method='Nelder-Mead',
                          options={'maxiter': 5000, 'xatol': 1e-8})
            if best is None or res.fun < best.fun:
                best = res

    b0, b1, b2, b3, lam1, lam2 = best.x
    fitted = nss_yield(maturities, b0, b1, b2, b3, lam1, lam2)
    return {"params": dict(b0=b0, b1=b1, b2=b2, b3=b3, lam1=lam1, lam2=lam2),
            "rmse": np.sqrt(np.mean((fitted - yields)**2)),
            "fitted": fitted}

# ECB-like sovereign curve
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
yields = np.array([0.043, 0.044, 0.044, 0.042, 0.041, 0.040,
                   0.040, 0.039, 0.039, 0.038, 0.037])

result = fit_nss(mats, yields)
print(f"NSS fit RMSE: {result['rmse']*10000:.2f} bps")
print("Fitted yields:", np.round(result['fitted'] * 100, 3))`,
    explanation: "The Svensson extension adds a second hump term (b3) to Nelson-Siegel, enabling better fit to complex yield curves with two local extrema — common in the ECB/Fed rate environments. Multiple optimisation restarts are essential because Nelder-Mead gets trapped in local minima when the lambda parameters are initialised poorly.",
  },
  {
    id: "pyfin-20260702-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Dynamic Hedge Ratio for Pairs Trading",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def kalman_pairs_filter(
    y: np.ndarray, x: np.ndarray,
    delta: float = 1e-4,
    vt: float = 1e-3
) -> dict:
    """
    Kalman filter to estimate the time-varying hedge ratio beta_t in:
        y_t = alpha_t + beta_t * x_t + eps_t,  eps ~ N(0, Vt)
    State: [alpha_t, beta_t], dynamics: state walks as random walk with noise delta.

    delta: state transition noise (controls how fast hedge ratio can change)
    vt:    observation noise variance
    """
    n  = len(y)
    # State: (alpha, beta) — starts at 0 with large uncertainty
    theta   = np.zeros(2)               # state estimate
    P       = np.eye(2) * 1e4          # state covariance (high initial uncertainty)
    Q       = delta * np.eye(2)        # state noise

    betas  = np.empty(n)
    alphas = np.empty(n)
    spreads = np.empty(n)

    for t in range(n):
        F  = np.array([1.0, x[t]])     # observation vector (intercept + slope)

        # Predict
        # (state walk: theta_t = theta_{t-1} — no drift)
        P  = P + Q

        # Update (Kalman gain)
        S  = F @ P @ F + vt            # innovation variance (scalar)
        K  = P @ F / S                 # Kalman gain vector (2,)

        # Innovation
        y_hat  = F @ theta
        innov  = y[t] - y_hat

        # State update
        theta  = theta + K * innov
        P      = (np.eye(2) - np.outer(K, F)) @ P

        alphas[t]  = theta[0]
        betas[t]   = theta[1]
        spreads[t] = innov            # prediction error = spread

    z_score = (spreads - spreads.mean()) / spreads.std()
    return {"beta": betas, "alpha": alphas, "spread": spreads, "z_score": z_score}

np.random.seed(42)
n   = 500
x   = np.cumsum(np.random.randn(n) * 0.01) + 100
y   = 0.8 * x + 5 + np.random.randn(n) * 0.3   # true beta=0.8, alpha=5

result = kalman_pairs_filter(y, x, delta=1e-5)
print(f"Final hedge ratio (beta): {result['beta'][-1]:.4f}")  # ~0.80
print(f"Final intercept (alpha):  {result['alpha'][-1]:.4f}")  # ~5.0
print(f"Spread z-score (last 3): {result['z_score'][-3:]}")`,
    explanation: "The Kalman filter estimates a time-varying hedge ratio as a random-walk state, updating it on each new observation. Unlike rolling OLS, it weights recent observations more heavily (via the state noise delta) and provides an optimal filter given the assumed noise model. The prediction error (spread) is directly usable as a stationary mean-reverting trading signal.",
  },
  {
    id: "pyfin-20260702-b1-fama-french-3f",
    language: "python",
    title: "Fama-French 3-Factor Regression and Alpha Extraction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def fama_french_3f(
    excess_ret: pd.Series,
    mkt: pd.Series,
    smb: pd.Series,
    hml: pd.Series,
    annualise: bool = True
) -> dict:
    """
    Fama-French 3-factor model:
        R_i - Rf = alpha + beta_mkt*(Rm-Rf) + beta_smb*SMB + beta_hml*HML + eps

    Returns alpha (annualised), betas, t-stats, R-squared, and information ratio.
    """
    X = pd.DataFrame({"mkt": mkt, "smb": smb, "hml": hml}).loc[excess_ret.index]
    X = sm.add_constant(X)

    model  = sm.OLS(excess_ret, X, missing='drop').fit(cov_type='HC3')

    alpha   = model.params['const']
    t_alpha = model.tvalues['const']
    r2      = model.rsquared
    betas   = {f: model.params[f] for f in ['mkt', 'smb', 'hml']}
    t_stats = {f: model.tvalues[f] for f in ['mkt', 'smb', 'hml']}

    resid_vol = model.resid.std()
    # Information ratio: alpha / tracking error (both monthly if daily data)
    freq = 252 if len(excess_ret) > 500 else 12
    ir   = (alpha * freq) / (resid_vol * np.sqrt(freq))

    if annualise:
        alpha = alpha * freq  # annualise monthly/daily alpha

    return {
        "alpha": alpha, "t_alpha": t_alpha,
        "betas": betas, "t_stats": t_stats,
        "r2": r2, "information_ratio": ir,
        "resid_vol_annualised": resid_vol * np.sqrt(freq),
    }

np.random.seed(42)
n = 120  # 10 years monthly
mkt = pd.Series(np.random.randn(n) * 0.04 + 0.006)
smb = pd.Series(np.random.randn(n) * 0.03 + 0.002)
hml = pd.Series(np.random.randn(n) * 0.025 + 0.001)
# Synthetic fund with alpha 2% annual, beta_mkt=1.1
excess = 1.1*mkt + 0.3*smb - 0.1*hml + 0.002/12 + np.random.randn(n)*0.02

result = fama_french_3f(pd.Series(excess), mkt, smb, hml)
print(f"Annualised alpha: {result['alpha']*100:.2f}% (t={result['t_alpha']:.2f})")
print(f"Betas: mkt={result['betas']['mkt']:.3f} SMB={result['betas']['smb']:.3f} HML={result['betas']['hml']:.3f}")
print(f"R2: {result['r2']:.3f}  IR: {result['information_ratio']:.3f}")`,
    explanation: "Fama-French regression decomposes fund returns into market beta, size (SMB), and value (HML) factor exposures; the intercept alpha is the excess return after fully controlling for systematic risk. HC3 heteroskedasticity-robust standard errors are essential for monthly return series where variance is not constant across the cycle.",
  },
  {
    id: "pyfin-20260702-b1-vol-surface-arb",
    language: "python",
    title: "Volatility Surface Arbitrage Check (Calendar / Butterfly)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from typing import NamedTuple

def bsm_call(S: float, K: float, r: float, T: float, sigma: float) -> float:
    if T <= 0 or sigma <= 0:
        return max(S - K * np.exp(-r*T), 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

class ArbViolation(NamedTuple):
    kind: str
    details: str

def check_vol_surface_arbitrage(
    strikes: np.ndarray,
    expiries: np.ndarray,
    impl_vols: np.ndarray,   # shape (n_strikes, n_expiries)
    S: float,
    r: float
) -> list[ArbViolation]:
    """
    Check for calendar spread and butterfly arbitrage violations on a vol surface.
    Calendar: C(K,T1) <= C(K,T2) for T1 < T2 (total variance must be non-decreasing in T)
    Butterfly: C(K-dK) - 2*C(K) + C(K+dK) >= 0 (convexity in K = positive density)
    """
    violations = []
    C = np.zeros_like(impl_vols)
    for i, K in enumerate(strikes):
        for j, T in enumerate(expiries):
            C[i, j] = bsm_call(S, K, r, T, impl_vols[i, j])

    # Calendar arbitrage: total variance = sigma^2 * T must be non-decreasing in T
    total_var = impl_vols**2 * expiries[np.newaxis, :]
    for i, K in enumerate(strikes):
        for j in range(len(expiries) - 1):
            if total_var[i, j+1] < total_var[i, j] - 1e-6:
                violations.append(ArbViolation(
                    "calendar",
                    f"K={K} T1={expiries[j]:.2f} TV={total_var[i,j]:.4f} "
                    f"> T2={expiries[j+1]:.2f} TV={total_var[i,j+1]:.4f}"
                ))

    # Butterfly arbitrage: convexity in K (d2C/dK2 >= 0)
    for j, T in enumerate(expiries):
        for i in range(1, len(strikes) - 1):
            butterfly = C[i-1, j] - 2*C[i, j] + C[i+1, j]
            if butterfly < -1e-6:
                violations.append(ArbViolation(
                    "butterfly",
                    f"T={T:.2f} K={strikes[i]}: butterfly={butterfly:.4f} < 0"
                ))

    return violations

# Test surface with intentional violations
strikes  = np.array([90.0, 95.0, 100.0, 105.0, 110.0])
expiries = np.array([0.25, 0.5, 1.0])
# Construct vol surface with a deliberate calendar violation at K=100
vols = np.array([
    [0.22, 0.20, 0.19],   # K=90
    [0.21, 0.195, 0.185], # K=95
    [0.20, 0.18, 0.19],   # K=100: TV at T=0.5 > T=1.0 (calendar violation)
    [0.21, 0.195, 0.185], # K=105
    [0.22, 0.20, 0.19],   # K=110
])
viols = check_vol_surface_arbitrage(strikes, expiries, vols, S=100, r=0.05)
for v in viols:
    print(f"[{v.kind.upper()}] {v.details}")`,
    explanation: "A no-arbitrage vol surface must satisfy two conditions: calendar spread (total variance non-decreasing in T, else a calendar spread has negative value) and butterfly (convexity in K, else the risk-neutral density is negative). These checks are run by every derivatives desk before publishing an implied vol surface or marking books.",
  },
  {
    id: "pyfin-20260702-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def otm_call_mc_naive(S0: float, K: float, r: float, T: float,
                      sigma: float, paths: int = 1_000_000, seed: int = 42) -> dict:
    rng = np.random.default_rng(seed)
    z   = rng.standard_normal(paths)
    ST  = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*z)
    pay = np.maximum(ST - K, 0.0)
    price = np.exp(-r*T) * pay.mean()
    se    = np.exp(-r*T) * pay.std() / np.sqrt(paths)
    return {"price": price, "se": se, "hit_rate": (ST > K).mean()}

def otm_call_mc_is(S0: float, K: float, r: float, T: float,
                   sigma: float, paths: int = 100_000, seed: int = 42) -> dict:
    """
    Importance sampling: shift the Gaussian mean to the exercise region.
    Optimal shift: theta* = (log(K/S0) - (r-0.5*sigma^2)*T) / (sigma*sqrt(T))
    Under the IS measure, draw z ~ N(theta*, 1) and weight by Radon-Nikodym dP/dQ.
    """
    rng   = np.random.default_rng(seed)
    sqT   = np.sqrt(T)
    # Critical z for ATM: log(K/S0) - drift = sigma*sqrt(T)*z_star
    z_star = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / (sigma*sqT)

    # Shift distribution to sample near ITM region
    z_is  = rng.standard_normal(paths) + z_star   # shifted normals
    ST    = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*sqT*z_is)

    # Radon-Nikodym weight: dP/dQ = exp(-z_star*z + 0.5*z_star^2)
    rn_weights = np.exp(-z_star * (z_is - z_star) - 0.5*z_star**2)

    pay    = np.maximum(ST - K, 0.0)
    is_est = pay * rn_weights
    price  = np.exp(-r*T) * is_est.mean()
    se     = np.exp(-r*T) * is_est.std() / np.sqrt(paths)
    return {"price": price, "se": se, "variance_reduction": None}

S0, K, r, T, sigma = 100, 130, 0.05, 1.0, 0.20  # deep OTM: ~0.8% BSM
from scipy.stats import norm as sn
d1  = (np.log(S0/K)+(r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
d2  = d1 - sigma*np.sqrt(T)
analytic = S0*sn.cdf(d1) - K*np.exp(-r*T)*sn.cdf(d2)
print(f"Analytic:     {analytic:.6f}")

naive  = otm_call_mc_naive(S0, K, r, T, sigma)
is_mc  = otm_call_mc_is(S0, K, r, T, sigma)
print(f"Naive MC:     {naive['price']:.6f} +/- {naive['se']:.6f}  (hit={naive['hit_rate']:.4%})")
print(f"IS MC:        {is_mc['price']:.6f} +/- {is_mc['se']:.6f}")`,
    explanation: "Naive Monte Carlo is extremely inefficient for deep OTM options because only a tiny fraction of paths contribute to the payoff; importance sampling shifts the sampling distribution to oversample the exercise region and corrects via the Radon-Nikodym weight. The variance reduction can be orders of magnitude — 10x paths at 100x variance reduction gives 1000x efficiency gain.",
  },
  {
    id: "pyfin-20260702-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly for Position Sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_continuous(mu: float, sigma: float, rf: float = 0.0) -> float:
    """
    Continuous Kelly fraction for a GBM asset.
    f* = (mu - rf) / sigma^2  (Sharpe ratio / sigma)
    """
    return (mu - rf) / sigma**2

def kelly_log_utility(returns: np.ndarray) -> float:
    """
    Numerical Kelly: maximise E[log(1 + f*R)] over fraction f.
    Works for any return distribution (not just Gaussian).
    """
    def neg_log_growth(f):
        growth = np.log(1 + f * returns)
        if not np.all(np.isfinite(growth)):
            return 1e10
        return -growth.mean()

    result = minimize_scalar(neg_log_growth, bounds=(0, 1),
                              method='bounded', options={'xatol': 1e-8})
    return result.x

def kelly_analysis(returns: np.ndarray, kelly_frac: float = 1.0) -> dict:
    """Analyse Kelly sizing: full, fractional, and risk metrics."""
    f_full = kelly_log_utility(returns)
    f_frac = kelly_frac * f_full

    mu_log   = np.log(1 + f_frac * returns).mean()
    std_log  = np.log(1 + f_frac * returns).std()
    ruin_prob = (1 + f_frac * returns).min()  # worst scenario

    # Long-run wealth: W(T) = W0 * exp(mu_log * T)
    W_1yr = np.exp(mu_log * 252)   # assuming daily returns
    W_5yr = np.exp(mu_log * 252*5)

    return {
        "kelly_full":    f_full,
        "kelly_frac":    f_frac,
        "daily_growth":  mu_log,
        "growth_vol":    std_log,
        "min_return":    ruin_prob,
        "W_1yr_growth":  W_1yr,
        "W_5yr_growth":  W_5yr,
    }

np.random.seed(42)
# Strategy returns: 60% win rate, +2% on win, -1% on loss
wins   = np.random.binomial(1, 0.6, size=2520)  # 10 years daily
rets   = np.where(wins, 0.02, -0.01)

result = kelly_analysis(rets, kelly_frac=0.5)  # half-Kelly
for k, v in result.items():
    print(f"{k:>20}: {v:.4f}")`,
    explanation: "The Kelly criterion maximises long-run geometric growth rate (the expected log utility), not expected linear return. Fractional Kelly (0.5x) is universally preferred in practice: it reduces drawdowns dramatically while sacrificing only a small amount of long-run growth — the growth curve is relatively flat near the Kelly fraction but drawdown is much more manageable.",
  },
  {
    id: "pyfin-20260702-b1-cds-hazard",
    language: "python",
    title: "CDS Pricing and Hazard Rate Bootstrap",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(
    cds_spreads: list[tuple[float, float]],  # [(maturity_years, spread_bps), ...]
    recovery: float = 0.40,
    r: float = 0.05,
    freq: int = 4       # quarterly payments
) -> dict:
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    CDS par spread S: PV(premium leg) = PV(protection leg) at par.
    Premium leg:  S * sum_t(delta_t * DF_t * Q_t)
    Protection leg: (1-R) * sum_t(DF_t * (Q_{t-1} - Q_t))
    Q_t = survival probability = exp(-integral h du)
    """
    hazards = {}
    survival = {0.0: 1.0}
    q_interp = lambda t: np.exp(-sum(h*(min(t, m2) - m1)
                                     for (m1, m2), h in hazards.items()
                                     if t > m1))

    prev_T = 0.0
    for T, spread_bps in sorted(cds_spreads):
        spread = spread_bps / 10000  # convert bps to decimal

        payment_times = np.arange(1/freq, T + 1e-9, 1/freq)
        delta = 1.0 / freq  # payment interval

        def par_condition(h_T):
            # Survival function: piecewise constant hazard
            def Q(t):
                # Use already-bootstrapped hazards for t <= prev_T
                q = 1.0
                for (m1, m2), h in hazards.items():
                    q *= np.exp(-h * (min(t, m2) - m1)) if t > m1 else 1.0
                # Add new hazard for prev_T to T
                q *= np.exp(-h_T * max(min(t, T) - prev_T, 0.0))
                return q

            premium_leg = spread * sum(delta * np.exp(-r*t) * Q(t)
                                        for t in payment_times)
            protection_leg = (1 - recovery) * sum(
                np.exp(-r*t) * (Q(t - delta) - Q(t)) for t in payment_times)
            return premium_leg - protection_leg

        h = brentq(par_condition, 0.0, 10.0, xtol=1e-8)
        hazards[(prev_T, T)] = h
        prev_T = T

    # Convert to results
    result = {}
    for (m1, m2), h in hazards.items():
        result[m2] = {"hazard_rate": h,
                      "default_prob_5y": 1 - np.exp(-h * 5)}
    return result

cds = [(1, 50), (3, 80), (5, 100), (10, 120)]  # tenors, spreads in bps
hazards = bootstrap_hazard_rates(cds)
for T, v in hazards.items():
    print(f"  T={T}Y: lambda={v['hazard_rate']:.4f}  PD_5Y={v['default_prob_5y']:.2%}")`,
    explanation: "CDS hazard rate bootstrapping iteratively solves for the piecewise-constant intensity that makes each CDS contract worth zero at inception (par spread condition). The survival probability Q(t) = exp(-integral h dt) is the key quantity: it drives both the premium leg (annuity weighted by survival) and the protection leg (contingent on default), and is the foundation of credit portfolio risk models.",
  },
  {
    id: "pyfin-20260702-b1-regime-switching",
    language: "python",
    title: "Hamilton Regime-Switching Model (2-State HMM) for Volatility",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def hamilton_em(returns: np.ndarray, n_iter: int = 100) -> dict:
    """
    Hamilton (1989) 2-state regime-switching model via EM algorithm.
    State 0: low vol (bull), State 1: high vol (bear)
    Returns: mus, sigmas, transition matrix P, filtered probabilities.
    """
    T  = len(returns)
    # Initialise: low-vol and high-vol regimes
    mu    = np.array([returns[returns < returns.mean()].mean(),
                      returns[returns >= returns.mean()].mean()])
    sigma = np.array([returns[returns < returns.mean()].std() + 0.001,
                      returns[returns >= returns.mean()].std() + 0.001])
    P = np.array([[0.95, 0.05], [0.10, 0.90]])  # transition matrix

    for _ in range(n_iter):
        # E-step: Hamilton filter (forward pass)
        xi  = np.full((T, 2), 0.5)     # filtered P(s_t = j | I_t)
        pred = np.array([0.5, 0.5])    # predicted P(s_t = j | I_{t-1})

        for t in range(T):
            # Emission density N(r_t; mu_j, sigma_j)
            f  = (np.exp(-0.5*((returns[t]-mu)/sigma)**2)
                  / (sigma * np.sqrt(2*np.pi)))
            # Joint: pred * f
            joint = pred * f
            xi[t] = joint / (joint.sum() + 1e-300)
            # Predict next period
            pred  = P.T @ xi[t]

        # M-step: update parameters
        mu    = (xi * returns[:, None]).sum(axis=0) / xi.sum(axis=0)
        sigma = np.sqrt((xi * (returns[:, None] - mu)**2).sum(axis=0)
                        / xi.sum(axis=0)) + 1e-6

        # Transition matrix: use two-step smoother (simplified)
        for s in range(2):
            for sn in range(2):
                num = sum(P[s, sn] * xi[t-1, s] * (
                    np.exp(-0.5*((returns[t]-mu[sn])/sigma[sn])**2)
                    / (sigma[sn]*np.sqrt(2*np.pi))
                ) for t in range(1, T))
                den = (xi[:-1, s].sum() + 1e-300)
                P[s, sn] = num / den + 1e-10
            P[s] /= P[s].sum()

    # Long-run regime probabilities (stationary distribution)
    eig = np.linalg.eig(P.T)
    stat = np.abs(eig[1][:, np.argmax(np.abs(eig[0] - 1.0) < 1e-6)])
    stat = (stat / stat.sum()).real

    return {"mu": mu, "sigma": sigma, "P": P, "xi": xi, "stationary": stat}

np.random.seed(42)
T  = 500
# Simulate 2-regime returns
regime   = np.zeros(T, dtype=int)
returns  = np.zeros(T)
regime[0] = 0
for t in range(1, T):
    regime[t] = np.random.choice([0,1], p=[0.95, 0.05] if regime[t-1]==0 else [0.10, 0.90])
    sigma_t = 0.008 if regime[t] == 0 else 0.025
    returns[t] = np.random.normal(0.0005 if regime[t]==0 else -0.001, sigma_t)

result = hamilton_em(returns)
print(f"Regime 0 (low-vol):  mu={result['mu'][0]*100:.4f}%  sigma={result['sigma'][0]*100:.4f}%")
print(f"Regime 1 (high-vol): mu={result['mu'][1]*100:.4f}%  sigma={result['sigma'][1]*100:.4f}%")
print(f"Transition P:\\n{np.round(result['P'], 3)}")
print(f"Stationary prob: {np.round(result['stationary'], 3)}")`,
    explanation: "Hamilton's regime-switching model uses an EM algorithm to jointly estimate regime-specific parameters and transition probabilities. The forward filter (Hamilton filter) is a hidden Markov model that computes P(regime_t | data up to t), giving a smooth, probabilistic estimate of the current market state — directly usable as a conditioning variable for volatility-regime-aware trading strategies.",
  },
  {
    id: "pyfin-20260702-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory (POT/GPD) for Tail Risk VaR",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def pot_var_cvar(
    losses: np.ndarray,
    threshold_quantile: float = 0.90,
    confidence: float = 0.99
) -> dict:
    """
    Peaks-Over-Threshold (POT) method for tail risk estimation.
    Fits a Generalised Pareto Distribution (GPD) to exceedances above u.
    VaR and CVaR computed analytically from the GPD fit.

    GPD: F(x) = 1 - (1 + xi*x/beta)^(-1/xi) for xi != 0
    """
    u     = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u

    # MLE fit of GPD to exceedances
    xi_init, beta_init = 0.1, exceedances.mean()
    def neg_loglik(params):
        xi, beta = params
        if beta <= 0:
            return 1e10
        if xi == 0:
            return len(exceedances) * np.log(beta) + exceedances.sum() / beta
        arg = 1 + xi * exceedances / beta
        if np.any(arg <= 0):
            return 1e10
        return (len(exceedances) * np.log(beta)
                + (1 + 1/xi) * np.log(arg).sum())

    res = minimize(neg_loglik, [xi_init, beta_init], method='Nelder-Mead',
                   options={'xatol': 1e-10, 'maxiter': 10000})
    xi, beta = res.x

    n  = len(losses)
    n_u = len(exceedances)  # number of exceedances
    F_u = 1 - n_u / n       # empirical CDF at threshold

    # Tail VaR and CVaR from POT formula
    p_tail = (1 - confidence) / (1 - F_u)  # conditional exceedance prob
    if abs(xi) < 1e-8:
        var_cond = -beta * np.log(p_tail)   # exponential limit
    else:
        var_cond = beta / xi * (p_tail**(-xi) - 1)

    var = u + var_cond

    if abs(xi) < 1e-8:
        cvar = var + beta
    else:
        cvar = (var + beta - xi * u) / (1 - xi)

    return {
        "threshold_u": u,
        "n_exceedances": n_u,
        "gpd_xi": xi,
        "gpd_beta": beta,
        "VaR": var,
        "CVaR": cvar,
        "empirical_VaR": np.quantile(losses, confidence),
    }

np.random.seed(42)
# Fat-tailed P&L losses (Student-t, 3 dof) scaled to daily
losses = -np.random.standard_t(df=4, size=5000) * 0.01  # negative = losses
losses = losses[losses > 0]  # keep only losses

result = pot_var_cvar(losses, threshold_quantile=0.90, confidence=0.99)
for k, v in result.items():
    print(f"{k:>20}: {v:.6f}" if isinstance(v, float) else f"{k:>20}: {v}")`,
    explanation: "POT/GPD is the theoretically grounded approach to tail risk: by the Pickands-Balkema-de Haan theorem, the excess distribution above any high threshold converges to a GPD regardless of the parent distribution. The shape parameter xi > 0 indicates fat tails (heavy-tailed distributions like equities) and gives more conservative VaR/CVaR than parametric normal models.",
  },
  {
    id: "pyfin-20260702-b1-markowitz-cla",
    language: "python",
    title: "Markowitz Critical Line Algorithm for Efficient Frontier",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def efficient_frontier(
    mu: np.ndarray,
    Sigma: np.ndarray,
    n_points: int = 50,
    allow_short: bool = False
) -> dict:
    """
    Compute efficient frontier via parametric quadratic programming.
    Sweeps target returns from minimum variance to maximum Sharpe.
    Returns: dict with arrays of (returns, vols, weights, sharpe_ratios).
    """
    N = len(mu)
    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1}]
    bounds = ((-1, 1) if allow_short else (0, 1),) * N

    def portfolio_vol(w):
        return np.sqrt(w @ Sigma @ w)

    def neg_sharpe(w, rf=0.0):
        ret = w @ mu
        vol = portfolio_vol(w)
        return -(ret - rf) / vol if vol > 1e-8 else 1e10

    # Min-variance portfolio
    res_mv = minimize(portfolio_vol, np.ones(N)/N,
                      constraints=constraints, bounds=bounds,
                      method='SLSQP')
    mu_min = res_mv.x @ mu

    # Max-return portfolio (concentrated)
    mu_max = mu.max() if not allow_short else (mu * 2).max()

    frontier_rets  = []
    frontier_vols  = []
    frontier_wts   = []
    sharpes        = []

    for target in np.linspace(mu_min, mu_max * 0.98, n_points):
        cons = constraints + [{"type": "eq", "fun": lambda w: w @ mu - target}]
        res  = minimize(portfolio_vol, np.ones(N)/N,
                        constraints=cons, bounds=bounds, method='SLSQP')
        if res.success and res.fun < 1.0:
            frontier_rets.append(res.x @ mu)
            frontier_vols.append(res.fun)
            frontier_wts.append(res.x)
            sharpes.append(res.x @ mu / res.fun)

    return {
        "returns":     np.array(frontier_rets),
        "vols":        np.array(frontier_vols),
        "weights":     np.array(frontier_wts),
        "sharpes":     np.array(sharpes),
        "max_sharpe_idx": int(np.argmax(sharpes)),
    }

N = 5
np.random.seed(42)
mu    = np.array([0.10, 0.13, 0.08, 0.15, 0.11])
A     = np.random.randn(N, N) * 0.1
Sigma = A @ A.T / N + np.diag([0.04, 0.09, 0.02, 0.16, 0.06])

frontier = efficient_frontier(mu, Sigma)
best = frontier['max_sharpe_idx']
print(f"Max Sharpe portfolio:")
print(f"  Return:  {frontier['returns'][best]*100:.2f}%")
print(f"  Vol:     {frontier['vols'][best]*100:.2f}%")
print(f"  Sharpe:  {frontier['sharpes'][best]:.3f}")
print(f"  Weights: {np.round(frontier['weights'][best], 3)}")`,
    explanation: "The efficient frontier sweeps target return levels and minimises variance at each via quadratic programming (SLSQP). The maximum-Sharpe portfolio lies on the Capital Market Line tangency with the frontier. In practice, the Ledoit-Wolf shrinkage covariance replaces the sample Sigma to prevent the optimiser from exploiting estimation noise with extreme concentrated allocations.",
  },
  {
    id: "pyfin-20260702-b1-hull-white-caplet",
    language: "python",
    title: "Hull-White Caplet Pricing via Analytic Formula",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def hw_zcb_price(r0: float, a: float, sigma: float, theta_bar: float,
                  t: float, T: float) -> float:
    """
    Hull-White ZCB price: P(t,T) = A(t,T)*exp(-B(t,T)*r_t)
    (flat theta parameterisation: theta(t) = a*theta_bar)
    """
    tau = T - t
    B   = (1 - np.exp(-a * tau)) / a
    A_log = ((theta_bar - sigma**2 / (2*a**2)) * (B - tau)
             - sigma**2 * B**2 / (4*a))
    return np.exp(A_log - B * r0)

def hw_caplet_price(r0: float, a: float, sigma: float, theta_bar: float,
                    K: float, T_reset: float, T_settle: float,
                    notional: float = 1_000_000) -> float:
    """
    Hull-White caplet: option on LIBOR rate over [T_reset, T_settle].
    Equivalent to a put on ZCB P(T_reset, T_settle) with strike 1/(1 + K*tau).
    """
    tau   = T_settle - T_reset
    K_ZCB = 1.0 / (1 + K * tau)   # strike on ZCB equivalent

    # ZCB prices
    P_0T  = hw_zcb_price(r0, a, sigma, theta_bar, 0, T_reset)
    P_0S  = hw_zcb_price(r0, a, sigma, theta_bar, 0, T_settle)

    # Jamshidian vol for the put on ZCB
    B_ts  = (1 - np.exp(-a * tau)) / a
    sig_p = sigma * B_ts * np.sqrt((1 - np.exp(-2*a*T_reset)) / (2*a))

    # Black formula for put on ZCB
    h     = np.log(P_0S / (P_0T * K_ZCB)) / sig_p + 0.5 * sig_p
    caplet_val = notional * (K_ZCB * P_0T * norm.cdf(-h + sig_p)
                              - P_0S * norm.cdf(-h))
    return caplet_val

def hw_cap_price(r0: float, a: float, sigma: float, theta_bar: float,
                  K: float, cap_end: float, freq: int = 2,
                  notional: float = 1_000_000) -> float:
    """Cap = sum of caplets."""
    reset_times  = np.arange(1/freq, cap_end, 1/freq)
    settle_times = reset_times + 1/freq
    total = 0.0
    for T_r, T_s in zip(reset_times, settle_times):
        total += hw_caplet_price(r0, a, sigma, theta_bar, K, T_r, T_s, notional)
    return total

# r0=4%, a=10%, sigma=1%, long-run=5%, K=5% cap on 5Y semi-annual
cap_price = hw_cap_price(0.04, 0.10, 0.01, 0.05, 0.05, 5.0, freq=2)
print(f"Hull-White 5Y cap price: USD {cap_price:,.0f}")`,
    explanation: "Hull-White caplets price as puts on zero-coupon bonds via the Jamshidian (1989) trick: the caplet payoff max(L - K, 0)*tau*N is equivalent to (1 + K*tau) put options on the T_settle ZCB with strike K_ZCB = 1/(1+K*tau). The Black-type formula then applies since ZCB prices are log-normal in the Hull-White model.",
  },
  {
    id: "pyfin-20260702-b1-control-variate",
    language: "python",
    title: "Control Variate MC: Asian Arithmetic via Geometric Analytic",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bsm_geometric_asian(S0: float, K: float, r: float, T: float,
                         sigma: float, n: int) -> float:
    """Analytic price for geometric average Asian call (Kemna-Vorst 1990)."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n+1)))
    mu_g    = 0.5 * (r - 0.5*sigma**2) + sigma_g**2 / 2
    d1 = (np.log(S0/K) + (mu_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)
    return np.exp(-r*T) * (S0*np.exp(mu_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

def arithmetic_asian_cv(S0: float, K: float, r: float, T: float,
                         sigma: float, steps: int = 52,
                         paths: int = 100_000, seed: int = 42) -> dict:
    """
    Arithmetic Asian call via MC with geometric average as control variate.
    The geometric and arithmetic averages are highly correlated;
    the residual Y - beta*(X - E[X]) has much lower variance than Y alone.
    """
    rng = np.random.default_rng(seed)
    dt  = T / steps
    drift = (r - 0.5*sigma**2) * dt
    sv    = sigma * np.sqrt(dt)

    arith_payoffs = np.empty(paths)
    geom_payoffs  = np.empty(paths)

    for p in range(paths):
        S = S0
        path = np.empty(steps)
        for t in range(steps):
            S *= np.exp(drift + sv * rng.standard_normal())
            path[t] = S
        arith_payoffs[p] = max(path.mean() - K, 0.0)
        geom_payoffs[p]  = max(np.exp(np.log(path).mean()) - K, 0.0)

    # Control variate adjustment
    E_geom  = bsm_geometric_asian(S0, K, r, T, sigma, steps)
    beta    = np.cov(arith_payoffs, geom_payoffs)[0, 1] / np.var(geom_payoffs)
    cv_pays = arith_payoffs - beta * (geom_payoffs - E_geom)

    price_naive = np.exp(-r*T) * arith_payoffs.mean()
    price_cv    = np.exp(-r*T) * cv_pays.mean()
    se_naive    = np.exp(-r*T) * arith_payoffs.std() / np.sqrt(paths)
    se_cv       = np.exp(-r*T) * cv_pays.std() / np.sqrt(paths)

    return {
        "price_naive": price_naive, "se_naive": se_naive,
        "price_cv":    price_cv,    "se_cv":    se_cv,
        "variance_reduction": (se_naive / se_cv)**2,
        "beta": beta,
    }

result = arithmetic_asian_cv(100, 100, 0.05, 1.0, 0.20)
print(f"Naive MC:  {result['price_naive']:.4f} +/- {result['se_naive']:.4f}")
print(f"CV MC:     {result['price_cv']:.4f}    +/- {result['se_cv']:.4f}")
print(f"Variance reduction factor: {result['variance_reduction']:.1f}x")`,
    explanation: "The control variate method exploits the fact that arithmetic and geometric Asian averages are highly correlated (both are sums of path values): subtracting beta times the deviation of the geometric payoff from its known analytic value removes the common noise. Typical variance reductions are 20-100x, equivalent to multiplying paths by that factor for free.",
  },
  {
    id: "pyfin-20260702-b1-cointegration-johansen",
    language: "python",
    title: "Johansen Cointegration Test for Multi-Asset Pairs",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.tsa.vector_ar.vecm as vecm
from statsmodels.tsa.stattools import adfuller

def johansen_cointegration(prices: pd.DataFrame, max_lags: int = 1) -> dict:
    """
    Johansen (1991) cointegration test for a system of I(1) price series.
    Returns: number of cointegrating vectors, spread series, and hedge ratios.
    """
    # Log prices
    log_p = np.log(prices)

    # First, verify series are I(1)
    adf_results = {}
    for col in log_p.columns:
        adf_stat, adf_pval, *_ = adfuller(log_p[col].dropna(), maxlag=max_lags)
        diff_stat, diff_pval, *_ = adfuller(log_p[col].diff().dropna(), maxlag=max_lags)
        adf_results[col] = {
            "level_pval": round(adf_pval, 4),
            "diff_pval":  round(diff_pval, 4),
        }

    # Johansen test
    result = vecm.coint_johansen(log_p.dropna(), det_order=0, k_ar_diff=max_lags)

    # Number of cointegrating vectors at 5% significance (trace statistic)
    trace_stats = result.lr1   # trace statistics
    crit_vals   = result.cvt   # critical values at 10%, 5%, 1%
    n_coint = sum(trace_stats[i] > crit_vals[i, 1] for i in range(len(trace_stats)))

    # First cointegrating vector (normalise first element to 1)
    beta_raw = result.evec[:, 0]
    beta     = beta_raw / beta_raw[0]

    # Compute spread (stationary cointegrating residual)
    spread = log_p.values @ beta_raw
    spread_series = pd.Series(spread, index=log_p.index, name="spread")

    adf_spread, pval_spread, *_ = adfuller(spread_series.dropna())

    return {
        "n_coint_vectors": n_coint,
        "beta": dict(zip(prices.columns, np.round(beta, 4))),
        "spread": spread_series,
        "spread_adf_pval": round(pval_spread, 4),
        "adf_results": adf_results,
        "trace_stats": dict(zip(range(len(trace_stats)), np.round(trace_stats, 2))),
    }

np.random.seed(42)
n  = 500
# Cointegrated trio: X and Y integrated; Z = 0.5*X - 0.3*Y + stationary_noise
X  = np.cumsum(np.random.randn(n) * 0.01) + 4.6   # log(100)
Y  = np.cumsum(np.random.randn(n) * 0.015) + 4.6
Z  = 0.5*X - 0.3*Y + np.random.randn(n)*0.005 + 2.3

df = pd.DataFrame({"X": np.exp(X), "Y": np.exp(Y), "Z": np.exp(Z)},
                  index=pd.date_range("2022-01-03", periods=n, freq="B"))

res = johansen_cointegration(df)
print(f"Cointegrating vectors found: {res['n_coint_vectors']}")
print(f"Hedge ratios: {res['beta']}")
print(f"Spread ADF p-value: {res['spread_adf_pval']} (should be << 0.05)")`,
    explanation: "Johansen's test is the multivariate extension of the Engle-Granger two-step cointegration test: it simultaneously identifies the number of cointegrating relationships and estimates all the linear combinations that are stationary. In statistical arbitrage, the first cointegrating vector gives the hedge ratios that form a mean-reverting spread across the asset basket.",
  },
  {
    id: "pyfin-20260702-b1-market-impact-linear",
    language: "python",
    title: "Linear Temporary Market Impact Model with Slippage Estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def estimate_market_impact(
    fills: pd.DataFrame,
    pre_trade_col: str = "arrival_price",
    fill_col: str = "fill_price",
    qty_col: str = "qty",
    adv_col: str = "adv",   # average daily volume
    side_col: str = "side"  # 'B' or 'S'
) -> dict:
    """
    Estimate market impact from fill data.
    Implementation shortfall = fill_price - arrival_price (for buys)
    Market impact model: IS = alpha + beta * (qty/ADV) + noise

    alpha: fixed cost (half-spread, timing risk)
    beta:  linear impact coefficient (bps per % ADV)
    """
    df = fills.copy()
    # Implementation shortfall in bps
    df['IS_bps'] = np.where(
        df[side_col] == 'B',
        (df[fill_col] - df[pre_trade_col]) / df[pre_trade_col] * 10000,
        (df[pre_trade_col] - df[fill_col]) / df[pre_trade_col] * 10000
    )
    df['pct_adv']  = df[qty_col] / df[adv_col] * 100  # % of ADV

    # OLS: IS = alpha + beta * pct_adv
    X   = np.column_stack([np.ones(len(df)), df['pct_adv'].values])
    y   = df['IS_bps'].values
    XtX = X.T @ X
    Xty = X.T @ y
    try:
        params = np.linalg.solve(XtX, Xty)
    except np.linalg.LinAlgError:
        params = [0.0, 0.0]

    alpha, beta = params
    y_hat       = X @ params
    resid       = y - y_hat
    r2          = 1 - resid.var() / y.var()

    def predict_is(qty_pct_adv: float) -> float:
        """Predict IS in bps for a given order size as % of ADV."""
        return alpha + beta * qty_pct_adv

    return {
        "alpha_bps": alpha,
        "beta_bps_per_pct_adv": beta,
        "r2": r2,
        "predict_is": predict_is,
        "n_fills": len(df),
        "median_IS_bps": df['IS_bps'].median(),
    }

# Synthetic fill data
np.random.seed(42)
n_fills = 500
fills = pd.DataFrame({
    "arrival_price": np.random.uniform(90, 110, n_fills),
    "qty":           np.random.randint(100, 10000, n_fills),
    "adv":           np.random.uniform(1e6, 5e6, n_fills),
    "side":          np.random.choice(['B', 'S'], n_fills),
})
true_beta = 2.5  # 2.5 bps per % ADV
pct_adv   = fills['qty'] / fills['adv'] * 100
fills['fill_price'] = fills['arrival_price'] * (
    1 + np.where(fills['side']=='B', 1, -1)
    * (1.5 + true_beta * pct_adv / 10000 + np.random.randn(n_fills)*0.0002))

result = estimate_market_impact(fills)
print(f"Alpha (fixed cost):  {result['alpha_bps']:.2f} bps")
print(f"Beta  (linear impact): {result['beta_bps_per_pct_adv']:.3f} bps/% ADV")
print(f"R2: {result['r2']:.3f}")
print(f"Predicted IS at 1% ADV: {result['predict_is'](1.0):.2f} bps")`,
    explanation: "Linear impact models estimate the execution cost as alpha + beta * (order size / ADV): alpha captures fixed costs (spread, timing) and beta captures the incremental impact per unit of market participation. This model is calibrated from historical fill data and used for pre-trade cost estimation in VWAP/TWAP scheduling and transaction cost analysis (TCA) reporting.",
  },
  {
    id: "pyfin-20260702-b1-multi-index-factor",
    language: "python",
    title: "Pandas MultiIndex Factor Performance Attribution",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def factor_attribution(
    holdings: pd.DataFrame,        # (date, asset) MultiIndex, cols: weight, return
    factor_exposures: pd.DataFrame, # (date, asset) MultiIndex, cols: factor names
) -> pd.DataFrame:
    """
    Brinson-Hood-Beebower style factor attribution using pandas MultiIndex.
    Computes portfolio return, factor contributions, and residual per period.
    holdings:       level 0=date, level 1=asset  cols=[weight, daily_return]
    factor_exposures: same index, cols=[factor1, factor2, ...]
    """
    combined = holdings.join(factor_exposures, how='inner')
    factors  = factor_exposures.columns.tolist()

    results = []
    for date, group in combined.groupby(level=0):
        w   = group['weight'].values
        r   = group['daily_return'].values
        F   = group[factors].values     # (n_assets, n_factors)
        port_ret = w @ r                 # total portfolio return

        # Weighted factor returns: r_f = sum_i w_i * F_ij * (portfolio return approx)
        # Standard: factor contribution = beta_f * factor_return
        # Simplified: weight-factor product times asset return
        factor_contr = {}
        for j, fname in enumerate(factors):
            # Contribution from factor j: sum_i w_i * F_ij * r_i  (Brinson-like)
            factor_contr[fname] = (w * F[:, j] * r).sum()

        residual = port_ret - sum(factor_contr.values())
        results.append({"date": date, "port_ret": port_ret,
                         **factor_contr, "residual": residual})

    return pd.DataFrame(results).set_index("date")

# Build synthetic daily data
np.random.seed(42)
dates  = pd.date_range("2026-01-02", periods=60, freq="B")
assets = ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"]
N      = len(assets)

idx = pd.MultiIndex.from_product([dates, assets], names=["date", "asset"])
w   = np.tile(np.array([0.25, 0.25, 0.2, 0.15, 0.15]), len(dates))
r   = np.random.randn(len(idx)) * 0.012

holdings = pd.DataFrame({"weight": w, "daily_return": r}, index=idx)

# Factor exposures: momentum (MOM) and quality (QUAL) scores
mom  = np.random.randn(len(idx))
qual = np.random.randn(len(idx))
exposures = pd.DataFrame({"MOM": mom, "QUAL": qual}, index=idx)

attr = factor_attribution(holdings, exposures)
print("Daily factor attribution (first 5 days):")
print(attr.head().round(5))
print(f"\\nCumulative factor contributions:")
print(attr[['MOM', 'QUAL', 'residual']].sum().round(5))`,
    explanation: "Brinson-style attribution decomposes portfolio returns into factor contributions and idiosyncratic residual using pandas MultiIndex groupby operations. The MultiIndex (date, asset) structure allows vectorised cross-sectional factor loading computations per period without explicit loops — essential for attribution reports covering thousands of assets across multi-year histories.",
  },
  {
    id: "pyfin-20260702-b1-theta-ladder",
    language: "python",
    title: "Theta Ladder / Volatility Surface P&L Vector",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bsm_all_greeks(S: float, K: float, r: float, T: float, sigma: float) -> dict:
    if T <= 0 or sigma <= 0:
        return {"price": max(S-K, 0), "delta": 1.0 if S > K else 0.0,
                "gamma": 0.0, "vega": 0.0, "theta": 0.0}
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    Nd1, Nd2 = norm.cdf(d1), norm.cdf(d2)
    nd1 = norm.pdf(d1)
    df  = np.exp(-r*T)
    return {
        "price": S*Nd1 - K*df*Nd2,
        "delta": Nd1,
        "gamma": nd1 / (S*sigma*sqT),
        "vega":  S*nd1*sqT / 100,        # per 1% vol change
        "theta": -(S*nd1*sigma/(2*sqT) + r*K*df*Nd2) / 365,  # per calendar day
    }

def theta_ladder_report(
    positions: list[dict],  # each: {K, T, sigma, qty, notional}
    S: float = 100.0,
    r: float = 0.05,
    vol_shocks: list[float] = [-0.05, -0.02, 0, 0.02, 0.05]
) -> pd.DataFrame:
    """
    Compute theta ladder: daily theta + vega P&L across vol scenarios.
    positions: list of option positions with qty (positive=long, negative=short)
    """
    import pandas as pd
    rows = []
    for pos in positions:
        g = bsm_all_greeks(S, pos['K'], r, pos['T'], pos['sigma'])
        row = {
            "K": pos['K'], "T_days": round(pos['T']*365),
            "sigma": pos['sigma'],
            "theta_daily_usd": g['theta'] * pos['qty'] * pos['notional'],
        }
        for dv in vol_shocks:
            vol_new = max(pos['sigma'] + dv, 0.001)
            g_new = bsm_all_greeks(S, pos['K'], r, pos['T'], vol_new)
            pnl = (g_new['price'] - g['price']) * pos['qty'] * pos['notional']
            row[f"vol{'+' if dv >= 0 else ''}{int(dv*100)}pct"] = round(pnl, 0)
        rows.append(row)

    import pandas as pd
    df = pd.DataFrame(rows)
    totals = df.select_dtypes(include='number').sum()
    df.loc['TOTAL'] = totals
    return df

positions = [
    {"K": 95,  "T": 30/365, "sigma": 0.22, "qty": 100, "notional": 100},
    {"K": 100, "T": 30/365, "sigma": 0.20, "qty": -200, "notional": 100},
    {"K": 105, "T": 30/365, "sigma": 0.22, "qty": 100, "notional": 100},
    {"K": 100, "T": 90/365, "sigma": 0.21, "qty": 50,  "notional": 100},
]

import pandas as pd
report = theta_ladder_report(positions, S=100, r=0.05)
pd.set_option('display.width', 120)
print(report.to_string())`,
    explanation: "The theta ladder is a risk report showing each option position's daily time decay and its P&L under parallel vol surface shifts. A long butterfly position (the first three rows above) is net theta-negative (pays time value) but profits from vol expansion — the total row shows the book's aggregate exposure and helps traders size hedges against vol moves.",
  },
];
