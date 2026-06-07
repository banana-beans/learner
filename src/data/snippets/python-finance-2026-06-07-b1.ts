import type { Snippet } from "./types";

export const pythonFinanceSnippets20260607B1: Snippet[] = [
  {
    id: "pyfin-20260607-b1-heston-calib",
    language: "python",
    tag: "finance",
    title: "Heston model calibration via differential evolution",
    code: `import numpy as np
from scipy.optimize import differential_evolution

def heston_call_mc(S, K, r, T, v0, kappa, theta, xi, rho,
                   paths=2000, steps=100, seed=42):
    """Euler-Maruyama MC for Heston call price (fast calibration proxy)."""
    rng = np.random.default_rng(seed)
    dt = T / steps
    sqdt = np.sqrt(dt)
    S_t = np.full(paths, float(S))
    v_t = np.full(paths, float(v0))
    for _ in range(steps):
        z1 = rng.standard_normal(paths)
        z2 = rng.standard_normal(paths)
        zv = z1
        zs = rho * z1 + np.sqrt(1 - rho**2) * z2
        vp = np.maximum(v_t, 0.0)
        v_t += kappa * (theta - vp) * dt + xi * np.sqrt(vp) * sqdt * zv
        S_t *= np.exp((r - 0.5 * vp) * dt + np.sqrt(vp) * sqdt * zs)
    return np.exp(-r * T) * np.mean(np.maximum(S_t - K, 0.0))

def calibrate_heston(market_prices, strikes, T, S, r):
    """
    Fit v0, kappa, theta, xi, rho to observed call prices.
    Differential evolution handles the non-convex Heston landscape.
    """
    def objective(params):
        v0, kappa, theta, xi, rho = params
        model = np.array([
            heston_call_mc(S, K, r, T, v0, kappa, theta, xi, rho)
            for K in strikes
        ])
        return np.sum((model - np.array(market_prices))**2)

    bounds = [(0.01, 1.0), (0.1, 15.0), (0.01, 1.0), (0.05, 3.0), (-0.99, 0.0)]
    result = differential_evolution(objective, bounds, seed=42,
                                    maxiter=100, tol=1e-4, workers=1)
    return dict(zip(["v0","kappa","theta","xi","rho"], result.x))`,
    explanation:
      "Differential evolution avoids local minima in Heston's non-convex loss surface by maintaining a population of candidate solutions. In practice, a characteristic-function-based pricer (Carr-Madan FFT) replaces the MC call for speed — the calibration structure is identical.",
  },
  {
    id: "pyfin-20260607-b1-sabr-calib",
    language: "python",
    tag: "finance",
    title: "SABR Hagan formula and smile calibration",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan et al. (2002) SABR lognormal implied vol approximation.
    F: forward; K: strike; beta: CEV exponent (0=normal, 1=lognormal).
    """
    if abs(F - K) < 1e-8:  # ATM
        FKb = F ** (1 - beta)
        return (alpha / FKb) * (1 + (
            (1-beta)**2/24 * alpha**2/FKb**2
            + rho*beta*nu*alpha/(4*FKb)
            + (2 - 3*rho**2)/24 * nu**2
        ) * T)
    logFK = np.log(F / K)
    FKmid = (F * K) ** ((1 - beta) / 2)
    z  = nu / alpha * FKmid * logFK
    xz = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A  = alpha / (FKmid * (
        1 + (1-beta)**2/24 * logFK**2
          + (1-beta)**4/1920 * logFK**4
    ))
    B = z / xz if abs(xz) > 1e-10 else 1.0
    C = 1 + (
        (1-beta)**2/24 * alpha**2/FKmid**2
        + rho*beta*nu*alpha/(4*FKmid)
        + (2 - 3*rho**2)/24 * nu**2
    ) * T
    return A * B * C

def calibrate_sabr(market_vols, strikes, F, T, beta=0.5):
    """Fit alpha, rho, nu to market smile with fixed beta."""
    def obj(params):
        alpha, rho, nu = params
        if not (-0.999 < rho < 0.999) or alpha <= 0 or nu <= 0:
            return 1e10
        model = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                          for K in strikes])
        return np.sum((model - np.array(market_vols))**2)
    res = minimize(obj, [0.20, -0.30, 0.50], method="Nelder-Mead",
                   options={"xatol":1e-7,"fatol":1e-9})
    return dict(zip(["alpha","rho","nu"], res.x))`,
    explanation:
      "Fixing beta separates the backbone (beta) from the smile dynamics (rho, nu), making calibration a 3-parameter problem. Negative rho produces the standard equity downward skew; for interest rate swaptions beta=0.5 and rho near zero is common.",
  },
  {
    id: "pyfin-20260607-b1-dupire-localvol",
    language: "python",
    tag: "finance",
    title: "Dupire local vol surface from call price grid",
    code: `import numpy as np

def dupire_local_vol(K_grid: np.ndarray, T_grid: np.ndarray,
                     C: np.ndarray) -> np.ndarray:
    """
    Dupire (1994) formula:
        sigma_loc^2(K,T) = (dC/dT) / (0.5 * K^2 * d^2C/dK^2)

    C: (len(T_grid), len(K_grid)) call price surface.
    Returns local vol surface of the same shape.
    r=0 simplified version; add r and q corrections for real use.
    """
    dC_dT  = np.gradient(C,  T_grid, axis=0)          # dC/dT
    dC_dK  = np.gradient(C,  K_grid, axis=1)           # dC/dK
    d2C_dK2 = np.gradient(dC_dK, K_grid, axis=1)       # d^2C/dK^2

    K_mesh = np.tile(K_grid, (len(T_grid), 1))

    with np.errstate(divide="ignore", invalid="ignore"):
        local_var = 2 * dC_dT / (K_mesh**2 * d2C_dK2)
        local_var = np.where(local_var > 1e-8, local_var, np.nan)

    return np.sqrt(local_var)

# Usage: fit a smooth call surface first (e.g. via SVI or cubic spline),
# then apply Dupire. Raw market prices produce noisy second derivatives.`,
    explanation:
      "Dupire's equation uniquely determines the local vol surface consistent with all market call prices — it is the theoretical inverse of Black-Scholes. In practice, the numerical differentiation requires a smooth interpolated surface; raw market grids produce unstable second derivatives.",
  },
  {
    id: "pyfin-20260607-b1-nss-curve",
    language: "python",
    tag: "finance",
    title: "Nelson-Siegel-Svensson yield curve fitting",
    code: `import numpy as np
from scipy.optimize import minimize

def nss_yield(tau, b0, b1, b2, b3, lam1, lam2):
    """
    Nelson-Siegel-Svensson zero-coupon yield at maturity tau (years).
    b0: long-run level; b1: slope; b2,b3: curvatures; lam1,lam2: decay.
    """
    t1 = tau / lam1
    t2 = tau / lam2
    f1 = (1 - np.exp(-t1)) / t1
    f2 = f1 - np.exp(-t1)
    f3 = (1 - np.exp(-t2)) / t2 - np.exp(-t2)
    return b0 + b1*f1 + b2*f2 + b3*f3

def fit_nss(maturities: np.ndarray, yields: np.ndarray) -> dict:
    """Fit NSS to observed treasury benchmark yields."""
    def obj(p):
        fitted = np.array([nss_yield(tau, *p) for tau in maturities])
        return np.sum((fitted - yields)**2)
    x0 = [0.04, -0.02, 0.02, 0.01, 1.5, 4.0]
    bounds = [(-0.5, 0.5)]*4 + [(0.01, 30.0)]*2
    res = minimize(obj, x0, bounds=bounds, method="L-BFGS-B")
    keys = ["beta0","beta1","beta2","beta3","lambda1","lambda2"]
    return dict(zip(keys, res.x))

# Extract forward rate at horizon h: f(h) = d/dh [h * R(h)]
def instantaneous_forward(tau, params):
    eps = 1e-5
    return (tau * nss_yield(tau, **params) - (tau-eps) * nss_yield(tau-eps, **params)) / eps`,
    explanation:
      "NSS extends Nelson-Siegel by adding a second hump term, improving fit for yield curves with multiple inflection points. The model is widely used by central banks (ECB, Fed) for official curve estimates because it provides smooth, analytically differentiable forward rates.",
  },
  {
    id: "pyfin-20260607-b1-hull-white-mc",
    language: "python",
    tag: "finance",
    title: "Hull-White 1-factor Monte Carlo ZCB pricer",
    code: `import numpy as np

def hull_white_zcb_mc(r0: float, a: float, sigma: float,
                       theta_bar: float, T: float,
                       paths: int = 20000, steps: int = 252) -> float:
    """
    Hull-White 1F: dr = a*(theta_bar - r)*dt + sigma*dW
    Returns E[exp(-integral_0^T r_t dt)] under risk-neutral measure.
    theta_bar is calibrated to the initial forward curve.
    """
    dt   = T / steps
    r    = np.full(paths, r0)
    intR = np.zeros(paths)
    rng  = np.random.default_rng(42)
    for _ in range(steps):
        intR += r * dt
        r += a * (theta_bar - r) * dt + sigma * np.sqrt(dt) * rng.standard_normal(paths)
    return float(np.mean(np.exp(-intR)))

def zcb_analytical(r0, a, sigma, T):
    """Vasicek/Hull-White closed form (constant theta)."""
    B = (1 - np.exp(-a * T)) / a
    lnA = (B - T) * (a**2 * 0.0 - sigma**2 / 2) / a**2 - sigma**2 * B**2 / (4*a)
    return np.exp(lnA - B * r0)

# Cross-check: hull_white_zcb_mc(0.03, 0.5, 0.01, 0.03, 5.0) ≈ zcb_analytical(...)`,
    explanation:
      "Hull-White is mean-reverting (speed a) toward a time-varying theta(t) fitted to today's discount curve, guaranteeing perfect repricing of all current ZCB prices. The MC becomes necessary when theta is genuinely time-varying and the analytical A(t,T) formula involves a numerical integral.",
  },
  {
    id: "pyfin-20260607-b1-cds-spread",
    language: "python",
    tag: "finance",
    title: "CDS fair spread from piecewise-flat hazard rates",
    code: `import numpy as np

def cds_par_spread(hazard_rates: np.ndarray,
                   discount_factors: np.ndarray,
                   dt: float = 0.25,
                   recovery: float = 0.40) -> float:
    """
    CDS par spread (bps) such that PV(protection leg) = PV(premium leg).
    hazard_rates: quarterly flat hazard rates, shape (n,).
    discount_factors: risk-free D(t_i) at each quarterly payment date.
    """
    n = len(hazard_rates)
    # Survival probability Q(t_i) = prod exp(-h_j * dt)
    Q = np.cumprod(np.exp(-hazard_rates * dt))
    Q_prev = np.concatenate([[1.0], Q[:-1]])

    # Protection leg: (1-R) * sum D(t_i) * (Q(t_{i-1}) - Q(t_i))
    prot_pv = (1 - recovery) * np.sum(discount_factors * (Q_prev - Q))

    # Premium leg: S * sum D(t_i) * Q(t_i) * dt
    prem_ann = np.sum(discount_factors * Q * dt)

    spread_bps = prot_pv / prem_ann * 10_000
    return float(spread_bps)

# Example: 5Y CDS, flat 2% hazard rate, flat 4% risk-free
# t = np.arange(0.25, 5.25, 0.25); h = np.full(20, 0.02); D = np.exp(-0.04*t)
# cds_par_spread(h, D) ≈ 120 bps (for R=0.40)`,
    explanation:
      "The par spread equates protection and premium PVs; the protection leg pays (1-R) on each default event weighted by the default probability in each period. Recovery of 40% is market convention for investment-grade corporates; sovereign CDS often uses 25%.",
  },
  {
    id: "pyfin-20260607-b1-hazard-bootstrap",
    language: "python",
    tag: "finance",
    title: "Hazard rate bootstrapping from CDS spread curve",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard(cds_spreads_bps: list, tenors: list,
                     discount_factors: list, recovery: float = 0.40):
    """
    Piecewise-constant hazard rate bootstrapping.
    Solves for each h_i such that the CDS prices at par.
    """
    hazards = []
    for i, (s_bps, T) in enumerate(zip(cds_spreads_bps, tenors)):
        s = s_bps / 10_000.0
        prev_tenors  = tenors[:i]
        prev_hazards = hazards[:]

        def par_spread_diff(h_i):
            all_h  = prev_hazards + [h_i]
            all_T  = prev_tenors  + [T]
            steps  = int(T * 4)
            t_grid = np.linspace(dt := T / steps, T, steps)
            # Build survival from piecewise-flat hazards
            cum_h = np.interp(t_grid, all_T, all_h, left=all_h[0])
            Q     = np.exp(-cum_h * t_grid)
            D     = np.interp(t_grid, tenors[:i+1], discount_factors[:i+1])
            Q_prev = np.concatenate([[1.0], Q[:-1]])
            prot   = (1 - recovery) * np.sum(D * (Q_prev - Q))
            prem   = s * np.sum(D * Q * dt)
            return prot - prem

        h_i = brentq(par_spread_diff, 1e-6, 5.0, xtol=1e-8)
        hazards.append(h_i)
    return hazards`,
    explanation:
      "Bootstrapping solves for one hazard rate at a time, with each solution anchored by previously calibrated short-maturity rates — analogous to stripping the yield curve. Brentq converges in ~10 iterations since the par spread is monotone in the hazard rate for standard recovery assumptions.",
  },
  {
    id: "pyfin-20260607-b1-importance-sampling",
    language: "python",
    tag: "finance",
    title: "Importance sampling MC — deep OTM option pricing",
    code: `import numpy as np

def is_call_price(S0: float, K: float, r: float, sigma: float,
                  T: float, paths: int = 100_000, seed: int = 42) -> float:
    """
    Importance sampling for deep OTM calls: shift the sampling distribution
    so most paths end near K, dramatically reducing variance.
    Change of measure: standard normal -> normal shifted by theta.
    """
    rng   = np.random.default_rng(seed)
    # Optimal drift shift: centre sampling at log(K/S0)
    mu_star = np.log(K / S0) / T
    theta   = (mu_star - r + 0.5 * sigma**2) / (sigma * np.sqrt(T))

    z       = rng.standard_normal(paths)
    S_T     = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*(z + theta))
    payoff  = np.maximum(S_T - K, 0.0)

    # Radon-Nikodym derivative: dP/dQ = exp(-theta*z - 0.5*theta^2)
    radon_nikodym = np.exp(-theta * z - 0.5 * theta**2)

    price = np.exp(-r * T) * np.mean(payoff * radon_nikodym)
    stderr = np.std(payoff * radon_nikodym) / np.sqrt(paths)
    return float(price)

# Deep OTM call K=140, S=100, T=1, sigma=0.2:
# Crude MC needs ~1M paths for <1% SE; IS achieves same with 10K paths.`,
    explanation:
      "Importance sampling shifts the sampling measure so the simulated terminal prices cluster around the strike, then corrects for the change of measure via the Radon-Nikodym derivative. The variance reduction is orders of magnitude for far-OTM options where fewer than 1% of crude MC paths contribute non-zero payoffs.",
  },
  {
    id: "pyfin-20260607-b1-control-variates",
    language: "python",
    tag: "finance",
    title: "Control variates MC — Asian option variance reduction",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return S * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d1 - sigma*np.sqrt(T))

def asian_cv_mc(S0, K, r, sigma, T, paths=50_000, steps=252, seed=42):
    """
    Arithmetic Asian MC with geometric Asian as control variate.
    Geometric Asian has a closed form (BS with adjusted params).
    Variance reduction typically 80-95% over crude MC.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / steps
    Z    = rng.standard_normal((paths, steps))
    logS = np.log(S0) + np.cumsum((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=1)
    S_paths = np.exp(logS)

    arith_mean = S_paths.mean(axis=1)
    geom_mean  = np.exp(logS.mean(axis=1))      # geometric mean in log-space

    pa = np.maximum(arith_mean - K, 0.0)         # arithmetic Asian payoff
    pg = np.maximum(geom_mean  - K, 0.0)         # geometric Asian payoff

    # Closed form for geometric Asian: BS with sigma_g and r_g
    sigma_g = sigma * np.sqrt((2*steps + 1) / (6*(steps + 1)))
    mu_g    = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    cv_price = np.exp(-r*T) * bs_call(S0, K, mu_g, sigma_g, T)

    # Optimal control coefficient
    c = np.cov(pa, pg)[0, 1] / np.var(pg)
    controlled = pa - c * (pg - cv_price * np.exp(r*T))
    return float(np.exp(-r*T) * np.mean(controlled))`,
    explanation:
      "The control variate exploits the high correlation between arithmetic and geometric Asian paths (typically r > 0.99); subtracting c*(geometric_payoff - geometric_price) removes the shared variance while leaving the arithmetic mean unbiased. The coefficient c is the OLS slope of arithmetic on geometric payoffs.",
  },
  {
    id: "pyfin-20260607-b1-historical-var",
    language: "python",
    tag: "finance",
    title: "Historical simulation VaR and Expected Shortfall",
    code: `import numpy as np
import pandas as pd

def historical_var_es(returns: pd.Series,
                       confidence: float = 0.99,
                       horizon: int = 1) -> dict:
    """
    Historical simulation VaR and ES (CVaR) at given confidence.
    No distributional assumption — uses the empirical return distribution.
    horizon: holding period in days (scales by sqrt(T) under iid).
    Returns losses as positive numbers.
    """
    scaled = returns * np.sqrt(horizon)
    sorted_r = np.sort(scaled.dropna().values)
    alpha    = 1 - confidence
    cutoff   = int(np.ceil(alpha * len(sorted_r))) - 1
    var      = -sorted_r[cutoff]           # loss at alpha quantile
    es       = -sorted_r[:cutoff + 1].mean()   # mean loss in the tail
    return {
        "VaR":    round(float(var), 6),
        "ES":     round(float(es), 6),
        "n_tail": cutoff + 1,
        "horizon": horizon,
        "confidence": confidence,
    }

# FRTB (Basel IV) mandates ES at 97.5% replacing VaR at 99% for market risk.
# returns = pd.Series(np.diff(np.log(prices)))
# result = historical_var_es(returns, confidence=0.975, horizon=10)`,
    explanation:
      "Historical simulation is non-parametric: it makes no assumption about return distribution and naturally captures fat tails, skew, and cross-asset correlations present in the historical record. Its weakness is that it cannot extrapolate beyond the worst observed event in the lookback window.",
  },
  {
    id: "pyfin-20260607-b1-evt-tail",
    language: "python",
    tag: "finance",
    title: "EVT/GPD Peaks over Threshold — tail risk estimation",
    code: `import numpy as np
from scipy.stats import genpareto

def evt_var_es(losses: np.ndarray,
               threshold_pct: float = 0.90,
               confidence: float = 0.99) -> dict:
    """
    Peaks-over-Threshold EVT: fit GPD to exceedances above threshold u.
    Returns parametric VaR and ES at confidence level (confidence > threshold_pct).
    """
    u          = np.quantile(losses, threshold_pct)
    exceed     = losses[losses > u] - u           # exceedances
    xi, _, beta = genpareto.fit(exceed, floc=0)   # shape, loc=0, scale

    n   = len(losses)
    Nu  = len(exceed)
    p   = 1 - confidence

    if abs(xi) < 1e-8:  # exponential limit
        var = u - beta * np.log(n / Nu * p)
    else:
        var = u + beta / xi * ((n / Nu * p) ** (-xi) - 1)

    # ES for GPD: (VaR + beta - xi*u) / (1 - xi)
    es = (var + beta - xi * u) / (1 - xi)

    return {
        "VaR": float(var), "ES": float(es),
        "xi_shape": float(xi), "beta_scale": float(beta),
        "threshold": float(u), "n_tail": int(Nu),
    }

# Fatter tails → xi > 0 (Pareto-like); thin tails → xi ≈ 0 (exponential).
# Requires ~1000+ tail observations for reliable GPD MLE.`,
    explanation:
      "GPD is the limit distribution for exceedances over a high threshold (Pickands-Balkema-de Haan theorem), providing a principled extrapolation beyond the observed maximum. The shape parameter xi is the key tail index: equity daily losses typically have xi ≈ 0.2–0.4.",
  },
  {
    id: "pyfin-20260607-b1-kalman-pairs",
    language: "python",
    tag: "finance",
    title: "Kalman filter — dynamic hedge ratio for pairs trading",
    code: `import numpy as np

def kalman_hedge_ratio(y: np.ndarray, x: np.ndarray,
                        delta: float = 1e-5,
                        obs_noise: float = 1e-3) -> tuple:
    """
    Kalman filter estimates time-varying beta: y ≈ beta*x + alpha.
    State theta = [beta, alpha]; process noise Vw = delta/(1-delta).
    Returns (beta_series, alpha_series, spread_series).
    """
    n       = len(y)
    Vw      = delta / (1 - delta)     # process noise variance
    beta    = np.zeros(n)
    alpha   = np.zeros(n)
    theta   = np.array([0.0, 0.0])    # state estimate
    P       = np.eye(2)               # state covariance

    for t in range(n):
        F = np.array([x[t], 1.0])     # observation matrix
        # Predict
        R = P + Vw * np.eye(2)
        # Update
        S = float(F @ R @ F) + obs_noise    # innovation variance
        K = R @ F / S                         # Kalman gain
        e = y[t] - float(F @ theta)           # innovation (spread)
        theta  += K * e
        P       = (np.eye(2) - np.outer(K, F)) @ R
        beta[t], alpha[t] = theta

    spread = y - beta * x - alpha
    return beta, alpha, spread

# Trade when spread > +2*std (short spread) or < -2*std (long spread).`,
    explanation:
      "The Kalman filter adapts the hedge ratio continuously as the cointegration relationship drifts, avoiding the stale-beta problem of rolling OLS. The process noise delta controls how quickly beta tracks structural breaks: larger delta means faster adaptation but more noise.",
  },
  {
    id: "pyfin-20260607-b1-fama-french",
    language: "python",
    tag: "finance",
    title: "Fama-French 3-factor alpha and beta decomposition",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def fama_french_alpha(returns: pd.Series, ff3: pd.DataFrame) -> dict:
    """
    Regress excess returns on Fama-French 3 factors.
    ff3 columns: 'Mkt-RF', 'SMB', 'HML', 'RF' (all in decimal).
    Returns annualised alpha, factor betas, t-stats, R², info ratio.
    """
    excess = returns - ff3["RF"]
    aligned = excess.dropna()
    X = sm.add_constant(ff3[["Mkt-RF", "SMB", "HML"]].loc[aligned.index])
    ols = sm.OLS(aligned, X).fit(cov_type="HAC", cov_kwds={"maxlags": 5})

    daily_alpha = ols.params["const"]
    ir = daily_alpha / ols.resid.std() * np.sqrt(252)

    return {
        "alpha_annual":    round(daily_alpha * 252, 4),
        "alpha_tstat":     round(ols.tvalues["const"], 3),
        "beta_mkt":        round(ols.params["Mkt-RF"], 4),
        "beta_smb":        round(ols.params["SMB"], 4),
        "beta_hml":        round(ols.params["HML"], 4),
        "r_squared":       round(ols.rsquared, 4),
        "information_ratio": round(ir, 3),
    }

# Data: Ken French's data library provides daily FF3 factors.
# Positive alpha_tstat > 2 indicates statistically significant skill.`,
    explanation:
      "HAC (Newey-West) standard errors correct for autocorrelation and heteroskedasticity in daily return residuals, producing valid t-statistics. The information ratio (alpha / tracking error) normalises by the active risk taken; IR > 0.5 annualised is considered good for a long-only fund.",
  },
  {
    id: "pyfin-20260607-b1-svi-surface",
    language: "python",
    tag: "finance",
    title: "SVI parameterisation — arbitrage-free vol surface",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_total_var(k, a, b, rho, m, sigma):
    """
    SVI (Stochastic Volatility Inspired) total variance:
    w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    k = log(K/F); returns w = sigma_implied^2 * T.
    """
    return a + b * (rho * (k - m) + np.sqrt((k - m)**2 + sigma**2))

def fit_svi(log_moneyness: np.ndarray,
            total_variances: np.ndarray) -> dict:
    """Fit SVI [a, b, rho, m, sigma] to market total variances."""
    def obj(p):
        a, b, rho, m, sig = p
        # No-arbitrage conditions: b>=0, |rho|<1, sig>0
        if b < 0 or abs(rho) >= 1 or sig <= 0 or a < -b*sig:
            return 1e10
        w = svi_total_var(log_moneyness, a, b, rho, m, sig)
        return float(np.sum((w - total_variances)**2))

    res = minimize(obj, [0.04, 0.10, -0.30, 0.0, 0.10],
                   method="Nelder-Mead")
    a, b, rho, m, sig = res.x
    return {"a": a, "b": b, "rho": rho, "m": m, "sigma": sig}

# SVI is widely used by quant desks because:
# 1) 5 parameters fit the full smile with good convexity
# 2) Explicit no-butterfly-arbitrage conditions exist (Gatheral-Jacquier)`,
    explanation:
      "SVI parameterises the total variance smile (implied var × T) rather than implied vol, which makes the no-calendar-arbitrage condition (dw/dT >= 0) easy to impose. The parameter rho controls skew and m shifts the minimum, decoupling slope from curvature.",
  },
  {
    id: "pyfin-20260607-b1-garch11",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) calibration and conditional vol forecast",
    code: `import numpy as np
import pandas as pd
from arch import arch_model

def fit_garch11(returns: pd.Series) -> dict:
    """
    Fit GARCH(1,1) to daily log-returns.
    Persistence = alpha+beta; if near 1, shocks decay slowly (IGARCH).
    """
    model  = arch_model(returns * 100, vol="Garch", p=1, q=1,
                        dist="normal", rescale=False)
    result = model.fit(disp="off")

    omega = result.params["omega"]
    alpha = result.params["alpha[1]"]
    beta  = result.params["beta[1]"]
    persistence = alpha + beta

    # Long-run variance: omega / (1 - alpha - beta)
    long_run_vol = np.sqrt(omega / (1 - persistence)) / 100

    # 5-day conditional vol forecast
    fc   = result.forecast(horizon=5, reindex=False)
    vol5 = np.sqrt(fc.variance.iloc[-1].values) / 100

    return {
        "omega": omega, "alpha": alpha, "beta": beta,
        "persistence": round(persistence, 4),
        "long_run_vol_daily": round(long_run_vol, 6),
        "5d_vol_forecast": [round(v, 6) for v in vol5],
        "log_likelihood": round(result.loglikelihood, 2),
    }`,
    explanation:
      "GARCH(1,1) captures vol clustering via the persistence term alpha+beta: when close to 1, large vol shocks take many days to decay (consistent with equity markets after crises). The unconditional variance omega/(1-alpha-beta) is the long-run variance the process reverts to.",
  },
  {
    id: "pyfin-20260607-b1-arima-forecast",
    language: "python",
    tag: "finance",
    title: "ARIMA return forecasting with ADF stationarity test",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller

def arima_return_forecast(prices: pd.Series,
                           order: tuple = (2, 0, 2),
                           horizon: int = 5) -> dict:
    """
    Fit ARIMA(p,d,q) to log-returns, check stationarity, forecast.
    d=0 appropriate if ADF test rejects unit root (p-value < 0.05).
    """
    log_ret = np.log(prices).diff().dropna()

    # Augmented Dickey-Fuller test: H0 = unit root (non-stationary)
    adf_stat, adf_pval, _, _, crit, _ = adfuller(log_ret, autolag="AIC")

    model  = ARIMA(log_ret, order=order).fit()
    fc     = model.forecast(steps=horizon)
    ci     = model.get_forecast(steps=horizon).conf_int(alpha=0.05)

    return {
        "adf_pvalue":    round(adf_pval, 4),
        "is_stationary": adf_pval < 0.05,
        "aic":           round(model.aic, 2),
        "forecast":      fc.round(6).tolist(),
        "ci_lower":      ci.iloc[:, 0].round(6).tolist(),
        "ci_upper":      ci.iloc[:, 1].round(6).tolist(),
    }

# Returns are typically I(0) (stationary) so d=0; prices are I(1) (unit root).
# ARIMA(1,0,1) often AIC-optimal; higher orders risk overfitting.`,
    explanation:
      "The ADF test with d=0 is required before fitting ARIMA to confirm returns are stationary; if ADF fails (pvalue > 0.05), increase d. Return forecastability is weak (close to white noise), so ARIMA is used mainly for intraday microstructure mean reversion rather than multi-day directional prediction.",
  },
  {
    id: "pyfin-20260607-b1-black-litterman",
    language: "python",
    tag: "finance",
    title: "Black-Litterman posterior — blend views with equilibrium",
    code: `import numpy as np

def black_litterman(Sigma: np.ndarray, pi_eq: np.ndarray,
                    P: np.ndarray, Q: np.ndarray,
                    tau: float = 0.05,
                    Omega: np.ndarray | None = None) -> dict:
    """
    Black-Litterman posterior mean and covariance.
    Sigma: asset covariance (n x n), pi_eq: CAPM equilibrium returns (n,)
    P: view matrix (k x n), Q: view expected returns (k,)
    Omega: view uncertainty (k x k); None -> proportional to prior.
    """
    if Omega is None:
        Omega = np.diag(np.diag(tau * P @ Sigma @ P.T))

    tau_Sigma_inv = np.linalg.inv(tau * Sigma)
    Omega_inv     = np.linalg.inv(Omega)

    # Posterior precision = prior precision + view precision
    post_prec = tau_Sigma_inv + P.T @ Omega_inv @ P
    M         = np.linalg.inv(post_prec)

    mu_bl     = M @ (tau_Sigma_inv @ pi_eq + P.T @ Omega_inv @ Q)
    Sigma_bl  = Sigma + M

    return {
        "mu_posterior":    mu_bl,
        "Sigma_posterior": Sigma_bl,
        "M":               M,   # posterior covariance of mean
    }

# pi_eq = delta * Sigma @ w_mkt  where delta = risk aversion, w_mkt = market cap weights
# Views example: P = [[1, -1, 0, ...]], Q = [0.02] means "asset1 outperforms asset2 by 2%"`,
    explanation:
      "Black-Litterman solves the portfolio construction dilemma of unconstrained mean-variance: extreme weights from sample mean estimation are avoided by shrinking toward CAPM equilibrium. The Omega matrix controls view confidence — diagonal Omega means views are independent, off-diagonal encodes correlated views.",
  },
  {
    id: "pyfin-20260607-b1-mkt-impact",
    language: "python",
    tag: "finance",
    title: "Market impact transaction cost model — Almgren-Chriss",
    code: `import numpy as np

def transaction_cost_bps(order_size: float, adv: float,
                          daily_vol: float, spread_bps: float = 5.0,
                          eta: float = 0.1, gamma: float = 0.6) -> dict:
    """
    Combined transaction cost: half-spread + temporary market impact.
    Almgren-Chriss temporary impact: eta * sigma * (x/ADV)^gamma.
    order_size: shares to trade; adv: average daily volume (shares).
    Returns breakdown in bps of notional.
    """
    participation = order_size / adv
    spread_cost   = spread_bps / 2.0
    temp_impact   = eta * daily_vol * participation**gamma * 10_000
    total_bps     = spread_cost + temp_impact

    # Permanent impact (price moves against you permanently)
    perm_impact   = 0.5 * eta * daily_vol * participation * 10_000

    return {
        "spread_bps":         round(spread_cost, 3),
        "temp_impact_bps":    round(temp_impact, 3),
        "perm_impact_bps":    round(perm_impact, 3),
        "total_cost_bps":     round(total_bps, 3),
        "participation_rate": round(participation, 4),
    }

# 10% of ADV with 2% daily vol: temp_impact ≈ 63 bps using eta=0.1, gamma=0.6
# Rule of thumb: don't trade > 5-10% of ADV to keep impact < 20 bps.`,
    explanation:
      "The power law in participation rate (gamma < 1) reflects concavity of impact: doubling order size less than doubles cost because the later slices trade at depleted liquidity. Permanent impact compounds across days and must be deducted from expected alpha before sizing.",
  },
  {
    id: "pyfin-20260607-b1-kelly-backtest",
    language: "python",
    tag: "finance",
    title: "Kelly-sized backtest with drawdown stop",
    code: `import numpy as np
import pandas as pd

def kelly_backtest(signals: pd.Series, fwd_returns: pd.Series,
                   max_leverage: float = 2.0,
                   dd_stop: float = 0.20,
                   lookback: int = 60) -> dict:
    """
    Kelly fractional sizing: f = mu / sigma^2 (clipped to max_leverage).
    signals: in (-1, 1); fwd_returns: next-day returns.
    Drawdown stop: zero out positions once drawdown exceeds dd_stop.
    """
    weighted  = signals * fwd_returns
    mu_roll   = weighted.rolling(lookback).mean()
    var_roll  = weighted.rolling(lookback).var()
    kelly_f   = np.clip(mu_roll / var_roll.replace(0, np.nan),
                        -max_leverage, max_leverage).fillna(0.0)

    strat_ret = (kelly_f.shift(1) * fwd_returns).dropna()
    cum       = (1 + strat_ret).cumprod()
    peak      = cum.cummax()
    drawdown  = (cum - peak) / peak

    # Hard stop: set returns to 0 while in drawdown beyond threshold
    stopped             = drawdown.shift(1).fillna(0) < -dd_stop
    strat_ret[stopped]  = 0.0
    cum_stopped = (1 + strat_ret).cumprod()

    sharpe = strat_ret.mean() / strat_ret.std() * np.sqrt(252)
    return {
        "sharpe":       round(float(sharpe), 3),
        "max_drawdown": round(float(drawdown.min()), 4),
        "cum_return":   round(float(cum_stopped.iloc[-1] - 1), 4),
        "hit_rate":     round(float((strat_ret > 0).mean()), 3),
    }`,
    explanation:
      "Full Kelly maximises log-wealth in the limit but leads to extreme drawdowns; fractional Kelly (clipping f) trades off long-run growth for drawdown control. The rolling 60-day lookback prevents overfitting to regime-specific mu/sigma estimates.",
  },
  {
    id: "pyfin-20260607-b1-bdt-tree",
    language: "python",
    tag: "finance",
    title: "Black-Derman-Toy binomial interest rate tree",
    code: `import numpy as np
from scipy.optimize import brentq

def build_bdt_tree(market_yields: list, local_vols: list,
                   dt: float = 0.5) -> list:
    """
    BDT tree calibration: short rate r(t,j) = r(t,0) * exp(2*sigma_t*dt*j).
    market_yields: zero-coupon yields for maturities 1..n periods.
    local_vols: term vol of short rate at each period.
    Returns list of rate columns: rates[t][j] = short rate at time t, state j.
    """
    rates = []
    for t in range(len(market_yields)):
        T           = (t + 1) * dt
        zcb_target  = np.exp(-market_yields[t] * T)
        sigma_t     = local_vols[t]

        def zcb_error(r0):
            r_col = [r0 * np.exp(2 * sigma_t * dt * j)
                     for j in range(t + 1)]
            # Backward induction to price ZCB
            prices = [np.exp(-r * dt) for r in r_col]
            for s in range(t - 1, -1, -1):
                r_prev = rates[s]
                prices = [0.5 * np.exp(-r_prev[j] * dt) * (prices[j] + prices[j+1])
                          for j in range(s + 1)]
            return prices[0] - zcb_target

        r0_t = brentq(zcb_error, 1e-5, 0.50, xtol=1e-8)
        rates.append([r0_t * np.exp(2 * sigma_t * dt * j)
                      for j in range(t + 1)])
    return rates

# Usage: rates = build_bdt_tree([0.03,0.035,0.04], [0.15,0.14,0.13])
# rates[0][0] = r(0) = initial short rate calibrated to zcb at t=0.5`,
    explanation:
      "BDT ensures rates are log-normally distributed (no negative rates by construction) and exactly fits both the initial yield curve and the term structure of rate volatilities. Backward induction prices any interest rate derivative once the tree is built.",
  },
  {
    id: "pyfin-20260607-b1-param-mc-var",
    language: "python",
    tag: "finance",
    title: "Parametric vs MC VaR — portfolio comparison",
    code: `import numpy as np
from scipy.stats import norm

def compare_var_methods(weights: np.ndarray, mu: np.ndarray,
                         Sigma: np.ndarray, horizon: int = 10,
                         confidence: float = 0.99,
                         paths: int = 100_000) -> dict:
    """
    Compare parametric (delta-normal) VaR vs full MC VaR.
    weights: portfolio weights; mu/Sigma: annualised return/covariance.
    Returns VaR and ES as fractions of notional.
    """
    f = horizon / 252.0
    port_mu  = float(weights @ mu) * f
    port_std = float(np.sqrt(weights @ Sigma @ weights)) * np.sqrt(f)

    # Parametric (normal) VaR
    z        = norm.ppf(1 - confidence)
    var_param = -(port_mu + z * port_std)

    # Monte Carlo VaR
    chol      = np.linalg.cholesky(Sigma)
    Z         = np.random.default_rng(42).standard_normal((paths, len(mu)))
    sim_ret   = Z @ chol.T * np.sqrt(f) + mu * f
    port_ret  = sim_ret @ weights
    var_mc    = float(-np.percentile(port_ret, (1 - confidence) * 100))
    es_mc     = float(-port_ret[port_ret <= -var_mc].mean())

    return {
        "VaR_param":   round(var_param, 6),
        "VaR_mc":      round(var_mc, 6),
        "ES_mc":       round(es_mc, 6),
        "VaR_diff_bps": round((var_mc - var_param) * 10_000, 1),
    }`,
    explanation:
      "Parametric VaR underestimates true risk when returns are fat-tailed because the normal distribution has too-thin tails. MC VaR with a multivariate normal shock is still parametric in distribution but captures non-linear payoffs (options, structured products) that delta-normal misses.",
  },
  {
    id: "pyfin-20260607-b1-merton-cf",
    language: "python",
    tag: "finance",
    title: "Merton jump-diffusion closed-form option price",
    code: `import numpy as np
from scipy.stats import norm
from math import factorial, exp, log, sqrt

def bs_call(S, K, r, sigma, T):
    if T <= 0 or sigma <= 0: return max(S - K, 0.0)
    d1 = (log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    return S * norm.cdf(d1) - K * exp(-r*T) * norm.cdf(d1 - sigma*sqrt(T))

def merton_call(S0: float, K: float, r: float, sigma: float, T: float,
                lam: float, mu_j: float, sigma_j: float,
                n_terms: int = 50) -> float:
    """
    Merton (1976) closed-form: sum of weighted BS prices.
    lam: jump intensity (jumps/year); mu_j: mean log-jump; sigma_j: jump log-vol.
    Converges quickly: n_terms=20 accurate to 6 decimal places.
    """
    kappa    = exp(mu_j + 0.5 * sigma_j**2) - 1.0   # mean jump size
    lam_p    = lam * (1 + kappa)                     # risk-neutral intensity
    price    = 0.0
    for n in range(n_terms):
        r_n     = r - lam * kappa + n * (mu_j + 0.5 * sigma_j**2) / T
        sigma_n = sqrt(sigma**2 + n * sigma_j**2 / T)
        weight  = exp(-lam_p * T) * (lam_p * T)**n / factorial(n)
        price  += weight * bs_call(S0, K, r_n, sigma_n, T)
    return price

# merton_call(100, 100, 0.05, 0.2, 1.0, lam=1, mu_j=-0.1, sigma_j=0.15)`,
    explanation:
      "The series converges because the Poisson weights exp(-lambda*T)*(lambda*T)^n/n! sum to 1 and decay exponentially for n >> lambda*T. Each term is a Black-Scholes price under a modified drift and vol conditional on exactly n jumps occurring — an elegant mixture-of-normals representation.",
  },
];
