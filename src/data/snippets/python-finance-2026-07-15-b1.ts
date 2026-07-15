import { Snippet } from "./types";

export const pythonFinanceSnippets20260715B1: Snippet[] = [
  {
    id: "pyfin-20260715-b1-fama-french-3factor",
    language: "python",
    title: "Fama-French 3-Factor OLS Regression and Alpha Estimation",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd
from scipy.stats import t as tdist

def fama_french_3factor(returns: pd.Series,
                         mkt_rf: pd.Series,
                         smb: pd.Series,
                         hml: pd.Series,
                         rf: pd.Series) -> dict:
    """
    OLS regression of excess returns on FF3 factors:
      r_i - rf = alpha + beta_mkt*(Mkt-Rf) + beta_smb*SMB + beta_hml*HML + eps
    Returns factor exposures, alpha (annualised), t-stats, p-values, R^2.
    """
    exc_ret = returns - rf
    X = np.column_stack([
        np.ones(len(exc_ret)),
        mkt_rf - rf,
        smb,
        hml,
    ])
    y = exc_ret.values

    XtX_inv = np.linalg.inv(X.T @ X)
    beta    = XtX_inv @ X.T @ y
    yhat    = X @ beta
    resid   = y - yhat
    T       = len(y)

    sigma2  = resid.var(ddof=4)  # 4 params
    se_beta = np.sqrt(sigma2 * np.diag(XtX_inv))
    t_stats = beta / se_beta
    p_vals  = 2 * tdist.sf(np.abs(t_stats), df=T - 4)

    r2 = 1 - (resid**2).sum() / ((y - y.mean())**2).sum()

    freq = 252  # daily to annual
    return {
        "alpha_annual": float(beta[0] * freq),
        "beta_mkt":     float(beta[1]),
        "beta_smb":     float(beta[2]),
        "beta_hml":     float(beta[3]),
        "t_alpha":      float(t_stats[0]),
        "p_alpha":      float(p_vals[0]),
        "R2":           float(r2),
        "information_ratio": float(beta[0] / resid.std() * np.sqrt(freq)),
    }

# Synthetic demo
rng = np.random.default_rng(42)
T   = 500
mkt = rng.normal(0.0004, 0.01, T)
smb = rng.normal(0.0001, 0.005, T)
hml = rng.normal(0.0001, 0.005, T)
rf  = np.full(T, 0.00015)
# Fund: 5% annual alpha + market exposure
ret = rf + 0.05/252 + 1.1*(mkt - rf) + 0.3*smb - 0.1*hml + rng.normal(0, 0.003, T)

result = fama_french_3factor(
    pd.Series(ret), pd.Series(mkt), pd.Series(smb), pd.Series(hml), pd.Series(rf)
)
print(result)`,
    explanation:
      "The Fama-French 3-factor model decomposes a fund's return into market (CAPM beta), small-cap (SMB), and value (HML) exposures, with alpha representing skill net of systematic risk. A high t-stat on alpha (|t| > 2) after controlling for all three factors is evidence of genuine manager skill — much harder to achieve than raw excess return.",
  },
  {
    id: "pyfin-20260715-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tau: np.ndarray, beta0: float, beta1: float,
                  beta2: float, lam: float) -> np.ndarray:
    """
    Nelson-Siegel (1987) yield curve:
      y(tau) = beta0 + beta1 * (1 - exp(-tau/lam)) / (tau/lam)
             + beta2 * ((1 - exp(-tau/lam)) / (tau/lam) - exp(-tau/lam))
    beta0: long-run level
    beta1: short-term component (decays to 0)
    beta2: medium-term hump
    lam  : decay factor (controls hump location)
    """
    x   = tau / lam
    ex  = np.exp(-x)
    # Guard against tau=0 (limit of (1-exp(-x))/x = 1)
    phi1 = np.where(x < 1e-8, 1.0, (1 - ex) / x)
    phi2 = phi1 - ex
    return beta0 + beta1 * phi1 + beta2 * phi2

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray) -> dict:
    """Fit NS model to observed (maturity, yield) pairs via least squares."""
    def objective(params):
        b0, b1, b2, lam = params
        if lam <= 0: return 1e10
        fitted = nelson_siegel(maturities, b0, b1, b2, lam)
        return np.sum((fitted - yields)**2)

    # Initial guess: level ~ long yield, short factor ~ short-long spread
    y0 = [yields[-1], yields[0] - yields[-1], 0.0, 1.5]
    res = minimize(objective, y0, method='Nelder-Mead',
                   options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 10000})

    b0, b1, b2, lam = res.x
    fitted = nelson_siegel(maturities, b0, b1, b2, lam)
    rmse   = np.sqrt(np.mean((fitted - yields)**2))

    return {"beta0": round(b0, 6), "beta1": round(b1, 6),
            "beta2": round(b2, 6), "lambda": round(lam, 4),
            "rmse_bps": round(rmse * 1e4, 2)}

# US-Treasury-style spot curve (% decimal)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.053, 0.052, 0.050, 0.047, 0.045, 0.042, 0.041, 0.040, 0.042, 0.043])

result = fit_nelson_siegel(maturities, yields)
print(result)

# Forecast yields at arbitrary tenors
b0, b1, b2, lam = result["beta0"], result["beta1"], result["beta2"], result["lambda"]
tau_dense = np.linspace(0.1, 30, 300)
y_fitted  = nelson_siegel(tau_dense, b0, b1, b2, lam)
print(f"6M fitted yield: {nelson_siegel(np.array([0.5]), b0, b1, b2, lam)[0]*100:.3f}%")`,
    explanation:
      "Nelson-Siegel is the go-to parsimonious yield curve model: four parameters describe the level, slope, and curvature of essentially any sovereign yield curve. It extrapolates smoothly beyond observed maturities and its factors have intuitive economic interpretations (level ≈ long-run rate expectation, slope ≈ monetary policy stance, curvature ≈ term premium hump).",
  },
  {
    id: "pyfin-20260715-b1-svi-vol-surface",
    language: "python",
    title: "SVI Implied Volatility Surface Parametrization",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_raw(k: np.ndarray, a: float, b: float, rho: float,
            m: float, sigma: float) -> np.ndarray:
    """
    Gatheral (2004) SVI (Stochastic Volatility Inspired) total variance:
      w(k) = a + b * (rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    where k = log(K/F) (log-moneyness), w = sigma_impl^2 * T.
    No-butterfly-arbitrage: b*(1+|rho|) < 4/T (approximately).
    """
    z  = k - m
    return a + b * (rho * z + np.sqrt(z**2 + sigma**2))

def svi_to_vol(w: np.ndarray, T: float) -> np.ndarray:
    """Convert total implied variance to implied vol."""
    return np.sqrt(np.maximum(w / T, 0.0))

def fit_svi(strikes: np.ndarray, market_vols: np.ndarray,
            F: float, T: float) -> dict:
    """Fit SVI to a single expiry slice."""
    k = np.log(strikes / F)
    w_mkt = market_vols**2 * T

    def objective(params):
        a, b, rho, m, sigma = params
        # Constraints: a > 0, b > 0, |rho| < 1, sigma > 0, a + b*sigma*sqrt(1-rho^2) >= 0
        if b <= 0 or sigma <= 0 or abs(rho) >= 1 or a < -b*sigma*np.sqrt(1-rho**2):
            return 1e10
        w_fit = svi_raw(k, a, b, rho, m, sigma)
        if np.any(w_fit <= 0): return 1e10
        return np.sum((w_fit - w_mkt)**2)

    # Initial guess from ATM variance
    atm_idx = np.argmin(np.abs(k))
    atm_w   = w_mkt[atm_idx]
    x0 = [atm_w * 0.8, 0.1, -0.3, 0.0, 0.2]

    res = minimize(objective, x0, method='Nelder-Mead',
                   options={'maxiter': 20000, 'xatol': 1e-9})
    a, b, rho, m, sigma = res.x
    fitted_vols = svi_to_vol(svi_raw(k, a, b, rho, m, sigma), T)

    return {"a": a, "b": b, "rho": rho, "m": m, "sigma": sigma,
            "rmse_bps": np.sqrt(np.mean((fitted_vols - market_vols)**2)) * 1e4}

# Example: 6-month expiry, 9 strikes
F = 100.0; T = 0.5
strikes = np.array([80, 85, 90, 95, 100, 105, 110, 115, 120], dtype=float)
# Typical downward-sloping smile for equities
vols = np.array([0.28, 0.25, 0.22, 0.20, 0.18, 0.18, 0.19, 0.20, 0.21])

params = fit_svi(strikes, vols, F, T)
print(f"SVI params: {params}")`,
    explanation:
      "SVI parametrizes the total variance smile w(k) = σ²T with 5 parameters that have direct analytic no-arbitrage conditions. The asymptotic slopes control the left and right tails of the smile: rho drives the overall tilt (equity skew is typically negative), while sigma controls the curvature near-ATM. SVI is widely used for model-free density extraction and exotic barrier pricing.",
  },
  {
    id: "pyfin-20260715-b1-heston-calibration",
    language: "python",
    title: "Heston Model Calibration to Market Implied Vols",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import differential_evolution
from scipy.integrate import quad

def heston_cf(u, S0, K, r, T, v0, kappa, theta, xi, rho):
    """
    Heston (1993) characteristic function under risk-neutral measure.
    Evaluated at complex argument u + 0.5j (Carr-Madan transform).
    """
    lam = np.sqrt(xi**2 * (u**2 + u*1j) + (kappa - 1j*rho*xi*u)**2)
    d   = (kappa - 1j*rho*xi*u - lam) / (kappa - 1j*rho*xi*u + lam)
    G   = (1 - d * np.exp(-lam*T)) / (1 - d)
    phi = (np.exp(1j*u*np.log(S0/K) + 1j*u*r*T
                  + v0/xi**2 * ((kappa - 1j*rho*xi*u - lam)*T - 2*np.log(G)))
           * np.exp(kappa*theta/xi**2 * ((kappa - 1j*rho*xi*u - lam)*T - 2*np.log(G))))
    return phi

def heston_call(S0, K, r, T, v0, kappa, theta, xi, rho):
    """Carr-Madan FFT pricing (simplified single-strike version)."""
    def integrand(u):
        phi = heston_cf(u - 0.5j, S0, K, r, T, v0, kappa, theta, xi, rho)
        return np.real(np.exp(-1j*u*np.log(K)) * phi / (u**2 + 0.25))
    I, _ = quad(integrand, 0, 500, limit=200)
    return np.exp(-r*T) / np.pi * I

def heston_implied_vol(S0, K, r, T, v0, kappa, theta, xi, rho):
    """Price Heston call and back out implied vol via bisection."""
    from scipy.optimize import brentq
    from scipy.stats import norm
    price = heston_call(S0, K, r, T, v0, kappa, theta, xi, rho)

    def bs_call(sigma):
        d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        return S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2) - price

    try:
        return brentq(bs_call, 1e-4, 5.0, xtol=1e-6)
    except ValueError:
        return np.nan

def calibrate_heston(S0, r, market_strikes, market_vols, market_T):
    """Calibrate (v0, kappa, theta, xi, rho) to market slice."""
    def objective(params):
        v0, kappa, theta, xi, rho = params
        if v0<=0 or kappa<=0 or theta<=0 or xi<=0 or abs(rho)>=1:
            return 1e10
        # Feller condition: 2*kappa*theta > xi^2
        if 2*kappa*theta < xi**2: return 1e10
        model_vols = [
            heston_implied_vol(S0, K, r, T, v0, kappa, theta, xi, rho)
            for K, T in zip(market_strikes, market_T)
        ]
        mv = np.array(model_vols)
        if np.any(np.isnan(mv)): return 1e10
        return np.sum((mv - np.array(market_vols))**2)

    bounds = [(0.01, 1.0), (0.1, 10.0), (0.01, 1.0), (0.01, 2.0), (-0.99, 0.0)]
    res = differential_evolution(objective, bounds, maxiter=100, seed=42, tol=1e-6)
    v0, kappa, theta, xi, rho = res.x
    return {"v0": v0, "kappa": kappa, "theta": theta, "xi": xi, "rho": rho,
            "rmse": np.sqrt(res.fun / len(market_strikes)) * 100}

# Quick demo with 3 strikes at T=0.5
S0 = 100.0; r = 0.05
strikes = [90.0, 100.0, 110.0]
mkt_vols= [0.22,  0.18,  0.19]
T_list  = [0.5,   0.5,   0.5]
params = calibrate_heston(S0, r, strikes, mkt_vols, T_list)
print(params)`,
    explanation:
      "The Heston model captures the implied vol smile through a mean-reverting stochastic variance process correlated with the stock price. Negative rho (typical for equities, ~-0.6 to -0.8) generates the left-skewed smile observed in practice. The Feller condition 2κθ > ξ² ensures variance stays positive; calibrating via differential evolution avoids local optima from gradient-based methods.",
  },
  {
    id: "pyfin-20260715-b1-sabr-implied-vol",
    language: "python",
    title: "SABR Model: Hagan's Implied Vol Approximation",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import brentq

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) SABR implied vol approximation.
    F     : forward price
    K     : strike
    T     : time to expiry
    alpha : initial vol (ATM vol level)
    beta  : CEV exponent (0=normal, 1=lognormal)
    rho   : correlation between F and vol
    nu    : vol-of-vol
    """
    if abs(F - K) < 1e-8:  # ATM formula
        FK_mid = F**(1 - beta)
        z_term  = nu / alpha * FK_mid
        A       = alpha / FK_mid
        B1      = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**2
                       + rho*beta*nu*alpha / (4*FK_mid)
                       + (2 - 3*rho**2)*nu**2/24) * T
        return A * B1

    logFK  = np.log(F / K)
    FK_mid = (F * K)**((1 - beta) / 2)

    z   = nu / alpha * FK_mid * logFK
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    A = alpha / (FK_mid * (1
        + (1-beta)**2/24 * logFK**2
        + (1-beta)**4/1920 * logFK**4))

    B = z / chi if abs(chi) > 1e-8 else 1.0

    C = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**2
             + rho*beta*nu*alpha / (4 * FK_mid)
             + (2 - 3*rho**2) * nu**2 / 24) * T

    return A * B * C

def calibrate_sabr_beta1(F: float, T: float,
                          strikes: np.ndarray,
                          market_vols: np.ndarray) -> dict:
    """Calibrate SABR with beta=1 (lognormal backbone)."""
    from scipy.optimize import minimize
    beta = 1.0

    def objective(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        fitted = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                           for K in strikes])
        return np.sum((fitted - market_vols)**2)

    # Initial guess from ATM vol
    atm_idx = np.argmin(np.abs(strikes - F))
    x0 = [market_vols[atm_idx], -0.3, 0.4]
    res = minimize(objective, x0, method='Nelder-Mead',
                   options={'maxiter': 10000, 'xatol': 1e-9})
    alpha, rho, nu = res.x
    fitted = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
    return {"alpha": alpha, "beta": beta, "rho": rho, "nu": nu,
            "rmse_bps": np.sqrt(np.mean((fitted - market_vols)**2)) * 1e4}

F  = 100.0; T = 1.0
ks = np.array([85, 90, 95, 100, 105, 110, 115], dtype=float)
mv = np.array([0.24, 0.22, 0.20, 0.18, 0.185, 0.19, 0.195])
params = calibrate_sabr_beta1(F, T, ks, mv)
print(params)
# Verify ATM
print(f"ATM SABR vol: {sabr_vol(F, F, T, params['alpha'], 1.0, params['rho'], params['nu']):.4f}")`,
    explanation:
      "SABR is the dominant model for interest rate options (caps/floors, swaptions) because its analytic approximation for implied vol is fast enough for real-time use and captures both the backbone (beta) and the smile (rho, nu) in interpretable parameters. Negative rho generates the downward skew characteristic of equity options; beta=0.5 is common for interest rates to interpolate between normal and lognormal dynamics.",
  },
  {
    id: "pyfin-20260715-b1-control-variate-mc",
    language: "python",
    title: "Control Variate Monte Carlo (Geometric Asian as CV for Arithmetic)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def geometric_asian_exact(S0, K, r, sigma, T, n):
    """Closed-form for geometric average call (Kemna-Vorst 1990)."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    mu_g    = (r - 0.5*sigma**2) * (n + 1) * T / (2*n)
    F_g     = S0 * np.exp(mu_g + 0.5*sigma_g**2 * T)
    d1 = (np.log(F_g/K) + 0.5*sigma_g**2*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)
    return np.exp(-r*T) * (F_g*norm.cdf(d1) - K*norm.cdf(d2))

def arithmetic_asian_with_cv(S0, K, r, sigma, T, n_steps=52, n_paths=50_000,
                               seed=42) -> dict:
    """
    Price arithmetic Asian call using geometric Asian as control variate.
    Estimator: Y_CV = Y_arithmetic - c*(Y_geometric - E[Y_geometric])
    Optimal c = Cov(Y_a, Y_g) / Var(Y_g) estimated from pilot.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)

    # Antithetic + control variate
    Z = rng.standard_normal((n_steps, n_paths // 2))
    Z = np.concatenate([Z, -Z], axis=1)   # antithetic pairs

    log_incr = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    logS     = np.log(S0) + np.cumsum(log_incr, axis=0)
    S        = np.exp(logS)

    arith_avg = S.mean(axis=0)
    geo_avg   = np.exp(logS.mean(axis=0))  # geometric average in log space

    arith_pv = disc * np.maximum(arith_avg - K, 0.0)
    geo_pv   = disc * np.maximum(geo_avg   - K, 0.0)

    # Optimal control variate coefficient
    cov = np.cov(arith_pv, geo_pv)
    c   = cov[0, 1] / cov[1, 1]

    geo_exact = geometric_asian_exact(S0, K, r, sigma, T, n_steps)
    cv_payoff = arith_pv - c * (geo_pv - geo_exact)

    price = cv_payoff.mean()
    se    = cv_payoff.std() / np.sqrt(len(cv_payoff))
    var_reduction = cov[1, 1] / cov[0, 0] * c**2  # approximate

    return {"price": round(price, 4), "se": round(se, 4),
            "var_reduction": round(1 - se**2 / arith_pv.std()**2 * len(arith_pv), 3)}

result = arithmetic_asian_with_cv(S0=100, K=100, r=0.05, sigma=0.2, T=1.0)
print(result)`,
    explanation:
      "Control variates work by subtracting a correlated zero-mean term from the estimator — the geometric Asian (correlation ~0.98 with arithmetic) reduces variance by a factor of ~50, so 1,000 paths with CV outperforms 50,000 naive paths. Combining antithetic variates and CV is multiplicative: together they can reduce standard error by 100× vs. crude MC.",
  },
  {
    id: "pyfin-20260715-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_exact(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def importance_sampling_call(S0: float, K: float, r: float, sigma: float,
                              T: float, n_paths: int = 100_000) -> dict:
    """
    Price a deep OTM call via importance sampling.
    Shift the sampling distribution to centre on the exercise region.
    Under IS: Z ~ N(mu*, 1) where mu* = log(K/S0) / (sigma*sqrt(T)) - (r/sigma)*sqrt(T)
    Likelihood ratio = exp(-mu*Z + 0.5*mu*^2) corrects for the distribution shift.
    """
    # Log-return needed to end above K
    mu_star = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / (sigma * np.sqrt(T))

    rng = np.random.default_rng(42)
    Z   = rng.standard_normal(n_paths) + mu_star  # shift N(0,1) to N(mu*, 1)

    # Stock terminal value under the IS measure
    S_T = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)

    # Likelihood ratio (Radon-Nikodym derivative): correct for distribution shift
    lr  = np.exp(-mu_star * (Z - mu_star) - 0.5*mu_star**2)  # exp(-mu*Z+0.5*mu^2) rearranged

    payoff  = np.maximum(S_T - K, 0.0) * np.exp(-r*T)
    weights = payoff * lr   # importance-sampled estimator

    price = weights.mean()
    se    = weights.std() / np.sqrt(n_paths)
    exact = bs_call_exact(S0, K, r, sigma, T)

    # Variance reduction: naive MC would have near-zero non-zero payoffs
    naive_std  = np.maximum(S_T - K, 0.0).std() * np.exp(-r*T)  # inflated by IS
    return {"price": round(price, 6), "se_IS": round(se, 6),
            "exact": round(exact, 6), "error": round(price - exact, 6)}

# Deep OTM: S0=100, K=200, 1 year — naive MC needs millions of paths
result = importance_sampling_call(S0=100, K=200, r=0.05, sigma=0.3, T=2.0, n_paths=10_000)
print(result)
# Compare naive MC
rng = np.random.default_rng(42)
S_T = 100 * np.exp((0.05 - 0.5*0.3**2)*2 + 0.3*np.sqrt(2)*rng.standard_normal(10_000))
naive = np.exp(-0.05*2) * np.maximum(S_T - 200, 0.0).mean()
print(f"Naive MC: {naive:.6f}  (noisy for OTM)   IS: {result['price']:.6f}")`,
    explanation:
      "Importance sampling shifts the sampling measure toward the exercise region, dramatically increasing the fraction of paths that contribute non-zero payoffs. For a 2× OTM option, naive MC sees perhaps 0.1% of paths in-the-money; IS ensures ~50% of paths are sampled near the boundary, reducing variance by 100–1000×. The likelihood ratio (Radon-Nikodym derivative) restores unbiasedness.",
  },
  {
    id: "pyfin-20260715-b1-student-t-var",
    language: "python",
    title: "Parametric VaR and ES with Student-t Distribution",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import t as tdist, norm
from scipy.optimize import minimize

def fit_student_t(returns: np.ndarray) -> dict:
    """MLE fit of Student-t distribution to returns (estimate nu, mu, sigma)."""
    def neg_loglik(params):
        mu, sigma, nu = params
        if sigma <= 0 or nu <= 2: return 1e10
        return -np.sum(tdist.logpdf(returns, df=nu, loc=mu, scale=sigma))

    mu0, sigma0, nu0 = returns.mean(), returns.std(), 5.0
    res = minimize(neg_loglik, [mu0, sigma0, nu0], method='Nelder-Mead')
    mu, sigma, nu = res.x
    return {"mu": mu, "sigma": sigma, "nu": nu}

def parametric_var(returns: np.ndarray, confidence: float = 0.99,
                   horizon: int = 1) -> dict:
    """
    Parametric VaR under normal and Student-t assumptions.
    Annualise to multi-day horizon: VaR(h) = VaR(1) * sqrt(h) (normal only).
    """
    mu, sigma = returns.mean(), returns.std()
    params    = fit_student_t(returns)

    # Normal VaR
    z_normal = norm.ppf(1 - confidence)
    var_n     = -(mu + z_normal * sigma) * np.sqrt(horizon)

    # Student-t VaR (fatter tails → larger VaR)
    nu     = params["nu"]
    sig_t  = params["sigma"]
    mu_t   = params["mu"]
    z_t    = tdist.ppf(1 - confidence, df=nu)
    var_t  = -(mu_t + z_t * sig_t) * np.sqrt(horizon)

    # Expected Shortfall (ES) = E[loss | loss > VaR]
    # Normal ES: mu - sigma * phi(z) / (1 - confidence)
    phi_z  = norm.pdf(z_normal)
    es_n   = -(mu - sigma * phi_z / (1 - confidence)) * np.sqrt(horizon)

    # Student-t ES
    t_pdf_z = tdist.pdf(z_t, df=nu)
    es_t    = -(mu_t - sig_t * (nu + z_t**2) / (nu - 1) * t_pdf_z / (1 - confidence)) * np.sqrt(horizon)

    return {
        "var_normal_99": round(var_n, 4),
        "var_t_99":      round(var_t, 4),
        "es_normal_99":  round(es_n, 4),
        "es_t_99":       round(es_t, 4),
        "t_dof":         round(nu, 2),
        "t_ratio":       round(var_t / var_n, 3),  # how much fatter tails add
    }

rng     = np.random.default_rng(42)
returns = tdist.rvs(df=4, loc=0.0005, scale=0.01, size=1000, random_state=rng)
print(parametric_var(returns, confidence=0.99, horizon=10))`,
    explanation:
      "The Student-t distribution has fatter tails than the normal, producing a larger VaR at the same confidence level — the ratio var_t/var_n depends on the tail index nu: for nu=4 (common for daily equity returns), 99% t-VaR exceeds normal VaR by 20–30%. Basel III requires banks to use ES (Expected Shortfall) at 97.5% rather than VaR at 99%, because ES captures the severity beyond the threshold.",
  },
  {
    id: "pyfin-20260715-b1-pot-evt-tail",
    language: "python",
    title: "Peaks-Over-Threshold (POT) EVT Tail Risk Estimation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def pot_var_es(losses: np.ndarray, threshold_quantile: float = 0.90,
               confidence: float = 0.99) -> dict:
    """
    Peaks-Over-Threshold (McNeil & Frey 2000):
    1. Set threshold u at threshold_quantile (e.g., 90th percentile loss).
    2. Fit Generalized Pareto Distribution to exceedances (losses > u).
    3. Extrapolate to high quantile VaR and ES.
    GPD: F(x) = 1 - (1 + xi*x/beta)^(-1/xi) for x > 0.
    xi > 0 (heavy tail), xi < 0 (bounded tail), xi = 0 (exponential).
    """
    u         = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u
    n, nu     = len(losses), len(exceedances)

    if nu < 10:
        raise ValueError(f"Too few exceedances ({nu}) for POT fit")

    # MLE fit of GPD to exceedances
    xi_hat, loc_hat, beta_hat = genpareto.fit(exceedances, floc=0)

    # POT VaR at confidence level p > threshold_quantile
    p = confidence
    pq = threshold_quantile

    # VaR: u + (beta/xi) * ((n/nu * (1-p))^(-xi) - 1) for xi != 0
    if abs(xi_hat) > 1e-6:
        var_excess = (beta_hat / xi_hat) * ((n / nu * (1 - p)) ** (-xi_hat) - 1)
    else:  # exponential tail (xi=0)
        var_excess = beta_hat * np.log(n / nu * (1 - p))
    var_pot = u + var_excess

    # Expected Shortfall: VaR + (beta + xi*(VaR-u)) / (1 - xi) for xi < 1
    if xi_hat < 1:
        es_pot = (var_pot + beta_hat - xi_hat * u) / (1 - xi_hat)
    else:
        es_pot = np.inf

    # Historical comparison
    var_hist = np.quantile(losses, confidence)

    return {
        "threshold_u":    round(u, 4),
        "n_exceedances":  nu,
        "xi_shape":       round(xi_hat, 4),
        "beta_scale":     round(beta_hat, 4),
        "VaR_POT":        round(var_pot, 4),
        "ES_POT":         round(es_pot, 4),
        "VaR_historical": round(var_hist, 4),
    }

rng = np.random.default_rng(42)
# Fat-tailed losses (Student-t with nu=3)
from scipy.stats import t as tdist
losses = -tdist.rvs(df=3, loc=-0.001, scale=0.015, size=2000, random_state=rng)
losses = np.maximum(losses, 0)  # keep only positive losses
print(pot_var_es(losses, threshold_quantile=0.90, confidence=0.99))`,
    explanation:
      "POT fits the GPD only to the tail (exceedances above u), avoiding the assumption that the full loss distribution is Gaussian or t-distributed. The shape parameter xi directly characterises tail heaviness: equities typically show xi ≈ 0.2–0.4, meaning VaR grows as a power law rather than exponentially. POT-ES is required for Basel IV's 'Expected Shortfall with Stress' framework.",
  },
  {
    id: "pyfin-20260715-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Joint Default Simulation (CDO Pricing)",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_defaults(hazard_rates: np.ndarray,
                              correlation_rho: float,
                              T: float,
                              n_paths: int = 100_000,
                              seed: int = 42) -> dict:
    """
    One-factor Gaussian copula model (Li 2000) for joint default simulation.
    Systemic factor M ~ N(0,1); idiosyncratic factors Z_i ~ N(0,1) independent.
    Asset value: X_i = rho*M + sqrt(1-rho^2)*Z_i
    Default if X_i < Phi^{-1}(PD_i) where PD_i = 1 - exp(-h_i * T).

    Used for CDO tranche pricing and correlation trading.
    """
    n     = len(hazard_rates)
    pds   = 1 - np.exp(-hazard_rates * T)          # marginal PDs
    thresholds = norm.ppf(pds)                      # default thresholds

    rng   = np.random.default_rng(seed)
    M     = rng.standard_normal(n_paths)            # systemic factor
    Z     = rng.standard_normal((n_paths, n))       # idiosyncratic

    # Asset values for each entity across all paths
    X = np.sqrt(1 - correlation_rho**2) * Z + correlation_rho * M[:, None]

    # Default indicator: 1 if X_i < threshold_i
    defaults = (X < thresholds[None, :])  # shape (n_paths, n)
    n_defaults = defaults.sum(axis=1)     # losses per path

    # Loss distribution
    loss_pct = n_defaults / n             # fraction of names defaulting

    # Tranche analysis: senior tranche [0.6, 1.0], mezzanine [0.3, 0.6], equity [0, 0.3]
    def tranche_loss(lp, attach, detach):
        return np.maximum(0, np.minimum(lp - attach, detach - attach)) / (detach - attach)

    eq_loss  = tranche_loss(loss_pct, 0.00, 0.30).mean()
    mez_loss = tranche_loss(loss_pct, 0.30, 0.60).mean()
    sen_loss = tranche_loss(loss_pct, 0.60, 1.00).mean()

    return {
        "expected_loss":    round(loss_pct.mean(), 4),
        "loss_std":         round(loss_pct.std(), 4),
        "p99_loss":         round(np.percentile(loss_pct, 99), 4),
        "equity_loss":      round(eq_loss, 4),
        "mezzanine_loss":   round(mez_loss, 4),
        "senior_loss":      round(sen_loss, 4),
    }

# 10 names, 200 bps hazard rate, 50% correlation, 5Y
h = np.full(10, 0.020)
result = gaussian_copula_defaults(h, correlation_rho=0.5, T=5.0)
print(result)`,
    explanation:
      "The one-factor Gaussian copula links marginal default probabilities through a common systemic factor M with correlation rho. High correlation (rho > 0.7) flattens the loss distribution — equity tranches become less risky (fewer scattered defaults) but senior tranches become riskier (crashes hit all names simultaneously). The 2008 crisis revealed that correlation spiked from 0.3 to 0.9+, catastrophically mispricing CDO senior tranches.",
  },
  {
    id: "pyfin-20260715-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Liquidation Trajectory",
    tag: "execution",
    code: `import numpy as np

def almgren_chriss_trajectory(X0: float, T: float, N: int,
                               sigma: float, eta: float,
                               gamma: float, lam: float) -> dict:
    """
    Almgren-Chriss (2000) optimal liquidation:
    Minimise: Expected Cost + lambda * Variance of Cost
    eta   : temporary market impact coefficient
    gamma : permanent market impact coefficient
    sigma : return volatility
    lam   : risk-aversion parameter (higher = faster liquidation)

    Optimal trajectory: x_j = X0 * sinh(kappa*(T-t_j)) / sinh(kappa*T)
    where kappa = sqrt(lam * sigma^2 / eta).
    """
    tau    = T / N   # time interval between trades
    kappa  = np.sqrt(lam * sigma**2 / eta)

    # Time grid
    t      = np.linspace(0, T, N + 1)

    # Optimal remaining inventory at each time step
    x_opt  = X0 * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)

    # Trading rates (shares per unit time)
    dx_opt = -np.diff(x_opt)   # shares sold at each interval (positive)

    # Expected cost components
    # Temporary impact cost: sum(eta * (dx/tau)^2 * tau)
    temp_impact = np.sum(eta * (dx_opt / tau)**2 * tau)

    # Permanent impact cost: 0.5 * gamma * X0^2 (independent of strategy)
    perm_impact = 0.5 * gamma * X0**2

    # Market risk (price variance from holding inventory)
    variance = sigma**2 * tau * np.sum(x_opt[:-1]**2)

    # VWAP shortfall approximation
    naive_twap = X0 / T   # uniform liquidation rate
    naive_cost = eta * naive_twap**2 * T
    savings    = naive_cost - temp_impact

    return {
        "trajectory":   np.round(x_opt, 2).tolist(),
        "trade_schedule": np.round(dx_opt, 2).tolist(),
        "kappa":        round(kappa, 4),
        "temp_impact":  round(temp_impact, 2),
        "perm_impact":  round(perm_impact, 2),
        "variance":     round(variance, 4),
        "savings_vs_twap": round(savings, 2),
    }

# Liquidate 100k shares over 1 day (T=1), 10 intervals
result = almgren_chriss_trajectory(
    X0=100_000, T=1.0, N=10,
    sigma=0.02,   # 2% daily vol
    eta=0.1e-5,   # temporary impact
    gamma=0.5e-7, # permanent impact
    lam=1e-5,     # moderate risk aversion
)
print("Trade schedule:", result["trade_schedule"])
print("Temp impact cost:", result["temp_impact"])`,
    explanation:
      "Almgren-Chriss trades off market impact cost (which favours slow trading to reduce rate-squared impact) against timing risk (which favours fast trading to reduce price variance). The optimal kappa parameter scales how quickly the liquidation front-loads: high risk aversion (large lam) → small kappa → hyperbolic trajectory that dumps most shares early.",
  },
  {
    id: "pyfin-20260715-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion with Fractional Sizing and Drawdown Constraint",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_continuous(mu: float, sigma: float, r: float = 0.0) -> dict:
    """
    Continuous Kelly fraction: f* = (mu - r) / sigma^2
    (excess return over variance).
    For a log-normal asset: f* maximises E[log(1 + f*r_t)].
    """
    f_star = (mu - r) / sigma**2
    # Expected log-return at Kelly: (mu-r)^2 / (2*sigma^2)
    g_star = (mu - r)**2 / (2 * sigma**2)
    # Variance of log-return at Kelly: (mu-r)^2 / sigma^2
    var_g  = (mu - r)**2 / sigma**2
    # Max drawdown probability at Kelly: ~exp(-2*g_star/var_g) = e^(-1) ≈ 0.37
    ruin_prob = np.exp(-2 * g_star / var_g)

    return {
        "full_kelly_f":   round(f_star, 4),
        "half_kelly_f":   round(f_star / 2, 4),
        "expected_growth":round(g_star, 6),
        "ruin_prob_50pct":round(ruin_prob, 4),  # prob of 50% drawdown
    }

def kelly_discrete_binomial(p: float, b: float, q: float = None) -> dict:
    """
    Discrete Kelly for binary bet: win b with prob p, lose 1 with prob q=1-p.
    f* = p - q/b = p/b - (1-p)/b  (Breiman 1960).
    Maximises E[log(wealth)].
    """
    if q is None: q = 1 - p
    f_star = p - q / b
    if f_star <= 0:
        return {"kelly_f": 0, "positive_edge": False}
    g_star = p * np.log(1 + b*f_star) + q * np.log(1 - f_star)
    return {"kelly_f": round(f_star, 4), "half_kelly": round(f_star/2, 4),
            "log_growth": round(g_star, 6), "positive_edge": True}

def fractional_kelly_frontier(mu: float, sigma: float, r: float,
                               fracs: np.ndarray = None) -> list:
    """Compute growth-risk frontier for different Kelly fractions."""
    if fracs is None:
        fracs = np.linspace(0, 2, 41)
    f_star = (mu - r) / sigma**2
    results = []
    for frac in fracs:
        f = frac * f_star
        g = f * (mu - r) - 0.5 * f**2 * sigma**2  # expected log-return
        v = f**2 * sigma**2                          # variance of log-return
        results.append({"frac_kelly": round(frac, 2), "f": round(f, 4),
                        "growth": round(g, 6), "vol": round(np.sqrt(v), 4)})
    return results

# Example: equity-like asset
params = kelly_continuous(mu=0.10, sigma=0.20, r=0.05)
print("Continuous Kelly:", params)

# Coin-flip bet with edge
bet = kelly_discrete_binomial(p=0.55, b=1.0)
print("Discrete Kelly (55/45 flip):", bet)`,
    explanation:
      "The Kelly criterion maximises the long-run compound growth rate, but the full Kelly fraction produces large drawdowns (~50% probability of a 50% drawdown). In practice, portfolio managers use 'half-Kelly' or a drawdown-constrained fraction: f = f* × min(1, target_drawdown / expected_drawdown). The continuous Kelly formula (μ-r)/σ² is the Merton portfolio proportion from optimal growth theory.",
  },
  {
    id: "pyfin-20260715-b1-fama-macbeth",
    language: "python",
    title: "Fama-MacBeth Two-Pass Cross-Sectional Regression",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd
from scipy.stats import t as tdist

def fama_macbeth(returns: pd.DataFrame,
                 betas: pd.DataFrame) -> dict:
    """
    Fama-MacBeth (1973) two-pass procedure:
    Pass 1: Time-series OLS to estimate betas (pre-computed here).
    Pass 2: Cross-sectional regression at each t:
              r_{i,t} = gamma_0_t + gamma_1_t * beta_i + eps_{i,t}
    The gammas are averaged across t; t-stats use time-series s.e. of gamma.

    returns : T x N DataFrame (time x asset)
    betas   : N x K DataFrame (asset x factor betas from pass 1)
    """
    T, N = returns.shape
    K    = betas.shape[1]

    # Ensure alignment
    common = returns.columns.intersection(betas.index)
    r = returns[common].values         # T x N
    B = betas.loc[common].values       # N x K
    B_aug = np.column_stack([np.ones(len(common)), B])  # include intercept

    # Pass 2: cross-sectional regression at each t
    gammas = np.zeros((T, K + 1))  # +1 for intercept
    for t in range(T):
        r_t = r[t]                   # N-vector of cross-sectional returns
        # OLS: gamma = (B'B)^{-1} B'r
        try:
            gammas[t] = np.linalg.lstsq(B_aug, r_t, rcond=None)[0]
        except np.linalg.LinAlgError:
            gammas[t] = np.nan

    # Average gammas and t-stats using Fama-MacBeth standard errors
    gamma_mean = np.nanmean(gammas, axis=0)
    gamma_se   = np.nanstd(gammas, axis=0, ddof=1) / np.sqrt(T)
    t_stats    = gamma_mean / gamma_se
    p_vals     = 2 * tdist.sf(np.abs(t_stats), df=T - 1)

    cols = ["alpha"] + betas.columns.tolist()
    return {c: {"gamma": round(gamma_mean[i], 6),
                "t_stat": round(t_stats[i], 3),
                "p_val": round(p_vals[i], 4)}
            for i, c in enumerate(cols)}

# Synthetic demo: 100 stocks, 5 years daily, market + size betas
rng = np.random.default_rng(42)
T, N = 252*5, 50
mkt   = rng.normal(0.0004, 0.01, T)
true_gamma_mkt = 0.0005   # risk premium for market beta

betas_mkt  = rng.uniform(0.5, 1.5, N)
betas_size = rng.uniform(-0.5, 0.5, N)

# Cross-sectional return structure
returns = pd.DataFrame(
    true_gamma_mkt * betas_mkt[None,:] + mkt[:,None] @ np.ones((1,N)) * 0.5
    + rng.normal(0, 0.015, (T, N)),
    columns=[f"S{i}" for i in range(N)]
)
betas_df = pd.DataFrame(
    {"market": betas_mkt, "size": betas_size},
    index=[f"S{i}" for i in range(N)]
)
result = fama_macbeth(returns, betas_df)
print(result)`,
    explanation:
      "Fama-MacBeth sidesteps the Seemingly Unrelated Regression problem by running one cross-sectional regression per time period, then averaging the gammas. The time-series variation in gamma estimates provides valid standard errors robust to cross-sectional residual correlation — unlike pooled OLS which underestimates standard errors when N asset residuals are correlated (as they always are).",
  },
  {
    id: "pyfin-20260715-b1-hjm-simulation",
    language: "python",
    title: "Heath-Jarrow-Morton Forward Rate Simulation",
    tag: "rates",
    code: `import numpy as np

def hjm_simulate(f0: np.ndarray, tenors: np.ndarray,
                 sigma_vols: np.ndarray, T: float, N_t: int,
                 n_paths: int = 5000, seed: int = 42) -> dict:
    """
    Heath-Jarrow-Morton (1992) one-factor forward rate model.
    df(t, T_i) = alpha(t, T_i) dt + sigma_i dW_t
    HJM drift restriction (no-arbitrage):
      alpha(t, T_i) = sigma_i * integral_0^{T_i} sigma(t,s) ds
    With flat vol sigma_i = sigma (constant across tenors):
      alpha(t, T_i) = sigma^2 * T_i  (Ho-Lee as special case)

    f0       : initial forward rate curve (one per tenor)
    tenors   : tenor grid in years
    sigma_vols: per-tenor instantaneous vol
    """
    dt   = T / N_t
    n_t  = N_t
    n_T  = len(tenors)
    dT   = tenors[1] - tenors[0]

    rng  = np.random.default_rng(seed)
    dW   = rng.standard_normal((n_paths, n_t)) * np.sqrt(dt)

    # Initialise forward rate grid: shape (n_paths, n_T)
    f = np.tile(f0, (n_paths, 1))

    path_shortrates = []  # record short rate at each step

    for k in range(n_t):
        # HJM drift: sigma_i * integral_0^{T_i} sigma ds = sigma_i * sum_j sigma_j * dT
        drift = np.zeros(n_T)
        for i in range(n_T):
            # integral of sigma from 0 to T_i (piecewise)
            integral = np.sum(sigma_vols[:i+1]) * dT
            drift[i] = sigma_vols[i] * integral * dt

        dW_k = dW[:, k]
        f   += drift[None, :] + sigma_vols[None, :] * dW_k[:, None]

        path_shortrates.append(f[:, 0].copy())  # short rate = f(t,0)

    shortrate_paths = np.array(path_shortrates)  # (n_t, n_paths)

    # Zero-coupon bond prices via path-wise integration of short rates
    avg_r = shortrate_paths.mean(axis=0)  # rough approximation
    P_T   = np.exp(-avg_r * T)

    return {
        "mean_shortrate": float(shortrate_paths.mean()),
        "std_shortrate":  float(shortrate_paths.std()),
        "mean_zcb_price": float(P_T.mean()),
        "terminal_fwd_curve_mean": f.mean(axis=0).round(4).tolist(),
    }

# Example: upward-sloping forward curve
tenors  = np.linspace(0.25, 10, 40)
f0      = 0.04 + 0.002 * tenors   # 4% to 5.96%
sigma_v = np.full(len(tenors), 0.01)  # flat 1% vol

result = hjm_simulate(f0, tenors, sigma_v, T=1.0, N_t=252, n_paths=5000)
print(result)`,
    explanation:
      "HJM models the entire forward rate curve as a stochastic process, with the no-arbitrage drift determined by the vol structure — no calibration to a specific model is needed as long as the vol function sigma(t,T) is specified. The Ho-Lee model is HJM with constant sigma; the Hull-White model is HJM with sigma(t,T) = sigma*exp(-kappa*(T-t)). HJM's generality makes it the unifying framework for all term-structure models.",
  },
  {
    id: "pyfin-20260715-b1-hull-white-calibration",
    language: "python",
    title: "Hull-White Short Rate Model: Calibration and Simulation",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def hull_white_zcb(r0: float, theta_t: callable, kappa: float,
                   sigma: float, T: float) -> float:
    """
    Hull-White (extended Vasicek) zero-coupon bond price:
    P(0,T) = exp(A(T) - B(T)*r0)
    B(T) = (1 - exp(-kappa*T)) / kappa
    A(T) fitted to match initial term structure (via theta_t).
    Simplified: use market P(0,T) directly for calibration.
    """
    B = (1 - np.exp(-kappa * T)) / kappa
    # A(T) from the market curve (using A = log P_mkt - B*f(0,T))
    # Here we approximate using the initial short rate r0
    A = -0.5 * sigma**2 / kappa**2 * (T - B - 0.5 * kappa * B**2)
    return np.exp(A - B * r0)

def simulate_hull_white(r0: float, kappa: float, theta: float, sigma: float,
                         T: float, N: int, n_paths: int, seed: int = 42):
    """
    Euler-Maruyama simulation of Hull-White:
    dr_t = (theta - kappa*r_t) dt + sigma * dW_t
    theta absorbs the market term structure fit (constant theta approximation here).
    """
    dt  = T / N
    rng = np.random.default_rng(seed)
    r   = np.full(n_paths, r0)
    paths = [r.copy()]
    for _ in range(N):
        r = r + (theta - kappa * r) * dt + sigma * np.sqrt(dt) * rng.standard_normal(n_paths)
        paths.append(r.copy())
    return np.array(paths)  # (N+1, n_paths)

def calibrate_hull_white(maturities: np.ndarray, market_vols: np.ndarray,
                          r0: float = 0.05) -> dict:
    """
    Calibrate (kappa, sigma) to market caplet/swaption vols.
    Hull-White caplet vol approximation:
      sigma_cap(T) = sigma * sqrt((1 - exp(-2*kappa*T)) / (2*kappa)) / (kappa*T)
    """
    def objective(params):
        kappa, sigma = params
        if kappa <= 0 or sigma <= 0: return 1e10
        model_vols = [sigma / kappa * np.sqrt((1 - np.exp(-2*kappa*T)) / (2*kappa)) / T
                      for T in maturities]
        return np.sum((np.array(model_vols) - market_vols)**2)

    res = minimize(objective, [0.1, 0.01], method='Nelder-Mead')
    kappa, sigma = res.x
    return {"kappa": round(kappa, 4), "sigma": round(sigma, 6),
            "mean_reversion_half_life_yr": round(np.log(2)/kappa, 2)}

# Example: calibrate to 5 ATM swaption vols
maturities  = np.array([1, 2, 3, 5, 7], dtype=float)
market_vols = np.array([0.01, 0.012, 0.013, 0.014, 0.015])  # normal vol
params = calibrate_hull_white(maturities, market_vols)
print("HW params:", params)
paths = simulate_hull_white(r0=0.05, kappa=params["kappa"],
                             theta=0.05*params["kappa"], sigma=params["sigma"],
                             T=5.0, N=252*5, n_paths=1000)
print(f"Mean terminal rate: {paths[-1].mean()*100:.2f}%")`,
    explanation:
      "Hull-White is the workhorse model for interest rate exotics: it is tractable (affine), has analytic bond and swaption prices, and fits the initial term structure exactly through the time-varying mean-reversion level theta(t). The kappa parameter controls the half-life of rate perturbations; typical calibration yields kappa ≈ 0.05–0.2 (5–14 year half-life), sigma ≈ 0.01–0.02 (100–200 bps/year normal vol).",
  },
  {
    id: "pyfin-20260715-b1-vanna-volga-fx",
    language: "python",
    title: "Vanna-Volga FX Option Pricing (Market Smile Adjustment)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_price(S, K, r_d, r_f, sigma, T, is_call=True):
    """Black-Scholes-Garman-Kohlhagen for FX options."""
    d1 = (np.log(S/K) + (r_d - r_f + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    if is_call:
        return (S*np.exp(-r_f*T)*norm.cdf(d1) - K*np.exp(-r_d*T)*norm.cdf(d2))
    return (K*np.exp(-r_d*T)*norm.cdf(-d2) - S*np.exp(-r_f*T)*norm.cdf(-d1))

def bs_greeks(S, K, r_d, r_f, sigma, T):
    """Vega, vanna (d^2V/dS dsigma), and volga (d^2V/dsigma^2)."""
    d1  = (np.log(S/K) + (r_d - r_f + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2  = d1 - sigma*np.sqrt(T)
    phi = norm.pdf(d1)
    sqT = np.sqrt(T)
    vega  = S * np.exp(-r_f*T) * phi * sqT
    vanna = -np.exp(-r_f*T) * phi * d2 / sigma      # dVega/dS
    volga = vega * d1 * d2 / sigma                   # dVega/dsigma
    return vega, vanna, volga

def vanna_volga_price(S, K, r_d, r_f, T,
                      sigma_atm, sigma_rr, sigma_bf,
                      is_call=True) -> dict:
    """
    Vanna-Volga (Castagna & Mercurio 2007) smile-consistent FX pricing.
    Three market instruments: ATM straddle, 25D risk reversal, 25D butterfly.
    sigma_atm: ATM vol
    sigma_rr : 25D risk reversal (call25D - put25D)
    sigma_bf : 25D butterfly ((call25D + put25D)/2 - ATM)
    """
    # 25D strikes (approximation)
    d = 0.25  # delta
    K_c25 = S * np.exp((r_d - r_f)*T + sigma_atm*np.sqrt(T)*norm.ppf(d*np.exp(r_f*T)))
    K_p25 = S * np.exp((r_d - r_f)*T - sigma_atm*np.sqrt(T)*norm.ppf(d*np.exp(r_f*T)))
    K_atm  = S * np.exp((r_d - r_f + 0.5*sigma_atm**2)*T)

    sigma_c25 = sigma_atm + sigma_bf + 0.5*sigma_rr
    sigma_p25 = sigma_atm + sigma_bf - 0.5*sigma_rr

    # BS prices for the three instruments
    C_atm = bs_price(S, K_atm, r_d, r_f, sigma_atm, T, True)
    C_25  = bs_price(S, K_c25, r_d, r_f, sigma_c25, T, True)
    P_25  = bs_price(S, K_p25, r_d, r_f, sigma_p25, T, False)

    # Market vs BS prices (overhedge costs)
    C_atm_bs = bs_price(S, K_atm, r_d, r_f, sigma_atm, T, True)
    C_25_bs  = bs_price(S, K_c25, r_d, r_f, sigma_atm, T, True)
    P_25_bs  = bs_price(S, K_p25, r_d, r_f, sigma_atm, T, False)

    x1 = C_atm - C_atm_bs; x2 = C_25 - C_25_bs; x3 = P_25 - P_25_bs

    # Greeks for the target option and the three instruments at ATM vol
    vega_K,  vanna_K,  volga_K  = bs_greeks(S, K,    r_d, r_f, sigma_atm, T)
    vega_atm,vanna_atm,volga_atm= bs_greeks(S, K_atm,r_d, r_f, sigma_atm, T)
    vega_c25,vanna_c25,volga_c25= bs_greeks(S, K_c25,r_d, r_f, sigma_atm, T)
    vega_p25,vanna_p25,volga_p25= bs_greeks(S, K_p25,r_d, r_f, sigma_atm, T)

    # VV adjustment = sum of (target greek / instrument greek) * cost
    adj = (vanna_K/max(vanna_c25,1e-10)*x2
           + vanna_K/max(vanna_p25,1e-10)*x3
           + volga_K/max(volga_atm,1e-10)*x1)

    bs_base = bs_price(S, K, r_d, r_f, sigma_atm, T, is_call)
    vv_price = bs_base + adj

    return {"bs_price": round(bs_base, 4), "vv_price": round(vv_price, 4),
            "adjustment_bps": round(adj * 1e4, 2)}

result = vanna_volga_price(S=1.10, K=1.15, r_d=0.02, r_f=0.01, T=0.25,
                            sigma_atm=0.08, sigma_rr=0.02, sigma_bf=0.002,
                            is_call=True)
print(result)`,
    explanation:
      "Vanna-Volga replicates a target FX option's smile exposure using three market-quoted instruments (ATM, 25D RR, 25D BF) and adds the replication cost to the BS price. This makes the model consistent with the 'market smile' without requiring a full stochastic vol calibration — it's used by FX desks for quick smile adjustment on vanilla options quoted by brokers in delta/vol space.",
  },
  {
    id: "pyfin-20260715-b1-tips-linker-pricing",
    language: "python",
    title: "Inflation-Linked Bond (TIPS) Pricing and Real Yield",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import brentq

def tips_price(coupon_rate: float, maturity: float, real_yield: float,
               base_cpi: float, current_cpi: float,
               n_periods: int = None, freq: int = 2) -> dict:
    """
    US TIPS pricing:
    - Principal is indexed to CPI: index_ratio = current_CPI / base_CPI
    - Coupon payments = coupon_rate * index_ratio * face / freq
    - Redemption = max(index_ratio, 1.0) * face (deflation floor)

    real_yield: required real yield (inflation-adjusted)
    """
    face          = 1000.0
    if n_periods is None:
        n_periods = int(maturity * freq)
    ir = current_cpi / base_cpi         # index ratio
    adj_face      = face * ir           # inflation-adjusted principal
    coupon        = coupon_rate * adj_face / freq
    r             = real_yield / freq   # per-period real yield

    # PV of coupon stream
    ts   = np.arange(1, n_periods + 1)
    pvs  = coupon / (1 + r)**ts
    pv_coupons = pvs.sum()

    # PV of principal (with deflation floor: min(adj_face, face) redeemed)
    adj_principal = max(adj_face, face)  # deflation protection
    pv_principal  = adj_principal / (1 + r)**n_periods

    dirty_price = pv_coupons + pv_principal

    # Break-even inflation: solve for nominal YTM such that nominal bond
    # priced at dirty_price has same cash flows
    def pv_nominal(ytm_nominal):
        r_n = ytm_nominal / freq
        pv = sum(face * coupon_rate / freq / (1 + r_n)**t for t in ts)
        pv += face / (1 + r_n)**n_periods
        return pv

    try:
        ytm_nominal = brentq(lambda y: pv_nominal(y) - dirty_price, 0.001, 0.20)
        bei = ytm_nominal - real_yield  # break-even inflation rate
    except ValueError:
        ytm_nominal = bei = np.nan

    return {
        "index_ratio":    round(ir, 4),
        "adj_principal":  round(adj_face, 2),
        "dirty_price":    round(dirty_price, 4),
        "real_yield":     round(real_yield, 4),
        "breakeven_infl": round(bei, 4) if not np.isnan(bei) else None,
        "pv_coupons":     round(pv_coupons, 4),
        "pv_principal":   round(pv_principal, 4),
    }

# 10-year TIPS: 0.5% real coupon, 2% real yield, 15% cumulative inflation
result = tips_price(coupon_rate=0.005, maturity=10.0, real_yield=0.02,
                     base_cpi=250.0, current_cpi=287.5)
print(result)`,
    explanation:
      "TIPS coupons and principal are indexed to CPI, so they pay a real (inflation-adjusted) return. The break-even inflation rate (nominal yield minus real TIPS yield) is the market's implied inflation forecast: if actual inflation exceeds BEI, TIPS outperform nominals. The deflation floor protects against negative cumulative CPI by guaranteeing par at maturity — a valuable embedded put option during deflationary periods.",
  },
  {
    id: "pyfin-20260715-b1-pca-yield-hedge",
    language: "python",
    title: "PCA Yield Curve Decomposition and Duration Hedge",
    tag: "rates",
    code: `import numpy as np
import pandas as pd
from sklearn.decomposition import PCA

def pca_yield_curve(yield_changes: np.ndarray, n_components: int = 3) -> dict:
    """
    Decompose yield curve changes into level, slope, curvature (first 3 PCs).
    yield_changes: T x N matrix (T time steps, N tenor points).
    Returns loadings, explained variance, and DV01 hedge ratios.
    """
    pca = PCA(n_components=n_components)
    pca.fit(yield_changes)

    loadings = pca.components_  # shape (n_components, N)
    scores   = pca.transform(yield_changes)  # shape (T, n_components)

    # Reconstruct approximate yield change using n_components
    recon    = pca.inverse_transform(scores)
    resid    = yield_changes - recon

    # Identify components: level (all same sign), slope (sign change once),
    # curvature (hump)
    var_exp  = pca.explained_variance_ratio_

    return {
        "explained_variance": np.round(var_exp, 4).tolist(),
        "cumulative_var":     float(var_exp.cumsum()[-1]),
        "loadings_shape":     loadings.shape,
        "pc1_range":          (float(loadings[0].min()), float(loadings[0].max())),
        "pc2_flip":           bool(loadings[1, 0] * loadings[1, -1] < 0),  # sign change
        "reconstruction_rmse":float(np.sqrt((resid**2).mean())),
    }

def pc_dv01_hedge(portfolio_dv01: np.ndarray, pca_loadings: np.ndarray,
                  tenor_dv01s: np.ndarray) -> dict:
    """
    Hedge a bond portfolio's PC exposure using tenor buckets.
    portfolio_dv01: DV01 per tenor bucket (N vector).
    pca_loadings  : PCA loadings matrix (K x N).
    tenor_dv01s   : DV01 of hedging instruments at each tenor.

    PC exposure: exp_k = sum_i portfolio_dv01_i * loading_ki
    Hedge: find hedge quantities h such that sum_i h_i * loading_ki * dv01_i = -exp_k
    """
    K, N = pca_loadings.shape
    pc_exposure = pca_loadings @ portfolio_dv01   # K-vector of PC exposures

    # Hedge using K instruments; solve K x K system
    hedge_matrix = pca_loadings[:, :K] * tenor_dv01s[:K][None, :]
    hedge_qty    = np.linalg.solve(hedge_matrix, -pc_exposure)

    return {"pc_exposures": np.round(pc_exposure, 2).tolist(),
            "hedge_quantities": np.round(hedge_qty, 2).tolist()}

# Synthetic: 5 years of daily 2Y,5Y,10Y,30Y yield changes
rng = np.random.default_rng(42)
T   = 1260  # 5 years daily
N   = 4     # tenor points
dy  = rng.multivariate_normal(
    mean=np.zeros(N),
    cov=np.array([[1,0.9,0.7,0.5],[0.9,1,0.85,0.65],
                  [0.7,0.85,1,0.8],[0.5,0.65,0.8,1]]) * 0.01**2,
    size=T
)
result = pca_yield_curve(dy)
print(result)`,
    explanation:
      "PCA of yield curve changes typically explains 90%+ of variance with just three components: PC1 (level — parallel shift), PC2 (slope — steepening/flattening), PC3 (curvature — butterfly). A portfolio with zero exposure to all three PCs is immune to 90% of yield curve moves. Hedging only duration (level) leaves slope and curvature unhedged — a bond ladder with a 2s10s barbell has near-zero level exposure but large curvature exposure.",
  },
  {
    id: "pyfin-20260715-b1-cva-mc",
    language: "python",
    title: "Credit Valuation Adjustment (CVA) via Monte Carlo",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm

def cva_interest_rate_swap(
    notional: float,
    fixed_rate: float,
    r0: float,
    kappa: float,
    theta: float,
    sigma_rate: float,
    hazard_rate: float,
    recovery: float,
    T: float,
    n_steps: int = 60,
    n_paths: int = 10_000,
    seed: int = 42,
) -> dict:
    """
    CVA = (1 - R) * integral_0^T lambda * exp(-lambda*t) * E[max(MtM_t, 0)] dt
    MtM of a receive-fixed swap = PV01 * (fixed_rate - current_swap_rate)

    Simulate the short rate r_t (Hull-White) to get the distribution of swap MTM
    at each time step, then integrate against the default probability density.
    """
    dt    = T / n_steps
    disc_hazard = np.exp(-hazard_rate * dt)  # survival prob per step
    rng   = np.random.default_rng(seed)

    # Simulate Hull-White short rates
    r_paths = np.zeros((n_steps + 1, n_paths))
    r_paths[0] = r0
    for t in range(n_steps):
        dr = (theta - kappa * r_paths[t]) * dt + sigma_rate * np.sqrt(dt) * rng.standard_normal(n_paths)
        r_paths[t+1] = r_paths[t] + dr

    cva  = 0.0
    prev_surv = 1.0

    for t in range(1, n_steps + 1):
        t_yr   = t * dt
        r_t    = r_paths[t]

        # Approximate swap MTM: simplified as PV01 * (fixed - r_t)
        # PV01 for remaining swap life (T - t)
        rem    = T - t_yr
        if rem <= 0: break
        pv01   = (1 - np.exp(-r_t * rem)) / r_t  # annuity approx
        mtm    = notional * pv01 * (fixed_rate - r_t)  # positive if rates fell

        # Expected Positive Exposure (EPE)
        epe    = np.maximum(mtm, 0.0).mean()

        # Default probability in this interval
        surv   = np.exp(-hazard_rate * t_yr)
        dp     = prev_surv - surv

        cva   += (1 - recovery) * dp * epe
        prev_surv = surv

    return {
        "CVA":         round(cva, 2),
        "CVA_bps":     round(cva / notional * 1e4, 2),
        "recovery":    recovery,
        "hazard_rate": hazard_rate,
    }

result = cva_interest_rate_swap(
    notional=1_000_000, fixed_rate=0.05, r0=0.05,
    kappa=0.1, theta=0.05, sigma_rate=0.01,
    hazard_rate=0.02, recovery=0.40, T=5.0
)
print(result)`,
    explanation:
      "CVA is the expected loss from counterparty default, weighted by the current positive mark-to-market (the amount owed to us). The simulation integrates Expected Positive Exposure (EPE) against the hazard rate density, so we only lose money when the counterparty defaults AND we are owed money. Basel III requires banks to hold capital against CVA volatility (CVA VaR) in addition to the CVA itself.",
  },
  {
    id: "pyfin-20260715-b1-garman-klass-vol",
    language: "python",
    title: "Realised Volatility Estimators: Parkinson, Garman-Klass, Rogers-Satchell",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def realised_vol_estimators(open_: np.ndarray, high: np.ndarray,
                             low: np.ndarray, close: np.ndarray,
                             freq: int = 252) -> dict:
    """
    Range-based realised vol estimators — more efficient than close-to-close
    because they use intraday price extremes.

    close-to-close: sigma^2 = (1/T) * sum(log(C_t/C_{t-1})^2)
    Parkinson (1980): uses (H-L) range — 5.2x more efficient
    Garman-Klass (1980): uses O,H,L,C — 7.4x more efficient
    Rogers-Satchell (1991): drift-adjusted; unbiased under trending prices
    """
    log_hl = np.log(high / low)
    log_co = np.log(close / open_)
    log_ho = np.log(high / open_)
    log_lo = np.log(low  / open_)
    log_cc = np.log(close[1:] / close[:-1])

    # Close-to-close (biased if drift != 0)
    sigma2_cc = np.mean(log_cc**2) * freq

    # Parkinson: 1/(4*ln2) * E[(ln H/L)^2]
    sigma2_pk = (1.0 / (4 * np.log(2))) * np.mean(log_hl**2) * freq

    # Garman-Klass: 0.5*E[(lnH/L)^2] - (2*ln2-1)*E[(lnC/O)^2]
    sigma2_gk = (0.5 * np.mean(log_hl**2) - (2*np.log(2) - 1) * np.mean(log_co**2)) * freq

    # Rogers-Satchell (drift-corrected)
    sigma2_rs = np.mean(log_ho*(log_ho - log_co) + log_lo*(log_lo - log_co)) * freq

    # Yang-Zhang (combines overnight gap + RS)
    log_oc = np.log(open_[1:] / close[:-1])  # overnight returns
    n = len(log_oc)
    k = 0.34 / (1.34 + (n+1)/(n-1))         # optimal weight
    sigma2_overnight = np.mean(log_oc**2) * freq
    sigma2_open_close= np.mean(log_co[1:]**2) * freq  # open-to-close
    sigma2_yz = sigma2_overnight + k * sigma2_open_close + (1-k) * sigma2_rs

    return {
        "close_close_ann": round(np.sqrt(sigma2_cc), 4),
        "parkinson_ann":   round(np.sqrt(max(sigma2_pk, 0)), 4),
        "garman_klass_ann":round(np.sqrt(max(sigma2_gk, 0)), 4),
        "rogers_satchell_ann": round(np.sqrt(max(sigma2_rs, 0)), 4),
        "yang_zhang_ann":  round(np.sqrt(max(sigma2_yz, 0)), 4),
    }

# Synthetic OHLC data
rng   = np.random.default_rng(42)
T     = 252
S0    = 100.0
ret   = rng.normal(0.0002, 0.012, T)
close = S0 * np.cumprod(1 + ret)
high  = close * np.exp(np.abs(rng.normal(0, 0.005, T)))
low   = close * np.exp(-np.abs(rng.normal(0, 0.005, T)))
open_ = close * np.exp(rng.normal(0, 0.003, T))

result = realised_vol_estimators(open_, high, low, close)
print(result)`,
    explanation:
      "Range-based estimators use the daily high-low range as an additional signal for volatility. The Parkinson estimator uses 4.8 fewer data points than close-to-close for the same accuracy; Garman-Klass is even more efficient by adding open-to-close returns. Yang-Zhang corrects for the overnight gap (a major source of bias when stocks open far from the prior close) and is the most robust for assets with active overnight markets.",
  },
];
