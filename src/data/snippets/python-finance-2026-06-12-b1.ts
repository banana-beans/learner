import type { Snippet } from "./types";

export const pythonFinanceSnippets20260612B1: Snippet[] = [
  {
    id: "pyfin-20260612-b1-cvxpy-markowitz",
    language: "python",
    tag: "finance",
    title: "cvxpy Markowitz mean-variance — efficient frontier with constraints",
    code: `import numpy as np
import cvxpy as cp

def markowitz_frontier(
    mu: np.ndarray,        # expected returns, shape (N,)
    Sigma: np.ndarray,     # covariance matrix, shape (N, N)
    n_points: int = 30,
    long_only: bool = True,
    max_weight: float = 1.0,
) -> dict:
    """
    Trace the efficient frontier by solving:
        min  w^T Sigma w
        s.t. w^T mu = target_return
             sum(w) = 1
             0 <= w <= max_weight  (if long_only)
    Parametric sweep over target_return from min to max feasible return.
    """
    N  = len(mu)
    w  = cp.Variable(N)

    # Constraints common to all frontier points
    constraints = [cp.sum(w) == 1]
    if long_only:
        constraints += [w >= 0, w <= max_weight]
    else:
        constraints += [w >= -0.5, w <= 1.5]   # short-up-to-50% constraint

    # Feasible return range
    mu_min = float(np.min(mu))
    mu_max = float(np.max(mu))
    targets = np.linspace(mu_min, mu_max, n_points)

    rets, vols, weights = [], [], []
    for target in targets:
        prob = cp.Problem(
            cp.Minimize(cp.quad_form(w, Sigma)),
            constraints + [mu @ w >= target],
        )
        prob.solve(solver=cp.OSQP, warm_start=True, eps_abs=1e-8, eps_rel=1e-8)

        if prob.status in ("optimal", "optimal_inaccurate") and w.value is not None:
            w_val = np.array(w.value).flatten()
            port_vol = float(np.sqrt(w_val @ Sigma @ w_val))
            rets.append(float(mu @ w_val))
            vols.append(port_vol)
            weights.append(w_val.tolist())

    # Maximum Sharpe ratio portfolio (tangency, assuming rf=0)
    max_sr_idx = int(np.argmax([r / v if v > 0 else 0 for r, v in zip(rets, vols)]))

    return {
        "returns":       rets,
        "volatilities":  vols,
        "weights":       weights,
        "tangency_idx":  max_sr_idx,
        "tangency_ret":  round(rets[max_sr_idx], 6) if rets else None,
        "tangency_vol":  round(vols[max_sr_idx], 6) if vols else None,
        "tangency_sr":   round(rets[max_sr_idx] / vols[max_sr_idx], 4) if rets else None,
    }`,
    explanation:
      "The efficient frontier is the set of portfolios that minimise variance for each achievable expected return — every point above the minimum-variance portfolio is attainable, but only the upper half is efficient (rational investors never accept lower return for the same risk). The warm_start=True flag in OSQP reuses the previous solution as the starting point for the adjacent frontier point, reducing solve time by 3-5× for the parametric sweep.",
  },
  {
    id: "pyfin-20260612-b1-black-litterman",
    language: "python",
    tag: "finance",
    title: "Black-Litterman model — posterior returns from equilibrium and investor views",
    code: `import numpy as np

def black_litterman(
    Sigma: np.ndarray,      # (N, N) covariance matrix
    w_mkt: np.ndarray,      # (N,) market cap weights
    P: np.ndarray,          # (K, N) pick matrix: rows define views
    Q: np.ndarray,          # (K,) view returns
    Omega: np.ndarray,      # (K, K) view uncertainty (diagonal typical)
    rf: float = 0.0,
    delta: float = 2.5,     # risk aversion (global coefficient)
    tau: float = 0.05,      # scaling of prior uncertainty on equilibrium
) -> dict:
    """
    Black-Litterman (1990/1992):
    1. Implied equilibrium returns: Pi = delta * Sigma * w_mkt
    2. Posterior returns: mu_BL = [(tau*Sigma)^{-1} + P^T Omega^{-1} P]^{-1}
                                  * [(tau*Sigma)^{-1} Pi + P^T Omega^{-1} Q]
    3. Posterior covariance: Sigma_BL = [(tau*Sigma)^{-1} + P^T Omega^{-1} P]^{-1}
    P rows: e.g. [1, -1, 0, ...] = "asset 0 outperforms asset 1 by Q[k]"
    """
    N = len(w_mkt)

    # Step 1: implied equilibrium returns (reverse-optimisation)
    Pi = delta * Sigma @ w_mkt + rf

    # Step 2: BL posterior (matrix formula, See He & Litterman 1999)
    tau_Sigma    = tau * Sigma
    tau_Sigma_inv = np.linalg.inv(tau_Sigma)
    Omega_inv     = np.linalg.inv(Omega)

    M_inv = tau_Sigma_inv + P.T @ Omega_inv @ P   # posterior precision
    M     = np.linalg.inv(M_inv)

    mu_BL = M @ (tau_Sigma_inv @ Pi + P.T @ Omega_inv @ Q)

    # Posterior covariance = M + Sigma (posterior parameter uncertainty + sampling)
    Sigma_BL = M + Sigma

    # Optimal BL weights (unconstrained): w* = (delta * Sigma_BL)^{-1} * mu_BL
    w_BL = np.linalg.solve(delta * Sigma_BL, mu_BL - rf)

    return {
        "equilibrium_returns": Pi.round(6).tolist(),
        "bl_returns":          mu_BL.round(6).tolist(),
        "bl_weights":          w_BL.round(4).tolist(),
        "posterior_sigma_diag": np.diag(Sigma_BL).round(6).tolist(),
        "view_contribution":   (mu_BL - Pi).round(6).tolist(),  # how much views moved returns
        "n_assets":            N,
        "n_views":             len(Q),
    }`,
    explanation:
      "Black-Litterman combines equilibrium returns (from reverse-optimising market-cap weights under CAPM) with investor views via a Bayesian update — the posterior mean is a precision-weighted average of the prior (equilibrium) and the view signal. Without views, BL recovers the market portfolio; with strong views (low Omega), the posterior tilts heavily toward view assets. This elegantly solves the input sensitivity problem of raw Markowitz optimisation, which amplifies estimation errors in expected returns.",
  },
  {
    id: "pyfin-20260612-b1-ledoit-wolf",
    language: "python",
    tag: "finance",
    title: "Ledoit-Wolf covariance shrinkage — analytical formula (Oracle approximating)",
    code: `import numpy as np

def ledoit_wolf_shrinkage(returns: np.ndarray) -> dict:
    """
    Ledoit-Wolf (2004) analytical shrinkage estimator.
    Shrinks sample covariance S toward scaled identity F = mu_hat * I.
    Optimal alpha* = arg min E[||alpha*F + (1-alpha)*S - Sigma||^2_F].
    Closed-form alpha* = min(delta / T, 1) where delta is the oracle shrinkage.
    Implementation of the Ledoit-Wolf (2004) 'honey, I shrunk the sample covariance' paper.
    """
    T, N = returns.shape
    r    = returns - returns.mean(axis=0)    # demean

    S    = r.T @ r / T    # sample covariance (biased)

    # Target: scaled identity (simplest structured estimator)
    mu   = np.trace(S) / N    # optimal scale of target

    # Compute Ledoit-Wolf shrinkage intensity analytically
    # delta^2 = ||S - mu*I||^2_F / N^2
    delta2 = np.sum((S - mu * np.eye(N))**2) / N**2

    # gamma = sum of squared sample variances of squared returns (Monte-Carlo formula)
    # Theta = (1/T^2) sum_t ||r_t r_t^T - S||^2_F (asymptotic)
    theta_sum = 0.0
    for t in range(T):
        z       = r[t:t+1, :]    # (1, N)
        outer   = z.T @ z         # (N, N)
        diff    = outer - S
        theta_sum += np.sum(diff**2)
    gamma_hat = theta_sum / (T**2)

    # Optimal shrinkage: alpha* = min(gamma_hat / delta2, 1)
    alpha = min(gamma_hat / (delta2 * N**2), 1.0) if delta2 > 0 else 0.0

    # Shrunk covariance
    S_shrunk = alpha * mu * np.eye(N) + (1.0 - alpha) * S

    # Condition number improvement
    cond_S       = np.linalg.cond(S)
    cond_shrunk  = np.linalg.cond(S_shrunk)

    return {
        "alpha":          round(float(alpha), 4),
        "target_mu":      round(float(mu), 6),
        "cond_sample":    round(float(cond_S), 2),
        "cond_shrunk":    round(float(cond_shrunk), 2),
        "n_assets":       N,
        "n_obs":          T,
        "shrunk_cov":     S_shrunk,
    }`,
    explanation:
      "The Ledoit-Wolf shrinkage pulls the sample covariance toward a structured target (identity scaled by average variance), reducing the estimation error caused by sampling noise in extreme eigenvectors. The optimal shrinkage intensity alpha* is derived analytically by minimising the Frobenius-norm squared error, unlike the grid-search or cross-validation approaches used in other regularisers — this makes it both exact and O(N²T), the same cost as computing the sample covariance.",
  },
  {
    id: "pyfin-20260612-b1-pca-factors",
    language: "python",
    tag: "finance",
    title: "PCA factor model — eigendecompose returns for systematic risk extraction",
    code: `import numpy as np
import pandas as pd
from typing import Optional

def pca_factor_model(
    returns: pd.DataFrame,      # (T x N) asset returns
    n_factors: Optional[int] = None,
    variance_explained: float = 0.90,   # if n_factors is None, choose k for this threshold
) -> dict:
    """
    PCA factor model:
    R = F * B^T + e     (T x N = T x k * k x N + residuals)
    F: factor returns (T x k),  B: factor loadings (N x k)
    Eigen decomposition of the (N x N) sample covariance matrix.
    Factors are orthogonal (zero correlation) and ordered by variance explained.
    """
    T, N = returns.shape
    r    = returns.values - returns.mean().values  # demean

    # Covariance matrix and eigendecomposition
    Sigma = r.T @ r / (T - 1)     # (N x N)
    eigvals, eigvecs = np.linalg.eigh(Sigma)   # eigh for symmetric (real, sorted ascending)

    # Sort descending
    idx      = np.argsort(eigvals)[::-1]
    eigvals  = eigvals[idx]
    eigvecs  = eigvecs[:, idx]

    total_var = eigvals.sum()
    cumvar    = np.cumsum(eigvals) / total_var

    # Determine number of factors
    if n_factors is None:
        n_factors = int(np.searchsorted(cumvar, variance_explained) + 1)
    n_factors = min(n_factors, N)

    # Factor loadings (eigenvectors) and factor returns
    B      = eigvecs[:, :n_factors]                   # (N, k) loadings
    F      = r @ B                                     # (T, k) factor returns
    R_hat  = F @ B.T                                   # (T, N) fitted returns
    resid  = r - R_hat                                 # (T, N) idiosyncratic

    # R-squared per asset
    r2_per_asset = 1.0 - np.var(resid, axis=0) / np.var(r, axis=0)

    # Factor correlations to market (first factor ≈ market)
    mkt_ret = r.mean(axis=1)    # equal-weight market
    f_corrs = np.array([np.corrcoef(F[:, k], mkt_ret)[0, 1] for k in range(n_factors)])

    return {
        "n_factors":         n_factors,
        "var_explained":     cumvar[:n_factors].round(4).tolist(),
        "eigenvalues":       eigvals[:n_factors].round(6).tolist(),
        "loadings":          B.round(4).tolist(),           # (N, k)
        "factor_returns":    pd.DataFrame(F, index=returns.index).round(6),
        "mean_r2":           round(float(r2_per_asset.mean()), 4),
        "factor_mkt_corr":   f_corrs.round(4).tolist(),
        "idio_vols":         np.std(resid, axis=0).round(6).tolist(),
    }`,
    explanation:
      "The first principal component of equity return covariance explains 30-60% of total variance and is almost always the market factor — this is the empirical backbone of the CAPM. Subsequent PCs capture industry/sector factors, and the residual idiosyncratic variance after k factors is the component that can be diversified away in a large portfolio. In practice, PCA on a rolling covariance matrix is used for dynamic factor tracking, where the number of factors is chosen to keep the residual covariance matrix well-conditioned.",
  },
  {
    id: "pyfin-20260612-b1-sabr-calib",
    language: "python",
    tag: "finance",
    title: "SABR calibration — fit alpha, rho, nu to market smile (beta fixed)",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol_hagan(F: float, K: float, T: float,
                    alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan (2002) SABR lognormal vol approximation.
    """
    if abs(F - K) < 1e-7:   # ATM
        FK1b = F ** (1.0 - beta)
        corr = ((1-beta)**2 * alpha**2 / (24 * FK1b**2)
                + 0.25 * rho * beta * nu * alpha / FK1b
                + (2 - 3*rho**2) * nu**2 / 24)
        return alpha / FK1b * (1.0 + corr * T)

    one_m_b = 1.0 - beta
    FK      = np.sqrt(F * K)
    FKb     = FK ** one_m_b
    logFK   = np.log(F / K)

    z   = nu / alpha * FKb * logFK
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho + 1e-12))

    A = 1 + (one_m_b**2 / 24) * logFK**2 + (one_m_b**4 / 1920) * logFK**4
    corr = (one_m_b**2 * alpha**2 / (24 * FKb**2)
            + 0.25 * rho * beta * nu * alpha / FKb
            + (2 - 3*rho**2) * nu**2 / 24)
    return alpha * (z / (chi + 1e-12)) / (FKb * A) * (1 + corr * T)

def calibrate_sabr(
    F: float,
    strikes: np.ndarray,
    market_vols: np.ndarray,  # market implied vols (lognormal)
    T: float,
    beta: float = 0.5,        # fixed CEV exponent (0=normal, 1=lognormal)
) -> dict:
    """
    Calibrate SABR parameters (alpha, rho, nu) to market smile.
    beta is typically fixed by asset class convention:
      equity: beta=0 (normal) or 0.5 (square root)
      FX:     beta=1 (lognormal)
      rates:  beta=0 (normal) or 0.5
    """
    def objective(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu < 0 or abs(rho) >= 1:
            return 1e10
        vols = np.array([sabr_vol_hagan(F, K, T, alpha, beta, rho, nu)
                         for K in strikes])
        return float(np.sum((vols - market_vols)**2))

    # Initial guess from ATM vol: alpha_0 ≈ vol_atm * F^(1-beta)
    atm_idx = int(np.argmin(np.abs(strikes - F)))
    alpha0  = float(market_vols[atm_idx] * F**(1 - beta))
    x0      = [alpha0, -0.3, 0.3]
    bounds  = [(1e-6, 5.0), (-0.999, 0.999), (1e-6, 5.0)]

    res = minimize(objective, x0, method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-12, "gtol": 1e-9})
    alpha, rho, nu = res.x
    fitted = np.array([sabr_vol_hagan(F, K, T, alpha, beta, rho, nu) for K in strikes])

    return {
        "alpha":    round(float(alpha), 6),
        "beta":     beta,
        "rho":      round(float(rho), 6),
        "nu":       round(float(nu), 6),
        "rmse_vol": round(float(np.sqrt(np.mean((fitted - market_vols)**2))), 6),
        "fitted_vols": fitted.round(6).tolist(),
        "atm_vol":  round(float(sabr_vol_hagan(F, F, T, alpha, beta, rho, nu)), 6),
    }`,
    explanation:
      "SABR calibration fixes beta to encode the backbone assumption (how ATM vol moves with the forward) and calibrates the remaining three parameters to fit the observed smile shape. The rho parameter controls skew: negative rho produces a downward-sloping smile (typical in equity, where vol spikes when spot falls), while positive rho produces an upward slope (typical in some commodity markets). Alpha sets the overall vol level, and nu controls the 'smile curvature' or convexity of the smile.",
  },
  {
    id: "pyfin-20260612-b1-dupire-local-vol",
    language: "python",
    tag: "finance",
    title: "Dupire local vol — extract sigma(K,T) from call price surface",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(
    strikes: np.ndarray,    # (N_K,) sorted ascending
    expiries: np.ndarray,   # (N_T,) sorted ascending
    call_prices: np.ndarray,# (N_T, N_K) call price matrix
    S0: float,
    r: float,
    q: float = 0.0,
) -> dict:
    """
    Dupire (1994): local vol from call price surface.
    sigma^2(K, T) = [dC/dT + (r-q)*K*dC/dK + q*C] / [0.5*K^2 * d^2C/dK^2]

    Uses scipy RectBivariateSpline for smooth first and second derivatives.
    Local vol surface sigma(K,T) is the unique vol consistent with all
    European option prices (Gyongy 1986 projection theorem).
    """
    # Fit smooth bicubic spline over (T, K) grid
    spline = RectBivariateSpline(expiries, strikes, call_prices,
                                  kx=3, ky=3, s=0)   # s=0: interpolating

    LV   = np.zeros((len(expiries), len(strikes)))
    errs = []

    for i, T in enumerate(expiries):
        for j, K in enumerate(strikes):
            C    = spline(T, K)[0, 0]
            dCdT = spline(T, K, dx=1, dy=0)[0, 0]   # d/dT
            dCdK = spline(T, K, dx=0, dy=1)[0, 0]   # d/dK
            d2CdK2 = spline(T, K, dx=0, dy=2)[0, 0] # d^2/dK^2

            # Numerator: Dupire numerator
            num = dCdT + (r - q) * K * dCdK + q * C
            # Denominator: must be > 0 (no butterfly arbitrage)
            den = 0.5 * K**2 * d2CdK2

            if den > 1e-8 and num >= 0:
                LV[i, j] = float(np.sqrt(num / den))
            else:
                LV[i, j] = float("nan")
                errs.append((round(float(T), 3), round(float(K), 2)))

    lv_valid = LV[~np.isnan(LV)]
    return {
        "local_vol":        LV,
        "strikes":          strikes.tolist(),
        "expiries":         expiries.tolist(),
        "arb_violations":   errs,    # (T, K) where density was negative
        "lv_min":           round(float(np.nanmin(LV)), 4),
        "lv_max":           round(float(np.nanmax(LV)), 4),
        "lv_mean_atm":      round(float(np.nanmean(LV[:, len(strikes)//2])), 4),
    }`,
    explanation:
      "Dupire's equation is derived by differentiating the Fokker-Planck (Kolmogorov forward) equation for the transition density — the local vol surface is the unique function sigma(K,T) that makes the model-implied call price surface exactly equal to observed market prices. The denominator d²C/dK² is proportional to the risk-neutral density (Breeden-Litzenberger), so negative denominator indicates butterfly arbitrage in the price surface, which must be removed before the local vol can be extracted.",
  },
  {
    id: "pyfin-20260612-b1-variance-swap-py",
    language: "python",
    tag: "finance",
    title: "Variance swap fair strike — model-free log-strip integration",
    code: `import numpy as np
from scipy.stats import norm
from scipy.integrate import quad

def bs_price(S: float, K: float, r: float, q: float, sigma: float, T: float,
             opt: str = "call") -> float:
    if T <= 0 or sigma <= 0:
        return max((S - K if opt == "call" else K - S) * np.exp(-r * T), 0.0)
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if opt == "call":
        return S * np.exp(-q * T) * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * np.exp(-q * T) * norm.cdf(-d1)

def variance_swap_strike(
    S0: float, r: float, q: float, T: float,
    vol_surface,          # callable: vol_surface(K) -> implied_vol for given strike
    K_min: float = None,  # integration lower bound (defaults to 0.5 * F)
    K_max: float = None,  # integration upper bound (defaults to 2.0 * F)
) -> dict:
    """
    Model-free variance swap fair strike via Demeterfi-Derman-Kamal-Zou (1999).
    K_var = (2/T) * integral_0^F [P(K)/K^2] dK + integral_F^inf [C(K)/K^2] dK
    Equivalent to the VIX^2 formula (annualised).
    """
    F = S0 * np.exp((r - q) * T)
    if K_min is None: K_min = 0.5 * F
    if K_max is None: K_max = 2.0 * F

    disc = np.exp(-r * T)

    def put_integrand(K):
        sigma = vol_surface(K)
        p     = bs_price(S0, K, r, q, sigma, T, "put")
        return p / (K * K)

    def call_integrand(K):
        sigma = vol_surface(K)
        c     = bs_price(S0, K, r, q, sigma, T, "call")
        return c / (K * K)

    # Trapezoidal numerical integration
    K_puts  = np.linspace(K_min, F, 200)
    K_calls = np.linspace(F, K_max, 200)

    put_integ  = np.trapz([put_integrand(K)  for K in K_puts],  K_puts)
    call_integ = np.trapz([call_integrand(K) for K in K_calls], K_calls)

    K_var     = 2.0 / T * (put_integ + call_integ) / disc
    vix_equiv = 100.0 * np.sqrt(K_var)

    # ATM BS vol for comparison
    atm_vol = vol_surface(F)

    return {
        "K_var":       round(float(K_var), 6),
        "VIX_equiv":   round(float(vix_equiv), 2),
        "atm_vol":     round(float(atm_vol), 6),
        "convexity_adj": round(float(np.sqrt(K_var) - atm_vol), 6),
        "forward":     round(float(F), 4),
    }`,
    explanation:
      "The variance swap fair strike is always above the ATM implied vol (when the smile is convex) because variance swap payoff is convex in sigma — this difference is the 'convexity adjustment' or 'variance risk premium'. A flat smile gives K_var = sigma_ATM², while a smiling surface gives K_var > sigma_ATM² because the integral weights the tails where vol is higher. The VIX is directly this quantity annualised and expressed as a vol (square root).",
  },
  {
    id: "pyfin-20260612-b1-hmm-regime",
    language: "python",
    tag: "finance",
    title: "Hidden Markov Model regime detection — EM (Baum-Welch) on returns",
    code: `import numpy as np
from scipy.stats import norm

def fit_hmm_gaussian(
    returns: np.ndarray,
    n_states: int = 2,     # 2: bull/bear; 3: bull/sideways/bear
    n_iter: int = 200,
    tol: float = 1e-6,
    seed: int = 42,
) -> dict:
    """
    Gaussian HMM via Expectation-Maximisation (Baum-Welch algorithm).
    Observation model: r_t | s_t=k ~ N(mu_k, sigma_k^2).
    Hidden Markov chain: P(s_t = j | s_{t-1} = i) = A[i, j].
    Forward-backward algorithm: O(T * K^2).
    """
    rng = np.random.default_rng(seed)
    T   = len(returns)
    K   = n_states

    # Initialise parameters
    A     = rng.dirichlet(np.ones(K), size=K)      # (K, K) transition matrix
    pi    = rng.dirichlet(np.ones(K))               # initial distribution
    mu    = np.percentile(returns, np.linspace(10, 90, K))
    sigma = np.full(K, returns.std())

    prev_ll = -np.inf

    for iteration in range(n_iter):
        # E-step: forward-backward
        # Emission probabilities: b[t, k] = N(r_t; mu_k, sigma_k)
        B = np.zeros((T, K))
        for k in range(K):
            B[:, k] = norm.pdf(returns, mu[k], sigma[k])
        B = np.maximum(B, 1e-300)

        # Forward pass: alpha[t, k] = P(r_1..r_t, s_t=k)
        alpha = np.zeros((T, K))
        alpha[0] = pi * B[0]
        scale    = np.zeros(T)
        scale[0] = alpha[0].sum()
        alpha[0] /= scale[0]
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            scale[t] = alpha[t].sum()
            alpha[t] /= scale[t]

        # Backward pass
        beta = np.ones((T, K))
        for t in range(T - 2, -1, -1):
            beta[t] = (A * B[t+1] * beta[t+1]).sum(axis=1)
            beta[t] /= scale[t+1]

        # Posterior state probabilities (gamma) and transitions (xi)
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)

        # M-step: update parameters
        pi  = gamma[0]
        mu  = (gamma * returns[:, None]).sum(axis=0) / gamma.sum(axis=0)
        for k in range(K):
            diff     = returns - mu[k]
            sigma[k] = np.sqrt((gamma[:, k] * diff**2).sum() / gamma[:, k].sum())
            sigma[k] = max(sigma[k], 1e-6)

        # Transition matrix
        for i in range(K):
            for j in range(K):
                num = sum((alpha[t, i] * A[i, j] * B[t+1, j] * beta[t+1, j])
                          for t in range(T - 1))
                den = gamma[:-1, i].sum()
                A[i, j] = num / (den + 1e-12)
        A /= A.sum(axis=1, keepdims=True)

        ll = np.sum(np.log(scale))
        if abs(ll - prev_ll) < tol:
            break
        prev_ll = ll

    state_seq = np.argmax(gamma, axis=1)   # most likely state at each t (Viterbi approx)
    return {
        "mu":           mu.round(6).tolist(),
        "sigma":        sigma.round(6).tolist(),
        "transition":   A.round(4).tolist(),
        "initial":      pi.round(4).tolist(),
        "state_seq":    state_seq.tolist(),
        "log_likelihood": round(float(prev_ll), 4),
        "n_iter":       iteration + 1,
    }`,
    explanation:
      "The Baum-Welch algorithm is EM applied to HMMs: the E-step runs the forward-backward algorithm to compute posterior state probabilities, and the M-step updates Gaussian parameters by weighted sample statistics with the posteriors as weights. Scaling the forward-backward variables (divide by the column sum) prevents underflow for long sequences — without scaling, probabilities collapse to machine zero for T > 100 with typical financial returns.",
  },
  {
    id: "pyfin-20260612-b1-stratified-mc",
    language: "python",
    tag: "finance",
    title: "Stratified sampling MC — uniform coverage of the probability space",
    code: `import numpy as np
from scipy.stats import norm

def european_call_stratified(
    S0: float, K: float, r: float, sigma: float, T: float,
    n_paths: int = 100_000,
    n_strata: int = 100,      # equal-probability strata
    seed: int = 42,
) -> dict:
    """
    Stratified sampling: divide [0,1] into n_strata equal-probability bins.
    Draw exactly n_paths / n_strata samples from each stratum.
    Eliminates sampling gaps in the tails — crucial for barrier options and
    out-of-the-money payoffs where rare events dominate variance.
    """
    rng = np.random.default_rng(seed)

    paths_per_stratum = n_paths // n_strata
    disc  = np.exp(-r * T)
    drift = (r - 0.5 * sigma**2) * T
    vol   = sigma * np.sqrt(T)

    payoffs_strat = np.zeros(n_paths)
    payoffs_plain = np.zeros(n_paths)

    for k in range(n_strata):
        lo  = k / n_strata
        hi  = (k + 1) / n_strata
        # Uniform samples within stratum k
        u   = rng.uniform(lo, hi, paths_per_stratum)
        Z   = norm.ppf(u)            # inverse CDF to get Gaussian samples
        Z_plain = rng.standard_normal(paths_per_stratum)

        S_T        = S0 * np.exp(drift + vol * Z)
        S_T_plain  = S0 * np.exp(drift + vol * Z_plain)

        idx_start = k * paths_per_stratum
        idx_end   = idx_start + paths_per_stratum
        payoffs_strat[idx_start:idx_end] = np.maximum(S_T - K, 0.0)
        payoffs_plain[idx_start:idx_end] = np.maximum(S_T_plain - K, 0.0)

    price_strat = disc * payoffs_strat.mean()
    price_plain = disc * payoffs_plain.mean()
    se_strat = disc * payoffs_strat.std(ddof=1) / np.sqrt(n_paths)
    se_plain = disc * payoffs_plain.std(ddof=1) / np.sqrt(n_paths)

    var_reduction = (se_plain / se_strat)**2 if se_strat > 0 else np.inf

    return {
        "price_stratified":    round(float(price_strat), 6),
        "price_plain_mc":      round(float(price_plain), 6),
        "se_stratified":       round(float(se_strat), 6),
        "se_plain":            round(float(se_plain), 6),
        "variance_reduction":  round(float(var_reduction), 2),
        "n_strata":            n_strata,
    }`,
    explanation:
      "Stratified sampling guarantees that each quantile region of the sampling distribution receives exactly the right proportion of samples — it eliminates the clumping and gaps that plain Monte Carlo produces. For a European call, most of the payoff variance comes from the upper tail of the lognormal distribution; stratification ensures this region is sampled densely by construction, yielding variance reductions of 10-100× compared to plain MC with no additional computational cost per path.",
  },
  {
    id: "pyfin-20260612-b1-halton-qmc",
    language: "python",
    tag: "finance",
    title: "Halton quasi-Monte Carlo — low-discrepancy sequences for option pricing",
    code: `import numpy as np
from scipy.stats import norm

def halton_sequence(n: int, base: int) -> np.ndarray:
    """
    Halton sequence in base b: fills [0,1] more uniformly than pseudo-random.
    Constructed by reversing the base-b representation of integers.
    Base must be prime; typically primes 2, 3, 5, 7, 11, ... for each dimension.
    """
    seq = np.zeros(n)
    for i in range(1, n + 1):
        f, r = 1, 0
        j = i
        while j > 0:
            f /= base
            r += f * (j % base)
            j //= base
        seq[i - 1] = r
    return seq

def mc_asian_halton(
    S0: float, K: float, r: float, sigma: float, T: float,
    n_steps: int = 252,
    n_paths: int = 10_000,
    seed: int = 42,
) -> dict:
    """
    Asian arithmetic average call via Halton quasi-Monte Carlo.
    Uses Halton bases (2, 3) for 2D paths; standard normal via inverse CDF.
    Scrambled Halton (random shift) prevents correlation artifacts.
    """
    rng = np.random.default_rng(seed)

    dt    = T / n_steps
    drift = (r - 0.5 * sigma**2) * dt
    vol   = sigma * np.sqrt(dt)
    disc  = np.exp(-r * T)

    # Generate Halton sequences, one base per time step (wrap with primes)
    primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    payoffs_qmc   = np.zeros(n_paths)
    payoffs_plain = np.zeros(n_paths)

    for i in range(n_paths):
        avg_qmc   = 0.0
        avg_plain = 0.0
        S_qmc     = S0
        S_plain   = S0

        for t in range(n_steps):
            base = primes[t % len(primes)]
            # Halton point (scrambled by random shift)
            u_qmc = (halton_sequence(i + 1, base)[-1] + rng.random()) % 1.0
            Z_qmc   = float(norm.ppf(np.clip(u_qmc, 1e-6, 1 - 1e-6)))
            Z_plain = float(rng.standard_normal())

            S_qmc   *= np.exp(drift + vol * Z_qmc)
            S_plain *= np.exp(drift + vol * Z_plain)
            avg_qmc   += S_qmc
            avg_plain += S_plain

        avg_qmc   /= n_steps
        avg_plain /= n_steps
        payoffs_qmc[i]   = max(avg_qmc - K, 0.0)
        payoffs_plain[i] = max(avg_plain - K, 0.0)

    price_qmc   = disc * payoffs_qmc.mean()
    price_plain = disc * payoffs_plain.mean()
    se_qmc   = disc * payoffs_qmc.std(ddof=1) / np.sqrt(n_paths)
    se_plain = disc * payoffs_plain.std(ddof=1) / np.sqrt(n_paths)

    return {
        "price_qmc":   round(float(price_qmc), 6),
        "price_plain": round(float(price_plain), 6),
        "se_qmc":      round(float(se_qmc), 6),
        "se_plain":    round(float(se_plain), 6),
    }`,
    explanation:
      "Halton sequences are low-discrepancy sequences that fill the unit hypercube more uniformly than pseudorandom numbers — their discrepancy (measure of maximum deviation from uniformity) is O((log N)^d / N) versus O(N^{-1/2}) for pseudorandom. The scrambling step (random shift modulo 1) avoids the leading-digit correlations between different Halton bases and makes the estimator unbiased. For smooth payoffs (European, Asian), QMC converges at O(N^{-1}) versus O(N^{-1/2}) for plain MC.",
  },
  {
    id: "pyfin-20260612-b1-bdt-cap",
    language: "python",
    tag: "finance",
    title: "BDT lattice — cap/floor pricing on binomial short-rate tree",
    code: `import numpy as np
from scipy.optimize import brentq

def build_bdt_tree(
    market_zcb: dict,    # {tenor: ZCB price}, e.g. {0.5: 0.975, 1: 0.95, ...}
    sigma: float = 0.15, # constant short-rate vol (lognormal)
    dt: float = 0.5,     # time step in years
) -> dict:
    """
    BDT (Black-Derman-Toy 1990) calibration to market ZCB prices.
    State j at time step i: r[i][j] = u[i] * exp(sigma * (2j - i) * sqrt(dt))
    Arrow-Debreu prices A[i][j] = present value of $1 in state j at time i.
    """
    tenors  = sorted(market_zcb.keys())
    N       = len(tenors)
    rates   = [[0.0] * (i + 1) for i in range(N)]
    AD      = [[0.0] * (i + 1) for i in range(N + 1)]
    AD[0][0] = 1.0

    for i, T in enumerate(tenors):
        target = market_zcb[T]

        def price_zcb(u):
            total = 0.0
            for j in range(i + 1):
                r_ij = u * np.exp(sigma * (2*j - i) * np.sqrt(dt))
                total += AD[i][j] * np.exp(-r_ij * dt)
            return total

        u_cal = brentq(lambda u: price_zcb(u) - target, 1e-6, 5.0, xtol=1e-9)
        for j in range(i + 1):
            rates[i][j] = u_cal * np.exp(sigma * (2*j - i) * np.sqrt(dt))
            df = np.exp(-rates[i][j] * dt)
            AD[i+1][j+1] = AD[i+1][j+1] + AD[i][j] * 0.5 * df
            AD[i+1][j]   = AD[i+1][j]   + AD[i][j] * 0.5 * df

    return {"rates": rates, "AD": AD, "tenors": tenors, "dt": dt, "sigma": sigma}

def price_cap_bdt(tree: dict, strike: float, notional: float = 1_000_000) -> dict:
    """
    Cap = sum of caplets. Caplet at step i pays notional*(r[i] - K)^+ * dt at i+1.
    Price each caplet by summing over states: sum_j AD[i][j] * df * max(r[i][j]-K, 0)*dt.
    """
    rates, AD, tenors, dt = tree["rates"], tree["AD"], tree["tenors"], tree["dt"]
    cap_pv = 0.0
    caplet_pvs = []
    for i, T in enumerate(tenors[1:], start=1):
        cplt = 0.0
        for j in range(i + 1):
            r_ij = rates[i][j]
            payoff = max(r_ij - strike, 0.0) * dt * notional
            df     = np.exp(-r_ij * dt)
            cplt  += AD[i][j] * df * payoff
        cap_pv += cplt
        caplet_pvs.append(round(float(cplt), 4))

    return {
        "cap_pv":     round(float(cap_pv), 4),
        "caplet_pvs": caplet_pvs,
        "strike":     strike,
        "notional":   notional,
    }`,
    explanation:
      "The BDT tree is calibrated sequentially — each time step i has one free parameter (the centre rate u_i) that is solved by matching the market ZCB price at that tenor, using the Arrow-Debreu prices from all previous nodes. Arrow-Debreu prices are the fundamental building block: every contingent claim price is just the sum of state prices times the payoff in that state, making the backward induction for any derivative a trivial summation once the tree is calibrated.",
  },
  {
    id: "pyfin-20260612-b1-forward-start-py",
    language: "python",
    tag: "finance",
    title: "Forward start option pricing — Rubinstein factorisation",
    code: `import numpy as np
from scipy.stats import norm

def forward_start_call(
    S0: float,
    alpha: float,     # strike = alpha * S_{t1} (1.0 = ATM at start)
    r: float,
    q: float,
    sigma: float,
    t1: float,        # forward start date (years)
    T: float,         # final expiry (years)
) -> dict:
    """
    Rubinstein (1991) forward start call: strike set at alpha * S_{t1} at time t1.
    Value at t=0: C_fwd = S0 * e^{-q*t1} * BSCall_normalised(alpha, r, q, sigma, T-t1)
    The factorisation holds because S_T / S_{t1} ~ LN under GBM, independent of S_{t1}.
    """
    tau = T - t1
    if tau <= 0:
        return {"price": 0.0, "delta": 0.0, "gamma": 0.0}

    # Normalised BS call: F=1, K=alpha, period=tau
    sqT  = np.sqrt(tau)
    d1   = (np.log(1.0 / alpha) + (r - q + 0.5 * sigma**2) * tau) / (sigma * sqT)
    d2   = d1 - sigma * sqT

    bs_norm  = np.exp(-q * tau) * norm.cdf(d1) - alpha * np.exp(-r * tau) * norm.cdf(d2)
    disc_t1  = np.exp(-q * t1)

    price = S0 * disc_t1 * bs_norm
    delta = disc_t1 * bs_norm                        # linear in S0
    gamma = 0.0                                       # no gamma until reset date (S_0 cancels)

    # Vega (dC/dsigma) — same as vanilla vega scaled by disc_t1
    d_sigma = 0.001    # 10 bps bump
    d1_up   = (np.log(1.0/alpha) + (r-q+0.5*(sigma+d_sigma)**2)*tau) / ((sigma+d_sigma)*sqT)
    d2_up   = d1_up - (sigma+d_sigma)*sqT
    bs_up   = np.exp(-q*tau)*norm.cdf(d1_up) - alpha*np.exp(-r*tau)*norm.cdf(d2_up)
    vega    = S0 * disc_t1 * (bs_up - bs_norm) / d_sigma * 0.01    # per 1% vol

    # Time to reset effect: as t1 → 0, forward start → vanilla
    # Theta (per day): price at T-1/365 minus current price
    if T - t1 - 1/365 > 0:
        price_1d = S0 * disc_t1 * (
            np.exp(-q*(tau-1/365)) * norm.cdf(d1) - alpha * np.exp(-r*(tau-1/365)) * norm.cdf(d2)
        )
        theta = price_1d - price
    else:
        theta = -price

    return {
        "price":      round(float(price), 6),
        "delta":      round(float(delta), 6),
        "gamma":      0.0,
        "vega_1pct":  round(float(vega), 6),
        "theta_1d":   round(float(theta), 6),
        "tau":        round(float(tau), 4),
        "alpha":      alpha,
    }`,
    explanation:
      "The zero gamma of a forward start option before the reset date is an important risk management feature: delta is constant (proportional to current spot) until t1 arrives, after which the option becomes a vanilla with normal convexity. This makes forward starts self-hedging with respect to spot moves until reset — the hedge is simply short delta shares of S0, requiring no rebalancing until t1, after which the standard Black-Scholes delta hedging applies.",
  },
  {
    id: "pyfin-20260612-b1-risk-parity",
    language: "python",
    tag: "finance",
    title: "Risk parity (ERC) portfolio — equal risk contribution via scipy",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_parity(
    Sigma: np.ndarray,      # (N, N) covariance matrix
    budget: np.ndarray = None,  # (N,) risk budget (None = equal 1/N)
    n_iter: int = 1000,
) -> dict:
    """
    Equal Risk Contribution (ERC) portfolio: w such that
    w_i * (Sigma w)_i / (w^T Sigma w) = b_i   for all i
    where b_i = risk budget (sums to 1). ERC = b_i = 1/N for all i.
    Solve via minimising sum_i (RC_i - b_i * total_risk)^2.
    """
    N = Sigma.shape[0]
    if budget is None:
        budget = np.ones(N) / N    # equal risk budget

    def portfolio_vol(w):
        return float(np.sqrt(w @ Sigma @ w))

    def risk_contributions(w):
        """Marginal risk contribution per asset: RC_i = w_i * (Sigma*w)_i / vol(w)"""
        pv = portfolio_vol(w)
        return w * (Sigma @ w) / (pv + 1e-12)

    def objective(w):
        """Sum of squared deviations from target risk budgets."""
        rc   = risk_contributions(w)
        pv   = portfolio_vol(w)
        diff = rc - budget * pv
        return float(np.sum(diff**2))

    def objective_grad(w):
        rc  = risk_contributions(w)
        pv  = portfolio_vol(w)
        diff = rc - budget * pv
        # Numerical gradient (analytical derivation is involved)
        return None   # scipy uses finite differences if not provided

    x0 = np.ones(N) / N
    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1}]
    bounds = [(1e-6, 1.0)] * N    # long-only

    res = minimize(objective, x0, method="SLSQP", bounds=bounds,
                   constraints=constraints,
                   options={"ftol": 1e-10, "maxiter": n_iter})

    w_opt = np.array(res.x)
    w_opt = np.maximum(w_opt, 0)
    w_opt /= w_opt.sum()

    rc     = risk_contributions(w_opt)
    pv     = portfolio_vol(w_opt)
    rc_pct = rc / (pv + 1e-12)   # fraction of total risk

    return {
        "weights":         w_opt.round(6).tolist(),
        "risk_contribs":   rc_pct.round(6).tolist(),
        "portfolio_vol":   round(float(pv), 6),
        "max_rc_deviation": round(float(np.max(np.abs(rc_pct - budget))), 6),
        "converged":       res.success,
        "budget":          budget.round(4).tolist(),
    }`,
    explanation:
      "Risk parity allocates capital such that each asset contributes equally to total portfolio volatility — not equal capital weight but equal risk weight. This produces portfolios that are more diversified than equal-weight because high-volatility assets receive less capital: in a 60/40 equity-bond portfolio, >90% of the risk comes from equities, whereas a risk-parity portfolio equalises the contribution, empirically delivering better risk-adjusted returns through cycles of varying asset volatility regimes.",
  },
  {
    id: "pyfin-20260612-b1-twap-execution",
    language: "python",
    tag: "finance",
    title: "TWAP execution cost model — slippage vs participation rate",
    code: `import numpy as np
import pandas as pd

def twap_execution_model(
    total_shares: int,
    horizon_minutes: int,
    slice_interval_min: int = 5,
    daily_volume_shares: int = 1_000_000,
    daily_vol_pct: float = 0.015,    # daily price vol as fraction
    bid_ask_half_spread_bps: float = 2.0,
    impact_coeff: float = 0.1,       # square-root market impact coefficient
    arrival_price: float = 100.0,
) -> dict:
    """
    TWAP execution: divide total_shares equally over horizon_minutes,
    executing slice_interval_min slices.
    Market impact model: impact_bps = impact_coeff * sqrt(participation_rate)
    Spread cost: half_spread per slice.
    Timing risk: uncertainty of execution price from random walk.
    """
    n_slices      = horizon_minutes // slice_interval_min
    slice_shares  = total_shares / n_slices
    dt_fraction   = slice_interval_min / (6.5 * 60)  # fraction of trading day

    # Participation rate per slice
    slice_volume   = daily_volume_shares * dt_fraction
    partic_rate    = slice_shares / (slice_volume + 1e-9)

    # Market impact per slice (square-root impact model)
    impact_bps_per_slice = impact_coeff * np.sqrt(partic_rate) * 10_000

    # Spread cost (paid on every slice)
    spread_cost_bps = bid_ask_half_spread_bps

    # Total market impact cost (sum over all slices)
    total_impact_bps = impact_bps_per_slice * n_slices

    # Timing risk: random walk over the horizon
    # Vol per minute = daily_vol / sqrt(390)
    vol_per_min = daily_vol_pct * arrival_price / np.sqrt(6.5 * 60)
    timing_risk_usd = vol_per_min * np.sqrt(horizon_minutes) * total_shares

    # Implementation shortfall estimate
    total_cost_bps  = total_impact_bps + spread_cost_bps * n_slices
    total_cost_usd  = total_cost_bps / 10_000 * arrival_price * total_shares

    # Build execution schedule
    schedule = pd.DataFrame({
        "slice":     range(1, n_slices + 1),
        "shares":    [slice_shares] * n_slices,
        "partic_rate": [partic_rate] * n_slices,
        "impact_bps": [impact_bps_per_slice] * n_slices,
    })

    return {
        "n_slices":            n_slices,
        "slice_shares":        round(float(slice_shares), 0),
        "participation_rate":  round(float(partic_rate), 4),
        "impact_bps_total":    round(float(total_impact_bps), 2),
        "spread_cost_bps":     round(float(spread_cost_bps * n_slices), 2),
        "total_is_bps":        round(float(total_cost_bps), 2),
        "total_is_usd":        round(float(total_cost_usd), 2),
        "timing_risk_1sd_usd": round(float(timing_risk_usd), 2),
        "schedule":            schedule,
    }`,
    explanation:
      "The square-root market impact model (impact ∝ √(order_size/volume)) is the most empirically validated impact model — it captures the liquidity-provider's risk premium for absorbing large flow. TWAP spreads impact uniformly over time, reducing the peak participation rate, but accumulates timing risk proportional to the square root of the horizon. The Almgren-Chriss model optimises this trade-off; TWAP is the solution at zero risk aversion (minimum expected impact with no concern for timing variance).",
  },
  {
    id: "pyfin-20260612-b1-almgren-chriss-py",
    language: "python",
    tag: "finance",
    title: "Almgren-Chriss optimal liquidation — closed-form trajectory",
    code: `import numpy as np

def almgren_chriss_liquidation(
    X: float,              # initial position (shares)
    T: float,              # liquidation horizon (years)
    N: int,                # number of time steps
    sigma: float,          # daily price vol (fraction)
    eta: float,            # temporary impact coeff
    gamma: float,          # permanent impact coeff
    lam: float,            # risk aversion
    S0: float = 100.0,     # initial price
) -> dict:
    """
    Almgren-Chriss (2000): optimal liquidation minimises
    E[cost] + lambda * Var[cost].
    Optimal holding trajectory: x(t) = X * sinh(kappa*(T-t)) / sinh(kappa*T)
    kappa^2 = lambda * sigma^2 / eta  (if eta > 0)
    For kappa->0 (zero risk aversion): linear liquidation (TWAP).
    Cost estimate: E[IS] = gamma/2 * X^2 + eta*kappa*X^2/2/sinh(kappa*T)
    """
    dt     = T / N
    kappa2 = lam * (sigma * S0)**2 / (eta * S0)    # in price space
    kappa  = np.sqrt(max(kappa2, 0))

    times    = np.linspace(0, T, N + 1)
    if kappa < 1e-8:
        holdings = X * (1 - times / T)              # linear (TWAP)
    else:
        holdings = X * np.sinh(kappa * (T - times)) / np.sinh(kappa * T)

    trade_list = np.diff(-holdings)     # shares sold in each period (positive)

    # Impact cost estimate per trade: eta * (trade_size / dt)^2 * dt
    # (temporary impact: proportional to trade rate squared)
    trade_rates  = trade_list / dt
    impact_costs = eta * trade_rates**2 * dt / S0   # normalised to per share
    total_impact = float(impact_costs.sum())

    # Timing risk (std of execution price trajectory)
    timing_std = float(sigma * S0 * np.sqrt(dt) * np.sqrt(np.sum(holdings[1:]**2)))

    # Efficient frontier point: IS vs timing_risk
    expected_IS = total_impact + 0.5 * gamma * (X / S0)**2

    return {
        "times":          times.tolist(),
        "holdings":       holdings.round(2).tolist(),
        "trade_sizes":    trade_list.round(2).tolist(),
        "kappa":          round(float(kappa), 6),
        "expected_IS_bps": round(float(expected_IS * 10000), 2),
        "timing_std_usd":  round(float(timing_std), 2),
        "front_loading":   round(float(trade_list[0] / (X / N)), 4),   # 1.0 = TWAP
    }`,
    explanation:
      "The hyperbolic sinh trajectory front-loads selling when risk aversion lambda is high (kappa large): the first trade is larger than the TWAP slice, and subsequent trades taper off. This is optimal because early selling reduces the position that is exposed to adverse price moves during the remaining horizon. As lambda → 0, kappa → 0 and the trajectory converges to VWAP (linear), trading off all timing risk exposure to minimise expected impact cost.",
  },
  {
    id: "pyfin-20260612-b1-sofr-swap",
    language: "python",
    tag: "finance",
    title: "SOFR OIS swap pricing — floating leg via overnight compounding",
    code: `import numpy as np
from scipy.interpolate import interp1d

def sofr_ois_swap(
    fixed_rate: float,         # annual fixed rate (e.g. 0.053 for 5.3%)
    maturity_years: float,
    notional: float = 1_000_000,
    payment_freq: int = 1,     # annual payments (OIS is typically annual or at maturity)
    disc_curve: dict = None,   # {tenor: discount_factor}, e.g. {0.5: 0.975, ...}
    sofr_fwd_curve: dict = None,  # {tenor: SOFR forward rate}, annualised
) -> dict:
    """
    SOFR OIS (Overnight Index Swap):
    Fixed leg: fixed_rate * notional * tau * disc(T_i) per period
    Floating leg: compounded overnight SOFR rate ≈ forward SOFR * tau * disc(T_i)
    DV01: change in swap PV for 1bp parallel shift in all rates.
    """
    if disc_curve is None:
        # Flat 5% discount curve for illustration
        disc_curve = {t: np.exp(-0.05 * t) for t in np.arange(0.25, maturity_years + 0.01, 0.25)}
    if sofr_fwd_curve is None:
        sofr_fwd_curve = {t: 0.053 for t in np.arange(0.25, maturity_years + 0.01, 0.25)}

    disc_tenors  = sorted(disc_curve.keys())
    disc_factors = [disc_curve[t] for t in disc_tenors]
    sofr_tenors  = sorted(sofr_fwd_curve.keys())
    sofr_fwds    = [sofr_fwd_curve[t] for t in sofr_tenors]

    disc_interp = interp1d(disc_tenors, disc_factors, kind="cubic", fill_value="extrapolate")
    sofr_interp = interp1d(sofr_tenors, sofr_fwds,   kind="cubic", fill_value="extrapolate")

    dt   = 1.0 / payment_freq
    pvs  = {"fixed": 0.0, "float": 0.0}
    dv01 = 0.0

    t = dt
    while t <= maturity_years + 1e-9:
        df    = float(disc_interp(t))
        sofr  = float(sofr_interp(t))

        fixed_cf = fixed_rate * notional * dt * df
        float_cf = sofr      * notional * dt * df   # OIS ≈ forward SOFR

        pvs["fixed"] += fixed_cf
        pvs["float"] += float_cf

        # DV01: 1bp shift in fixed rate changes PV by -notional*dt*df per period
        dv01 += notional * dt * df / 10_000.0
        t += dt

    swap_pv   = pvs["float"] - pvs["fixed"]   # receiver swap (+ve if float > fixed)
    par_rate  = pvs["float"] / (dv01 * 10_000)  # par fixed rate (zero PV swap)

    return {
        "swap_pv":       round(float(swap_pv), 2),
        "fixed_leg_pv":  round(float(pvs["fixed"]), 2),
        "float_leg_pv":  round(float(pvs["float"]), 2),
        "dv01":          round(float(dv01), 2),
        "par_rate":      round(float(par_rate), 6),
        "fixed_rate":    fixed_rate,
        "maturity":      maturity_years,
        "notional":      notional,
    }`,
    explanation:
      "In an OIS swap, the floating leg pays the compounded overnight rate (SOFR for USD), which is risk-free and highly liquid post-LIBOR transition. The floating leg PV is approximated as forward_rate × tau × discount_factor at each payment date — this is exact for par swaps and very accurate for off-market swaps. DV01 (Dollar Value of a Basis Point) measures the P&L impact of a 1 basis point parallel shift in the fixed rate, equalling the annuity value of 1bp: sum of notional × dt × discount_factor.",
  },
  {
    id: "pyfin-20260612-b1-t-copula",
    language: "python",
    tag: "finance",
    title: "Student-t copula joint defaults — heavier tail correlation than Gaussian",
    code: `import numpy as np
from scipy.stats import t as student_t, norm
from scipy.linalg import cholesky

def t_copula_defaults(
    hazard_rates: np.ndarray,   # per-obligor annual hazard rates
    rho: float,                 # single-factor correlation
    nu: int,                    # degrees of freedom (nu -> inf = Gaussian)
    T: float,                   # horizon in years
    n_sims: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    Student-t copula for correlated defaults (Li 2000 extension).
    X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i, then transform via t-distribution.
    Default if t_{nu}^{-1}(Q_i) > U_i where U_i ~ t_nu(X_i).
    Heavier tails than Gaussian copula: more joint extreme events.
    Widely used post-2008 to capture 'tail dependence' in CDO modelling.
    """
    rng = np.random.default_rng(seed)
    n   = len(hazard_rates)

    # Marginal default probabilities
    surv_probs  = np.exp(-hazard_rates * T)
    def_probs   = 1.0 - surv_probs

    # t-copula threshold: Phi^{-1}(Q_i) in t_{nu} space
    thresholds  = student_t.ppf(def_probs, df=nu)

    # Simulate t-distributed random variables
    # X = Z / sqrt(chi2/nu), Z ~ N(0, R), chi2 ~ chi^2(nu)
    chi2   = rng.chisquare(nu, size=n_sims) / nu   # (n_sims,)
    M      = rng.standard_normal(n_sims)            # common factor
    Z      = rng.standard_normal((n_sims, n))       # idiosyncratic

    Xn     = np.sqrt(rho) * M[:, None] + np.sqrt(1 - rho) * Z   # (n_sims, n)
    Xt     = Xn / np.sqrt(chi2[:, None])    # t-distributed (df = nu)

    defaults   = (Xt < thresholds[None, :]).astype(float)
    n_defaults = defaults.sum(axis=1)
    loss_rate  = n_defaults / n

    # Tranche loss (equity 0-3%, mezzanine 3-7%, senior 7-10%)
    tranches = [(0.0, 0.03), (0.03, 0.07), (0.07, 0.10), (0.10, 1.0)]
    tranche_el = {}
    for lo, hi in tranches:
        tr_loss = np.clip(loss_rate - lo, 0, hi - lo) / (hi - lo)
        tranche_el[f"{int(lo*100)}-{int(hi*100)}%"] = round(float(tr_loss.mean()), 4)

    return {
        "expected_loss_pct":    round(float(loss_rate.mean() * 100), 4),
        "loss_99th_pct":        round(float(np.percentile(loss_rate, 99) * 100), 4),
        "tranche_expected_loss": tranche_el,
        "tail_dependence_upper": round(float(2 * student_t.sf(np.sqrt((nu+1)*(1-rho)/(1+rho)), df=nu+1)), 4),
        "rho":                  rho,
        "nu":                   nu,
    }`,
    explanation:
      "The Student-t copula has positive tail dependence — the probability that two obligors both default simultaneously remains non-zero even as their individual default probabilities become small — whereas the Gaussian copula has zero tail dependence. This property is controlled by the degrees of freedom nu: as nu → ∞ the t-copula converges to Gaussian, and small nu (3-5) produces the heavy joint tails observed empirically in credit crises. The upper tail dependence coefficient quantifies exactly this joint extreme probability.",
  },
  {
    id: "pyfin-20260612-b1-cliquet",
    language: "python",
    tag: "finance",
    title: "Cliquet (ratchet) option — sum of capped/floored forward starts",
    code: `import numpy as np
from scipy.stats import norm

def cliquet_mc(
    S0: float,
    r: float,
    sigma: float,          # assumes flat vol for each period
    T: float,              # total maturity
    n_periods: int = 4,    # e.g. quarterly resets
    local_floor: float = -0.10,   # per-period floor (e.g. -10%)
    local_cap: float   = 0.15,    # per-period cap (e.g. +15%)
    global_floor: float = 0.0,    # total return floor
    notional: float = 1_000_000,
    n_paths: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    Cliquet option: sum of per-period returns, each floored at local_floor
    and capped at local_cap. The total is also floored at global_floor.
    Payoff: max(sum_i clip(R_i, floor, cap), global_floor) * notional.
    Periodically resetting strikes make cliquets path-dependent (no closed form).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_periods
    disc = np.exp(-r * T)

    drift = (r - 0.5 * sigma**2) * dt
    vol   = sigma * np.sqrt(dt)

    payoffs = np.zeros(n_paths)

    for p in range(n_paths):
        total_return = 0.0
        S = S0
        for _ in range(n_periods):
            Z    = rng.standard_normal()
            S_new = S * np.exp(drift + vol * Z)
            period_ret = (S_new - S) / S       # periodic return
            clipped    = np.clip(period_ret, local_floor, local_cap)
            total_return += clipped
            S = S_new

        payoffs[p] = max(total_return, global_floor) * notional

    price = disc * payoffs.mean()
    se    = disc * payoffs.std(ddof=1) / np.sqrt(n_paths)

    # Decomposition: fraction of periods where cap/floor was hit
    # (requires per-path tracking — simplified here to analytical approximation)
    Z_cap   = (np.log(1 + local_cap)   - drift) / vol
    Z_floor = (np.log(1 + local_floor) - drift) / vol
    p_cap   = norm.sf(Z_cap)          # probability of hitting cap in one period
    p_floor = 1.0 - norm.sf(Z_floor)  # probability of hitting floor

    return {
        "price":        round(float(price), 2),
        "se":           round(float(se), 2),
        "p_cap_hit":    round(float(p_cap), 4),
        "p_floor_hit":  round(float(p_floor), 4),
        "n_periods":    n_periods,
        "local_floor":  local_floor,
        "local_cap":    local_cap,
    }`,
    explanation:
      "Cliquets are path-dependent because the strike resets at each period — the payoff depends on the sequence of per-period returns, not just the terminal spot. The local floor and cap create an asymmetric payoff that is expensive to replicate: the cap sells OTM call vol (cheap) but the floor buys OTM put vol (expensive), and the interaction between periods means the global floor creates correlation risk across periods. Locally-capped cliquets are sensitive to forward smile dynamics, requiring a stochastic local vol model for accurate pricing.",
  },
  {
    id: "pyfin-20260612-b1-nearest-psd",
    language: "python",
    tag: "finance",
    title: "Nearest positive semi-definite correlation matrix — Higham (2002) algorithm",
    code: `import numpy as np

def nearest_psd_correlation(C: np.ndarray, n_iter: int = 200, tol: float = 1e-8) -> dict:
    """
    Higham (2002) alternating projections algorithm for the nearest PSD
    correlation matrix (diagonal = 1, off-diagonal = correlations).
    Two projections:
      P_S: project onto symmetric matrices with unit diagonal (set diag to 1)
      P_U: project onto symmetric PSD matrices (clip negative eigenvalues to 0)
    Iterating P_U(P_S(.)) converges to the nearest PSD correlation matrix
    in the Frobenius norm sense.
    """
    n    = C.shape[0]
    X    = C.copy()
    Y    = C.copy()
    dS   = np.zeros_like(C)   # Dykstra correction

    prev_norm = np.inf
    for iteration in range(n_iter):
        # P_S: project Y - dS onto unit-diagonal symmetric matrices
        R       = Y - dS
        R       = 0.5 * (R + R.T)      # symmetrise
        np.fill_diagonal(R, 1.0)       # force unit diagonal

        # P_U: project R onto PSD (clip negative eigenvalues)
        eigvals, eigvecs = np.linalg.eigh(R)
        eigvals_clipped  = np.maximum(eigvals, 0)
        X = eigvecs @ np.diag(eigvals_clipped) @ eigvecs.T

        # Dykstra correction: accumulated residual
        dS   = X - R
        Y    = X.copy()
        np.fill_diagonal(Y, 1.0)

        # Convergence: Frobenius norm of change
        frob_diff = np.linalg.norm(C - X, "fro")
        if abs(frob_diff - prev_norm) < tol:
            break
        prev_norm = frob_diff

    # Ensure exactly unit diagonal (rounding cleanup)
    np.fill_diagonal(X, 1.0)
    X = 0.5 * (X + X.T)

    min_eig = float(np.linalg.eigvalsh(X).min())
    return {
        "psd_matrix":      X,
        "frobenius_dist":  round(float(np.linalg.norm(C - X, "fro")), 6),
        "min_eigenvalue":  round(float(min_eig), 8),
        "is_psd":          bool(min_eig >= -1e-8),
        "n_iter":          iteration + 1,
        "n_assets":        n,
    }`,
    explanation:
      "Correlation matrices can become non-positive-semi-definite when estimated from overlapping windows, filtered from sparse data, or manually adjusted by risk managers. A non-PSD correlation matrix has negative eigenvalues, which produce imaginary Cholesky factors and make correlated simulation impossible. Higham's algorithm finds the nearest PSD correlation matrix in the Frobenius norm by alternating between two convex projections — each projection is feasible (the fixed points of P_S are symmetric unit-diagonal matrices; the fixed points of P_U are PSD matrices), and the intersection is the constraint set.",
  },
];
