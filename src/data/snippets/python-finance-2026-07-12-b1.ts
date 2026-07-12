import { Snippet } from "./types";

export const pythonFinanceSnippets20260712B1: Snippet[] = [
  {
    id: "pyfin-20260712-b1-garch11-mle",
    language: "python",
    title: "GARCH(1,1) MLE Estimation from Scratch",
    tag: "risk",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_loglik(params, returns):
    """
    Negative log-likelihood for GARCH(1,1):
    h_t = omega + alpha*eps_{t-1}^2 + beta*h_{t-1}
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10  # stationarity constraint
    n   = len(returns)
    h   = np.var(returns)   # initialise with sample variance
    llik = 0.0
    for r in returns:
        llik += -0.5 * (np.log(h) + r**2 / h)
        h = omega + alpha * r**2 + beta * h
    return -llik  # return negative (minimise)

def fit_garch11(returns):
    """Fit GARCH(1,1) via MLE; returns (omega, alpha, beta, h_last)."""
    # Initial guess: omega small, alpha=0.1, beta=0.85
    x0 = [1e-6, 0.10, 0.85]
    bounds = [(1e-10, None), (0, 0.999), (0, 0.999)]
    result = minimize(garch11_loglik, x0, args=(returns,),
                      bounds=bounds, method='L-BFGS-B')
    omega, alpha, beta = result.x
    # Compute terminal conditional variance
    h = np.var(returns)
    for r in returns:
        h = omega + alpha * r**2 + beta * h
    return omega, alpha, beta, h

# Synthetic daily returns
rng     = np.random.default_rng(42)
eps     = rng.standard_normal(1000)
returns = np.zeros(1000)
h       = 1e-4
for i in range(1000):
    returns[i] = np.sqrt(h) * eps[i]
    h = 5e-7 + 0.08 * returns[i]**2 + 0.90 * h

omega, alpha, beta, h_T = fit_garch11(returns)
print(f"omega={omega:.2e}  alpha={alpha:.4f}  beta={beta:.4f}")
print(f"Persistence: {alpha+beta:.4f}")
print(f"Unconditional vol: {np.sqrt(omega/(1-alpha-beta))*np.sqrt(252)*100:.2f}% p.a.")`,
    explanation:
      "GARCH(1,1) captures volatility clustering: today's variance depends on yesterday's squared shock (alpha) and yesterday's variance (beta). Persistence = alpha + beta < 1 ensures stationarity; values near 1 (typical in equities ~0.97) mean shocks decay slowly. MLE maximises the joint normal density conditional on the GARCH variance path. The unconditional variance is omega/(1−alpha−beta), the long-run mean to which h_t reverts.",
  },
  {
    id: "pyfin-20260712-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Vol Monte Carlo Pricer",
    tag: "derivatives",
    code: `import numpy as np

def heston_call_mc(
    S0, K, r, T,
    v0,       # initial variance
    kappa,    # mean-reversion speed
    theta,    # long-run variance
    sigma_v,  # vol of vol
    rho,      # correlation dW_S dW_v
    N=252,    # time steps
    M=100_000,# paths
    seed=42
):
    """
    Heston (1993) stochastic vol model via Euler discretisation.
    dS = r*S*dt + sqrt(v)*S*dW1
    dv = kappa*(theta-v)*dt + sigma_v*sqrt(v)*dW2
    corr(dW1, dW2) = rho
    """
    rng   = np.random.default_rng(seed)
    dt    = T / N
    sqdt  = np.sqrt(dt)
    disc  = np.exp(-r * T)

    S = np.full(M, S0)
    v = np.full(M, v0)

    for _ in range(N):
        Z1 = rng.standard_normal(M)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * rng.standard_normal(M)

        v_pos = np.maximum(v, 0)  # full truncation scheme
        S *= np.exp((r - 0.5 * v_pos) * dt + np.sqrt(v_pos) * sqdt * Z1)
        v  = v_pos + kappa * (theta - v_pos) * dt + sigma_v * np.sqrt(v_pos) * sqdt * Z2
        v  = np.maximum(v, 0)

    payoff = np.maximum(S - K, 0)
    price  = disc * payoff.mean()
    se     = disc * payoff.std() / np.sqrt(M)
    return price, se

price, se = heston_call_mc(
    S0=100, K=105, r=0.04, T=1.0,
    v0=0.04, kappa=2.0, theta=0.04,
    sigma_v=0.3, rho=-0.7
)
print(f"Heston call: {price:.4f} ± {1.96*se:.4f} (95% CI)")`,
    explanation:
      "The Heston model adds mean-reverting stochastic variance to GBM. The correlation ρ < 0 produces the observed volatility skew: when S falls, v rises (negative ρ), pushing implied vol up for lower strikes. Full truncation (max(v,0)) prevents negative variances from Euler discretisation. The Heston model has a semi-analytic formula via Fourier inversion (Carr-Madan), but MC is needed for path-dependent payoffs (barrier, Asian, cliquet).",
  },
  {
    id: "pyfin-20260712-b1-sabr-calib",
    language: "python",
    title: "SABR Model Calibration (Hagan Formula)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan et al. (2002) SABR lognormal implied vol approximation.
    F: forward, K: strike, T: time to expiry
    alpha: vol level, beta: CEV exponent (0=normal, 1=lognormal)
    rho: corr(dF,dalpha), nu: vol of vol
    """
    if abs(F - K) < 1e-8:  # ATM formula
        FK_mid  = F
        z       = nu / alpha * FK_mid**(beta - 1) * (F - K + 1e-10)
        term1   = alpha / FK_mid**(1 - beta)
        term2   = 1 + ((1-beta)**2/24 * alpha**2/FK_mid**(2-2*beta)
                       + rho*beta*nu*alpha/(4*FK_mid**(1-beta))
                       + (2-3*rho**2)/24 * nu**2) * T
        return term1 * term2

    log_FK  = np.log(F / K)
    FK_mid  = np.sqrt(F * K)
    z       = nu / alpha * FK_mid**(1-beta) * log_FK
    x_z     = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    numer = alpha * (1 + ((1-beta)**2/24 * alpha**2/FK_mid**(2-2*beta)
                         + rho*beta*nu*alpha/(4*FK_mid**(1-beta))
                         + (2-3*rho**2)/24 * nu**2) * T)
    denom = FK_mid**(1-beta) * (1 + (1-beta)**2/24 * log_FK**2
                                + (1-beta)**4/1920 * log_FK**4) * x_z / z
    return numer / denom

def calibrate_sabr(F, T, strikes, market_vols, beta=0.5):
    def obj(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        fitted = [sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes]
        return np.sum((np.array(fitted) - market_vols)**2)
    x0 = [0.3, -0.3, 0.5]
    bounds = [(0.001, 5), (-0.999, 0.999), (0.001, 10)]
    res = minimize(obj, x0, bounds=bounds, method='L-BFGS-B')
    return res.x  # (alpha, rho, nu)

# Example
F  = 100.0; T = 0.5
Ks = np.array([85, 90, 95, 100, 105, 110, 115])
mv = np.array([0.28, 0.25, 0.22, 0.20, 0.21, 0.23, 0.26])
alpha, rho, nu = calibrate_sabr(F, T, Ks, mv)
print(f"SABR: alpha={alpha:.4f}, rho={rho:.4f}, nu={nu:.4f}")`,
    explanation:
      "SABR (Stochastic Alpha Beta Rho) is the industry-standard model for interest rate and FX vol surfaces. The Hagan approximation gives a closed-form implied vol in terms of forward and strike, calibrated by fitting alpha (vol level), rho (skew), and nu (vol of vol) to market smiles. Beta controls the backbone: β=1 is lognormal (equity-like), β=0 is normal (rate-like). SABR is the dominant model for swaption and cap/floor vol cube calibration.",
  },
  {
    id: "pyfin-20260712-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading (Dynamic Hedge Ratio)",
    tag: "portfolio",
    code: `import numpy as np

def kalman_filter_hedge_ratio(y, x, delta=1e-4, R_noise=1e-3):
    """
    Online Kalman filter to estimate time-varying hedge ratio beta_t.
    State: [beta_t, alpha_t] (slope + intercept of y ~ alpha + beta*x)
    y: price series to hedge, x: hedge instrument price series
    delta: process noise (higher = faster adaptation)
    """
    n = len(y)
    # State vector: [beta, alpha]
    state  = np.zeros(2)
    P      = np.eye(2) * 1.0      # state covariance
    R      = R_noise               # observation noise
    Q      = np.eye(2) * delta     # process noise (random walk on betas)

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spreads= np.zeros(n)

    for t in range(n):
        xt = np.array([x[t], 1.0])  # observation matrix [x, 1]

        # Predict
        P = P + Q

        # Update (Kalman gain)
        S  = xt @ P @ xt + R
        K  = P @ xt / S          # Kalman gain
        e  = y[t] - xt @ state   # innovation
        state = state + K * e
        P  = (np.eye(2) - np.outer(K, xt)) @ P

        betas[t]   = state[0]
        alphas[t]  = state[1]
        spreads[t] = y[t] - state[0]*x[t] - state[1]

    return betas, alphas, spreads

rng = np.random.default_rng(42)
n   = 500
x   = np.cumsum(rng.standard_normal(n)) + 100
y   = 1.5 * x + 5 + np.cumsum(rng.normal(0, 0.05, n))   # cointegrated pair

betas, alphas, spreads = kalman_filter_hedge_ratio(y, x)
spread_z = (spreads - spreads.mean()) / spreads.std()
long_signals  = spread_z < -2.0
short_signals = spread_z > +2.0
print(f"Mean beta: {betas.mean():.3f}, Spread mean: {spreads.mean():.3f}")`,
    explanation:
      "The Kalman filter treats the hedge ratio as a latent state that evolves via a random walk, updating it online as new price observations arrive. The innovation e = y − β̂x is the spread, and the Kalman gain K weights how much to update. This is superior to rolling OLS: it is optimal (minimum-variance) under Gaussian noise and adapts the hedge ratio continuously without choosing a window. The z-score of the spread drives entry/exit signals.",
  },
  {
    id: "pyfin-20260712-b1-regime-hmm",
    language: "python",
    title: "Hidden Markov Regime-Switching Model (Baum-Welch)",
    tag: "portfolio",
    code: `import numpy as np
from scipy.stats import norm

def hmm_em(returns, n_states=2, n_iter=50, seed=42):
    """
    Gaussian HMM via EM (Baum-Welch) for regime detection.
    Returns: (means, stds, transition_matrix, state_probs)
    """
    rng = np.random.default_rng(seed)
    T   = len(returns)

    # Initialise parameters
    means = rng.normal(0, 0.01, n_states)
    stds  = np.abs(rng.normal(0.01, 0.005, n_states)) + 0.005
    A     = np.ones((n_states, n_states)) / n_states   # transition matrix
    pi    = np.ones(n_states) / n_states               # initial state probs

    for _ in range(n_iter):
        # E-step: forward-backward
        B = np.zeros((T, n_states))  # emission probs
        for k in range(n_states):
            B[:, k] = norm.pdf(returns, means[k], stds[k])

        # Forward pass (scaled)
        alpha = np.zeros((T, n_states))
        scale = np.zeros(T)
        alpha[0] = pi * B[0]
        scale[0] = alpha[0].sum()
        alpha[0] /= scale[0]
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            scale[t] = alpha[t].sum()
            alpha[t] /= scale[t]

        # Backward pass (scaled)
        beta = np.ones((T, n_states))
        for t in range(T-2, -1, -1):
            beta[t] = (A * B[t+1] * beta[t+1]).sum(axis=1)
            beta[t] /= beta[t].sum()

        # Posteriors
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)

        # M-step: update parameters
        for k in range(n_states):
            w      = gamma[:, k]
            means[k] = (w * returns).sum() / w.sum()
            stds[k]  = np.sqrt((w * (returns - means[k])**2).sum() / w.sum())
        for i in range(n_states):
            for j in range(n_states):
                xi_ij = sum(alpha[t,i]*A[i,j]*B[t+1,j]*beta[t+1,j]
                            for t in range(T-1))
                A[i, j] = xi_ij
            A[i] /= A[i].sum()

    return means, stds, A, gamma

rng  = np.random.default_rng(42)
bull = rng.normal(0.001, 0.01, 400)
bear = rng.normal(-0.002, 0.025, 200)
rets = np.concatenate([bull, bear, bull])

means, stds, A, probs = hmm_em(rets, n_states=2)
print(f"Regime 0: mu={means[0]*252:.1%} vol={stds[0]*np.sqrt(252):.1%}")
print(f"Regime 1: mu={means[1]*252:.1%} vol={stds[1]*np.sqrt(252):.1%}")`,
    explanation:
      "A Gaussian HMM assigns each observation to one of K latent regimes, learning transition probabilities (A) and emission distributions (μ_k, σ_k) via Baum-Welch EM. The forward-backward algorithm computes posterior state probabilities. Regime models capture the empirical observation that equity returns switch between low-vol bull and high-vol bear regimes. They outperform single-distribution models for tail risk estimation and regime-conditional position sizing.",
  },
  {
    id: "pyfin-20260712-b1-dupire-local-vol",
    language: "python",
    title: "Dupire Local Volatility from Implied Vol Surface",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(strikes, maturities, iv_surface, S0, r, q=0.0):
    """
    Dupire (1994): local vol sigma_L(K,T) extracted from implied vol surface.
    Uses finite differences on the implied vol surface.
    iv_surface[i,j]: implied vol for maturity maturities[i], strike strikes[j]
    """
    T = np.array(maturities)
    K = np.array(strikes)

    # Smooth surface via bivariate spline interpolation
    spline   = RectBivariateSpline(T, K, iv_surface, kx=3, ky=3)

    def w(t, k):
        """Total implied variance: w = sigma_imp^2 * t"""
        return spline(t, k, grid=False)**2 * t

    # Numerical partial derivatives
    dT  = 0.001; dK = 0.5

    def local_vol_at(t, k):
        F = S0 * np.exp((r - q) * t)
        y = np.log(k / F)   # log-moneyness

        # dw/dT (calendar spread)
        dw_dT = (w(t+dT, k) - w(t-dT, k)) / (2*dT)
        if dw_dT <= 0:
            return np.nan   # calendar arb

        wt = w(t, k)
        # dw/dy and d2w/dy2 (smile curvature)
        dw_dy   = (w(t, k+dK) - w(t, k-dK)) / (2*dK)   # note: dy ≈ dK/K
        d2w_dy2 = (w(t, k+dK) - 2*wt + w(t, k-dK)) / (dK**2)

        denom = (1 - y/wt * dw_dy
                 + 0.25*(-0.25 - 1/wt + y**2/wt**2) * dw_dy**2
                 + 0.5 * d2w_dy2)
        if denom <= 0:
            return np.nan
        return np.sqrt(dw_dT / denom)

    # Evaluate on grid
    lv_grid = np.zeros((len(T), len(K)))
    for i, t in enumerate(T):
        for j, k in enumerate(K):
            lv_grid[i, j] = local_vol_at(t, k)
    return lv_grid

# Example surface (simplified)
T_grid = [0.25, 0.5, 1.0, 2.0]
K_grid = [80, 90, 100, 110, 120]
iv_surf = np.array([
    [0.28, 0.23, 0.20, 0.21, 0.24],
    [0.26, 0.22, 0.195, 0.20, 0.23],
    [0.24, 0.21, 0.19, 0.195, 0.22],
    [0.22, 0.20, 0.185, 0.19, 0.21],
])
lv = dupire_local_vol(K_grid, T_grid, iv_surf, S0=100, r=0.04)
print("Local vol surface shape:", lv.shape)`,
    explanation:
      "Dupire's equation inverts the Black-Scholes formula: given a complete implied vol surface σ_imp(K,T), the unique local vol function σ_L(K,T) = sqrt(∂w/∂T / g(w,y)) exactly reprices all European options. The denominator g involves smile slope and curvature — large curvature inflates local vol. Local vol models are complete (one factor), fit the initial surface exactly, but generate flat forward skews that underestimate the dynamics of the smile. Widely used as a benchmark for exotics pricing.",
  },
  {
    id: "pyfin-20260712-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Options",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_importance_sampling(S0, K, r, sigma, T,
                                 M=100_000, seed=42):
    """
    Importance sampling: shift the sampling distribution toward the
    exercise region (S_T > K) to improve deep OTM Monte Carlo accuracy.
    Change of measure: sample from N(mu_star, 1) instead of N(0,1).
    """
    rng    = np.random.default_rng(seed)
    disc   = np.exp(-r * T)
    logS_adj = np.log(S0) + (r - 0.5*sigma**2)*T
    sig_sqT  = sigma * np.sqrt(T)

    # mu* that centres sampling distribution at the exercise boundary
    mu_star  = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / sig_sqT

    # Sample from shifted distribution
    Z     = rng.standard_normal(M) + mu_star
    S_T   = np.exp(logS_adj + sig_sqT * Z)
    payoff = np.maximum(S_T - K, 0)

    # Likelihood ratio (Radon-Nikodym derivative)
    lr    = np.exp(-mu_star * Z + 0.5 * mu_star**2)
    IS_est = disc * np.mean(payoff * lr)
    IS_se  = disc * np.std(payoff * lr) / np.sqrt(M)

    # Standard MC for comparison
    Z2    = rng.standard_normal(M)
    S_T2  = np.exp(logS_adj + sig_sqT * Z2)
    raw_est = disc * np.mean(np.maximum(S_T2 - K, 0))

    return IS_est, IS_se, raw_est

# Deep OTM: S0=100, K=130 (30% OTM), T=1M
IS, se, raw = bs_call_importance_sampling(100, 130, 0.04, 0.20, 1/12, M=10_000)
print(f"IS estimate: {IS:.6f} ± {1.96*se:.6f}")
print(f"Raw MC:      {raw:.6f}  (much higher variance for rare events)")`,
    explanation:
      "Standard MC is inefficient for deep OTM options: most paths don't exercise, contributing zero to the average. Importance sampling shifts the Gaussian by μ* so paths land near the exercise region more often. The likelihood ratio corrects for the change of measure, preserving expectation under the original measure. For a 3-sigma OTM event, importance sampling reduces variance by 100–1000×. The same technique applies to credit default simulation and CVA for rare counterparty default.",
  },
  {
    id: "pyfin-20260712-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Portfolio Default Correlation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_default_mc(
    n_obligors,   # number of names in portfolio
    hazard_rates, # annual default intensity per name
    T,            # horizon (years)
    rho,          # pairwise asset correlation (single-factor)
    n_sims=100_000,
    seed=42
):
    """
    Li (2000) Gaussian copula model for correlated defaults.
    Single systematic factor Z drives correlated credit events.
    """
    rng = np.random.default_rng(seed)

    # Default thresholds: P(default in [0,T]) per name
    pd    = 1 - np.exp(-hazard_rates * T)
    thresholds = norm.ppf(pd)  # inverse normal of PD

    # Simulate systematic + idiosyncratic factors
    Z  = rng.standard_normal(n_sims)              # common factor
    eps= rng.standard_normal((n_sims, n_obligors)) # idiosyncratic

    # Asset return for obligor i: X_i = sqrt(rho)*Z + sqrt(1-rho)*eps_i
    X  = (np.sqrt(rho) * Z[:, None]
          + np.sqrt(1 - rho) * eps)

    # Default if X_i < threshold_i
    defaults = X < thresholds[None, :]   # (n_sims, n_obligors)

    loss_distribution = defaults.sum(axis=1)  # count of defaults per sim

    # Tranche losses (e.g. 0–3%, 3–6%, 6–9%)
    portfolio_loss_rate = loss_distribution / n_obligors
    return portfolio_loss_rate

hazards = np.full(125, 0.01)  # 1% annual default intensity (IG portfolio)
losses  = gaussian_copula_default_mc(125, hazards, T=5.0, rho=0.25)

print(f"Expected defaults: {losses.mean()*125:.2f}")
print(f"99th %ile defaults: {np.percentile(losses, 99)*125:.1f}")
print(f"Prob >5% default: {(losses>0.05).mean():.4f}")`,
    explanation:
      "The Gaussian copula (Li 2000) models joint defaults via a latent asset-return model: each obligor defaults when its asset return falls below a threshold implied by its PD. The common factor Z introduces correlation — high Z scenarios drive cluster defaults. This single-factor model was the engine behind CDO pricing pre-2008; its failure was that it underestimated tail dependence (Gaussian copula has zero tail dependence, unlike Student-t or Clayton copulas).",
  },
  {
    id: "pyfin-20260712-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Regression",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def fama_french_regression(portfolio_returns, mkt_rf, smb, hml, rf):
    """
    FF3 model: R_i - Rf = alpha + beta_mkt*(Rm-Rf) + beta_smb*SMB + beta_hml*HML + eps
    portfolio_returns: Series of portfolio excess returns
    mkt_rf, smb, hml: factor return series
    Returns: (alpha, betas, t-stats, R-squared)
    """
    excess_ret = portfolio_returns - rf

    X = np.column_stack([mkt_rf - rf, smb, hml])
    X_aug = np.column_stack([np.ones(len(X)), X])   # add intercept

    # OLS: beta = (X'X)^{-1} X'y
    betas = np.linalg.lstsq(X_aug, excess_ret, rcond=None)[0]
    alpha, b_mkt, b_smb, b_hml = betas

    # Residuals and standard errors
    y_hat = X_aug @ betas
    resid = excess_ret - y_hat
    n, k  = len(excess_ret), 4
    sigma2= resid @ resid / (n - k)
    var_b = sigma2 * np.linalg.inv(X_aug.T @ X_aug)
    se    = np.sqrt(np.diag(var_b))
    t_stats = betas / se

    ss_tot = np.sum((excess_ret - excess_ret.mean())**2)
    r2     = 1 - resid @ resid / ss_tot

    return {
        'alpha': alpha,        'alpha_t': t_stats[0],
        'beta_mkt': b_mkt,    'beta_smb': b_smb,   'beta_hml': b_hml,
        't_mkt': t_stats[1],  't_smb': t_stats[2], 't_hml': t_stats[3],
        'R2': r2,
    }

# Synthetic factor returns
rng = np.random.default_rng(42)
n   = 252
mkt = rng.normal(0.0006, 0.01, n)
smb = rng.normal(0.0002, 0.006, n)
hml = rng.normal(0.0001, 0.006, n)
rf  = np.full(n, 0.0001)
# Small-cap value portfolio: high SMB and HML loading
port = 0.6*mkt + 0.4*smb + 0.3*hml + 0.0003 + rng.normal(0, 0.008, n)

result = fama_french_regression(port, mkt, smb, hml, rf)
print(f"Alpha: {result['alpha']*252:.2%} p.a. (t={result['alpha_t']:.2f})")
print(f"Market beta: {result['beta_mkt']:.3f} (t={result['t_mkt']:.2f})")
print(f"SMB:  {result['beta_smb']:.3f}  HML: {result['beta_hml']:.3f}")
print(f"R²: {result['R2']:.3f}")`,
    explanation:
      "Fama-French 3-factor model extends CAPM with size (SMB=small-minus-big) and value (HML=high-minus-low book-to-market) factors. Alpha is the risk-adjusted return unexplained by systematic factors. SMB > 0 indicates small-cap tilts; HML > 0 indicates value tilts. High R² means most return variation is systematic (factor-driven); low R² suggests unique stock selection or sector bets. Used for performance attribution, risk budgeting, and factor portfolio construction.",
  },
  {
    id: "pyfin-20260712-b1-antithetic-mc",
    language: "python",
    title: "Antithetic Variates Monte Carlo Variance Reduction",
    tag: "derivatives",
    code: `import numpy as np

def bs_call_antithetic(S0, K, r, sigma, T, M=50_000, seed=42):
    """
    Antithetic variates: for each standard normal Z, also use -Z.
    Cov(f(Z), f(-Z)) < 0 → variance of average < variance of individual.
    Requires M to be even.
    """
    rng    = np.random.default_rng(seed)
    disc   = np.exp(-r * T)
    logS   = np.log(S0) + (r - 0.5*sigma**2)*T
    sigT   = sigma * np.sqrt(T)

    # Half the paths: sample M/2 normals, mirror to get the other half
    Z      = rng.standard_normal(M // 2)
    Z_anti = -Z

    def payoff(Z_):
        S_T = np.exp(logS + sigT * Z_)
        return np.maximum(S_T - K, 0)

    payoffs_raw  = payoff(Z)
    payoffs_anti = payoff(Z_anti)
    avg_payoffs  = (payoffs_raw + payoffs_anti) / 2   # pair-wise average

    price = disc * avg_payoffs.mean()
    se    = disc * avg_payoffs.std() / np.sqrt(M // 2)

    # Compare with naive MC using same budget
    Z_naive = rng.standard_normal(M)
    price_naive = disc * payoff(Z_naive).mean()
    se_naive = disc * payoff(Z_naive).std() / np.sqrt(M)

    return price, se, price_naive, se_naive

p, se, p0, se0 = bs_call_antithetic(100, 105, 0.04, 0.20, 1.0, M=20_000)
print(f"Antithetic:  {p:.4f} ± {1.96*se:.4f}")
print(f"Naive MC:    {p0:.4f} ± {1.96*se0:.4f}")
print(f"Variance reduction: {(se0/se)**2:.2f}×")`,
    explanation:
      "Antithetic variates exploit the negative correlation between f(Z) and f(-Z): when Z generates a high stock price, -Z generates a low one, so their payoffs are negatively correlated. The variance of the pairwise average is Var(f(Z))/2 + Cov(f(Z),f(-Z))/2, which is less than Var(f(Z))/2 when covariance is negative. For call options, this typically reduces variance by 50–80%, equivalent to doubling the sample size at no extra cost.",
  },
  {
    id: "pyfin-20260712-b1-pandas-multiindex",
    language: "python",
    title: "Pandas Multi-Index OHLCV Portfolio Analytics",
    tag: "portfolio",
    code: `import pandas as pd
import numpy as np

# Build multi-index DataFrame: (date, ticker) → OHLCV
rng     = np.random.default_rng(42)
dates   = pd.date_range('2024-01-01', periods=252, freq='B')
tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']

idx   = pd.MultiIndex.from_product([dates, tickers], names=['date', 'ticker'])
closes= 100 + np.cumsum(rng.normal(0.0005, 0.015, len(idx))).reshape(252, 4)
vols  = rng.integers(1_000_000, 10_000_000, len(idx))

df = pd.DataFrame({
    'close': closes.flatten(),
    'volume': vols,
}, index=idx)

# Cross-sectional daily returns
df['ret'] = df.groupby('ticker')['close'].pct_change()

# Rolling 21-day volatility per ticker (annualised)
df['rvol21'] = (df.groupby('ticker')['ret']
                .transform(lambda x: x.rolling(21).std() * np.sqrt(252)))

# Pivot: dates × tickers → close prices
close_pivot = df['close'].unstack('ticker')   # shape: (252, 4)

# Correlation matrix of returns (latest 60 days)
ret_pivot = df['ret'].unstack('ticker').dropna()
corr_60d  = ret_pivot.tail(60).corr()
print(corr_60d.round(3))

# Volume-weighted average price per day across tickers
df['notional'] = df['close'] * df['volume']
vwap_per_day = (df.groupby('date').apply(
    lambda g: (g['notional'].sum() / g['volume'].sum())))
print("\\nVWAP (portfolio-level, last 5 days):")
print(vwap_per_day.tail())`,
    explanation:
      "Pandas MultiIndex stores panel data (time × ticker) efficiently in a single DataFrame. groupby('ticker') applies rolling/cumulative operations independently per asset without loops. unstack() pivots the inner level to columns, enabling vectorised cross-sectional operations (correlation, regression). This representation is standard for risk systems, factor models, and backtests that handle hundreds of instruments simultaneously.",
  },
  {
    id: "pyfin-20260712-b1-pca-risk",
    language: "python",
    title: "PCA Risk Decomposition of Fixed-Income Portfolio",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def pca_risk_decomp(returns_matrix, n_components=3):
    """
    PCA decomposition of bond return covariance matrix.
    Identifies the key risk factors driving portfolio P&L.
    returns_matrix: (T, N) array of N instrument returns
    """
    T, N = returns_matrix.shape

    # Standardise and compute covariance
    r_demeaned = returns_matrix - returns_matrix.mean(axis=0)
    Sigma = r_demeaned.T @ r_demeaned / (T - 1)

    # Eigen-decomposition (sorted descending by eigenvalue)
    eigvals, eigvecs = np.linalg.eigh(Sigma)
    order  = np.argsort(eigvals)[::-1]
    eigvals, eigvecs = eigvals[order], eigvecs[:, order]

    # Explained variance
    explained = eigvals[:n_components] / eigvals.sum()
    cumulative = np.cumsum(explained)

    # Factor loadings (principal components)
    loadings = eigvecs[:, :n_components]

    # Factor returns (projections)
    factor_rets = r_demeaned @ loadings   # (T, n_components)

    # Reconstruct portfolio variance from factors
    port_weights = np.ones(N) / N
    total_var = port_weights @ Sigma @ port_weights
    factor_contributions = []
    for i in range(n_components):
        fi   = loadings[:, i]
        w_fi = port_weights @ fi
        factor_contributions.append(w_fi**2 * eigvals[i] / total_var)

    return {
        'eigenvalues': eigvals[:n_components],
        'explained_variance': explained,
        'cumulative_explained': cumulative,
        'loadings': loadings,        # (N, n_components): each col is a PC
        'factor_returns': factor_rets,
        'factor_var_contrib': np.array(factor_contributions),
    }

# 10 bond maturities: 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y
rng = np.random.default_rng(42)
n_bonds, T = 10, 500

# Simulate correlated bond returns (level, slope, curvature structure)
level  = rng.normal(0, 0.01, T)
slope  = rng.normal(0, 0.005, T)
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
dur    = mats / mats.max()

rets = np.outer(level, np.ones(n_bonds)) + np.outer(slope, dur)
rets += rng.normal(0, 0.002, (T, n_bonds))

result = pca_risk_decomp(rets, n_components=3)
for i in range(3):
    print(f"PC{i+1}: explains {result['explained_variance'][i]:.1%} of variance")`,
    explanation:
      "PCA of the yield curve covariance matrix reveals three dominant factors that explain 95%+ of variance: PC1 = parallel shift (level), PC2 = twist (slope), PC3 = butterfly (curvature). This decomposition underpins duration hedging, swap spread trading, and curve steepener strategies. For equity portfolios, PCA extracts market, sector, and style factors. The factor_var_contrib shows which PC dominates portfolio risk.",
  },
  {
    id: "pyfin-20260712-b1-mean-variance-frontier",
    language: "python",
    title: "Mean-Variance Efficient Frontier (cvxpy)",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def efficient_frontier(mu, Sigma, n_points=50, allow_short=False):
    """
    Trace the mean-variance efficient frontier using cvxpy QP.
    Returns: list of (expected_return, portfolio_vol, weights)
    """
    n     = len(mu)
    w     = cp.Variable(n)
    ret   = mu @ w
    risk2 = cp.quad_form(w, Sigma)

    constraints = [cp.sum(w) == 1]
    if not allow_short:
        constraints.append(w >= 0)

    # Parametric frontier: minimize variance for each target return level
    mu_min = float(mu.min())
    mu_max = float(mu.max())
    targets = np.linspace(mu_min * 1.01, mu_max * 0.99, n_points)

    frontier = []
    for mu_target in targets:
        prob = cp.Problem(cp.Minimize(risk2),
                          constraints + [ret >= mu_target])
        prob.solve(solver=cp.OSQP, warm_start=True, verbose=False)
        if prob.status in ('optimal', 'optimal_inaccurate'):
            frontier.append((float(ret.value),
                             float(np.sqrt(risk2.value)),
                             w.value.copy()))
    return frontier

def max_sharpe(mu, Sigma, rf=0.0, allow_short=False):
    """Tangency portfolio: maximise Sharpe ratio."""
    n  = len(mu)
    w  = cp.Variable(n)
    excess_ret = (mu - rf) @ w
    risk       = cp.quad_form(w, Sigma)
    constraints = [cp.sum(w) == 1]
    if not allow_short:
        constraints.append(w >= 0)

    # Equivalent to maximising SR: minimise var subject to excess_ret = 1
    y = cp.Variable(n)
    kappa = cp.Variable()
    prob  = cp.Problem(cp.Minimize(cp.quad_form(y, Sigma)),
                        [kappa >= 0, (mu - rf) @ y == 1, cp.sum(y) == kappa,
                         y >= 0] if not allow_short else
                        [(mu - rf) @ y == 1, cp.sum(y) == kappa, kappa >= 0])
    prob.solve(solver=cp.OSQP, verbose=False)
    w_tang = y.value / y.value.sum()
    return w_tang

# Example: 5 assets
mu    = np.array([0.08, 0.10, 0.12, 0.07, 0.11])
vols  = np.array([0.15, 0.18, 0.22, 0.12, 0.20])
rho   = np.array([[1,.3,.2,.1,.25],[.3,1,.35,.1,.3],
                   [.2,.35,1,.15,.4],[.1,.1,.15,1,.1],[.25,.3,.4,.1,1]])
Sigma = np.diag(vols) @ rho @ np.diag(vols)

front = efficient_frontier(mu, Sigma, n_points=20)
print(f"Frontier: {len(front)} points computed")
w_tang = max_sharpe(mu, Sigma, rf=0.04)
print(f"Tangency portfolio: {np.round(w_tang, 3)}")`,
    explanation:
      "The efficient frontier is traced by solving a QP minimising σ² subject to target μ for each point. cvxpy formulates the QP symbolically and calls OSQP (an interior-point solver). The max-Sharpe (tangency) portfolio maximises (μ−rf)/σ; the equivalent QP normalises so excess return = 1 and minimises variance. Long-only constraints (w≥0) add inactive inequality constraints that bend the frontier inward. Used for strategic asset allocation and factor portfolio construction.",
  },
  {
    id: "pyfin-20260712-b1-ois-bootstrap",
    language: "python",
    title: "OIS Discount Curve Bootstrap",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def ois_bootstrap(tenors_years, ois_rates):
    """
    Bootstrap OIS discount factors from quoted OIS swap rates.
    OIS: daily compounded overnight rate; here simplified to annual.
    tenors_years: e.g. [0.25, 0.5, 1, 2, 3, 5, 7, 10]
    ois_rates: corresponding par OIS rates (continuously compounded approx)
    """
    discount_factors = {}
    discount_factors[0.0] = 1.0

    for i, (T, s) in enumerate(zip(tenors_years, ois_rates)):
        if T <= 1.0:
            # Short end: discount factor directly from flat OIS rate
            discount_factors[T] = np.exp(-s * T)
        else:
            # Bootstrap: sum of known coupon PVs + unknown terminal PV = 1
            prev_tenors = [t for t in tenors_years[:i] if t in discount_factors]

            def pv_eq(df_T):
                # Fixed leg PV = floating leg PV (= par)
                accruals = []
                for j, (tp, tn) in enumerate(zip([0]+prev_tenors, prev_tenors+[T])):
                    delta = tn - tp
                    df    = discount_factors.get(tp, np.exp(-s*tp))
                    accruals.append(s * delta * df)
                pv_fixed = sum(accruals) + df_T  # coupon PVs + principal
                return pv_fixed - 1.0

            df_T = brentq(pv_eq, 0.01, 1.5)
            discount_factors[T] = df_T

    # Convert to zero rates
    zero_rates = {T: -np.log(df) / T for T, df in discount_factors.items() if T > 0}
    return discount_factors, zero_rates

tenors   = [0.25, 0.5, 1, 2, 3, 5, 7, 10]
ois_flat = [0.044, 0.045, 0.046, 0.044, 0.042, 0.040, 0.039, 0.038]
dfs, zeros = ois_bootstrap(tenors, ois_flat)

for T, z in zeros.items():
    print(f"  {T:5.2f}Y  OIS df={dfs[T]:.6f}  zero={z*100:.4f}%")`,
    explanation:
      "Post-LIBOR, OIS (Overnight Index Swap) rates are the standard risk-free reference curve. Bootstrapping strips zero-coupon discount factors from par swap rates iteratively: the 1Y DF is immediate, the 2Y DF is found by requiring the 2Y swap to price at par given the already-known 1Y DF. This piecewise construction yields a unique discount curve. OIS discounting replaced LIBOR discounting for all CSA collateralised derivatives after the 2008 crisis.",
  },
  {
    id: "pyfin-20260712-b1-backtest-txn",
    language: "python",
    title: "Backtesting with Transaction Costs & Slippage",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def backtest_with_costs(
    returns,          # (T, N) asset returns
    signals,          # (T, N) raw position signals (before normalisation)
    cost_bps=5.0,     # one-way transaction cost in bps
    slippage_bps=2.0, # additional slippage per unit turnover
    leverage_cap=1.0, # max sum(|w|)
):
    """
    Realistic backtest accounting for transaction costs and slippage.
    """
    T, N = returns.shape
    cost = (cost_bps + slippage_bps) / 10000.0  # total cost per unit traded

    # Normalise signals to leverage_cap
    w = np.zeros_like(signals, dtype=float)
    for t in range(T):
        sig = signals[t]
        total = np.abs(sig).sum()
        if total > 0:
            w[t] = sig / total * leverage_cap

    # Compute turnover-adjusted portfolio returns
    pnl      = np.zeros(T)
    w_prev   = np.zeros(N)

    for t in range(T):
        turnover = np.abs(w[t] - w_prev).sum()
        gross    = (w_prev * returns[t]).sum()
        txn_cost = turnover * cost
        pnl[t]   = gross - txn_cost
        w_prev   = w[t]

    # Performance metrics
    sr_gross = returns[1:] @ (w[:-1].T).diagonal() if T > 1 else 0
    sr_daily = pnl.mean() / (pnl.std() + 1e-10)
    ann_sr   = sr_daily * np.sqrt(252)
    ann_ret  = pnl.mean() * 252
    max_dd   = (np.maximum.accumulate(np.cumsum(pnl)) - np.cumsum(pnl)).max()

    return {
        'pnl': pnl,
        'annualised_return': ann_ret,
        'annualised_sharpe': ann_sr,
        'max_drawdown': max_dd,
        'avg_daily_turnover': np.abs(np.diff(w, axis=0)).sum(axis=1).mean(),
    }

# Example: simple momentum signal
rng  = np.random.default_rng(42)
T, N = 500, 10
rets = rng.normal(0.0003, 0.015, (T, N))

# 1-month momentum: positive signal for recent winners
momentum = np.zeros((T, N))
for t in range(21, T):
    momentum[t] = rets[t-21:t].mean(axis=0)

result = backtest_with_costs(rets, momentum)
print(f"Annualised Sharpe: {result['annualised_sharpe']:.2f}")
print(f"Annualised Return: {result['annualised_return']:.2%}")
print(f"Max Drawdown:      {result['max_drawdown']:.4f}")`,
    explanation:
      "Realistic backtesting deducts transaction costs proportional to turnover: cost_bps × |Δw| per period. Slippage represents market impact of the trade (always adverse). High-frequency rebalancing strategies are often cost-negative when costs are properly modelled. The Sharpe ratio net of costs is the correct performance measure. Turnover is typically annualised; a 100% annual turnover at 10bps one-way costs 20bps p.a., material for low-alpha strategies.",
  },
  {
    id: "pyfin-20260712-b1-student-t-var",
    language: "python",
    title: "Parametric VaR with Student-t Distribution",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import t as tdist, norm
from scipy.optimize import minimize

def fit_student_t(returns):
    """Fit Student-t location, scale, df to returns via MLE."""
    def neg_loglik(params):
        nu, mu, sigma = params
        if nu <= 2 or sigma <= 0:
            return 1e10
        return -np.sum(tdist.logpdf(returns, df=nu, loc=mu, scale=sigma))
    x0 = [5.0, returns.mean(), returns.std()]
    bounds = [(2.01, 100), (-1, 1), (1e-6, 1)]
    res = minimize(neg_loglik, x0, bounds=bounds, method='L-BFGS-B')
    return res.x   # (nu, mu, sigma)

def student_t_var(returns, confidence=0.99, horizon=1):
    """
    Parametric VaR under Student-t (heavier tails than Gaussian).
    """
    nu, mu, sigma = fit_student_t(returns)
    # Scale to horizon
    mu_h    = mu * horizon
    sigma_h = sigma * np.sqrt(horizon)

    # VaR: quantile of fitted t
    alpha   = 1 - confidence
    var_t   = -(mu_h + sigma_h * tdist.ppf(alpha, df=nu))

    # Normal VaR for comparison
    var_n   = -(mu * horizon + sigma_h * norm.ppf(alpha))

    return var_t, var_n, nu

# Simulate fat-tailed returns
rng  = np.random.default_rng(42)
rets = tdist.rvs(df=5, loc=0.0005, scale=0.012, size=1000, random_state=42)

var_t, var_n, nu_fit = student_t_var(rets, confidence=0.99)
print(f"Fitted degrees of freedom: {nu_fit:.2f}")
print(f"Student-t 99% VaR: {var_t*100:.3f}%")
print(f"Normal 99% VaR:    {var_n*100:.3f}% (understates tails)")
print(f"Ratio t/normal: {var_t/var_n:.3f}")`,
    explanation:
      "Financial returns have fat tails (kurtosis > 3): extreme events occur far more often than the Gaussian distribution implies. Fitting a Student-t with df ≈ 4–6 for equity returns captures this. At 99% confidence, the t-VaR typically exceeds the normal VaR by 20–40%; at 99.9%, the difference is 2–3×. Basel II/III allows internal model VaR; firms that use Gaussian assumptions systematically understate tail risk, as demonstrated repeatedly in crises.",
  },
  {
    id: "pyfin-20260712-b1-carry-momentum",
    language: "python",
    title: "Carry + Momentum Combo Factor for FX",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def fx_carry_signal(spot_rates, rate_differentials):
    """
    FX carry signal: buy high-yield currencies, sell low-yield.
    rate_differentials: (T, N) array of foreign - domestic rate (in %)
    """
    # Rank-based signal: long top half, short bottom half
    signals = np.zeros_like(rate_differentials)
    for t in range(len(rate_differentials)):
        ranks = rate_differentials[t].argsort().argsort()  # rank 0..N-1
        n = len(ranks)
        signals[t] = (ranks - (n-1)/2) / ((n-1)/2)   # normalise to [-1, 1]
    return signals

def fx_momentum_signal(spot_returns, lookback=252):
    """
    FX momentum: 12-1 month returns (skip last month for reversal).
    """
    T, N = spot_returns.shape
    sigs = np.zeros((T, N))
    for t in range(lookback + 21, T):
        # 12-month return minus last month
        ret_12 = spot_returns[t-lookback:t-21].sum(axis=0)
        ranks  = ret_12.argsort().argsort()
        n = len(ranks)
        sigs[t] = (ranks - (n-1)/2) / ((n-1)/2)
    return sigs

def combine_signals(sig1, sig2, w1=0.5, w2=0.5):
    """Blend signals; normalise to unit max absolute weight."""
    combined = w1 * sig1 + w2 * sig2
    max_abs  = np.abs(combined).max(axis=1, keepdims=True)
    max_abs  = np.where(max_abs < 1e-8, 1, max_abs)
    return combined / max_abs

# Synthetic FX panel: 8 currencies vs USD
rng  = np.random.default_rng(42)
T, N = 500, 8
spot_rets = rng.normal(0, 0.005, (T, N))
rate_diff = rng.normal(0.5, 2.0, (T, N))  # annualised rate differential (%)

carry_sig = fx_carry_signal(spot_rets, rate_diff)
mom_sig   = fx_momentum_signal(spot_rets, lookback=60)
combo     = combine_signals(carry_sig, mom_sig)

# Backtest
port_rets = (combo[:-1] * spot_rets[1:]).sum(axis=1)
sr = port_rets.mean() / port_rets.std() * np.sqrt(252)
print(f"Carry+Momentum Sharpe: {sr:.2f}")`,
    explanation:
      "Carry (long high-yield, short low-yield) and momentum (trend following) are two of the most robust FX risk premia. Carry earns the interest rate differential but crashes in risk-off episodes; momentum profits from persistent trends but suffers in mean-reverting markets. Their combination has historically positive correlation ~0.1–0.3 and diversifies well: carry performs in stable growth, momentum in trending crisis or rally. Rank-based signals are robust to outliers.",
  },
  {
    id: "pyfin-20260712-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory (GPD) Tail Risk Estimation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses, threshold_quantile=0.95):
    """
    Peaks-over-threshold (POT) method using Generalised Pareto Distribution.
    GPD: P(X > x | X > u) ≈ (1 + xi*(x-u)/beta)^(-1/xi)
    xi > 0: fat tails (Frechet), xi = 0: exponential (Gumbel), xi < 0: bounded
    """
    u   = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u

    # MLE fit via scipy
    xi, loc, beta = genpareto.fit(exceedances, floc=0)

    # VaR and ES beyond threshold using GPD
    n_total   = len(losses)
    n_exceed  = len(exceedances)
    p_exceed  = n_exceed / n_total   # empirical exceedance probability

    def var_gpd(p_total):
        """VaR at probability level p_total (e.g. 0.999)."""
        if p_total <= threshold_quantile:
            return np.quantile(losses, p_total)
        p_cond = (1 - p_total) / p_exceed
        if xi != 0:
            return u + beta / xi * (p_cond**(-xi) - 1)
        else:
            return u - beta * np.log(p_cond)

    def es_gpd(p_total):
        """Expected Shortfall at p_total."""
        var = var_gpd(p_total)
        if xi < 1:  # ES exists only when xi < 1
            return (var + beta - xi * u) / (1 - xi)
        return np.inf

    return xi, beta, u, var_gpd, es_gpd

# Simulate fat-tailed losses
rng   = np.random.default_rng(42)
losses= np.abs(np.concatenate([
    np.random.default_rng(42).normal(0, 0.01, 900),
    np.random.default_rng(1).standard_t(df=3, size=100) * 0.02
]))

xi, beta, u, var_fn, es_fn = fit_gpd_tail(losses, 0.95)
print(f"GPD shape xi={xi:.4f}, scale beta={beta:.6f}, threshold u={u:.4f}")
print(f"99.9% VaR:  {var_fn(0.999)*100:.3f}%")
print(f"99.9% ES:   {es_fn(0.999)*100:.3f}%")
print(f"99.99% VaR: {var_fn(0.9999)*100:.3f}%")`,
    explanation:
      "Extreme Value Theory provides principled estimates of tail risk beyond the historical sample. The Generalised Pareto Distribution (GPD) is the unique limiting distribution for threshold exceedances (Pickands-Balkema-de Haan theorem). Shape parameter ξ > 0 indicates power-law tails (typical for equities, ξ ≈ 0.2–0.4); ξ = 0 is exponential decay. GPD-based VaR/ES estimates are far more reliable than empirical quantiles for confidence levels like 99.9% where only a handful of observations exist.",
  },
];
