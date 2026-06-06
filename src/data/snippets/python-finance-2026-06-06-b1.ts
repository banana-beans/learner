import type { Snippet } from "./types";

export const pythonFinanceSnippets20260606B1: Snippet[] = [
  {
    id: "pyfin-20260606-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula — CDO tranche pricing and default correlation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def gaussian_copula_mc(
    n_names: int = 100,
    recovery: float = 0.40,
    spread_bps: float = 200,
    rho: float = 0.30,        # pairwise default correlation
    horizon: float = 5.0,     # years
    risk_free: float = 0.05,
    n_sims: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    One-factor Gaussian copula (Li 2000) for a homogeneous CDO pool.
    Each name defaults when its Gaussian uniform U_i < PD.
    U_i = sqrt(rho)*M + sqrt(1-rho)*Z_i  where M = market factor.
    PD: implied from CDS spread (flat hazard rate approximation).
    """
    rng = np.random.default_rng(seed)
    lgd = 1.0 - recovery

    # Implied hazard rate from spread (approximate: lambda ~ s / (1-R)).
    hazard = spread_bps / 10000 / lgd
    pd_horizon = 1 - np.exp(-hazard * horizon)   # marginal default prob

    # Map PD to normal quantile (copula threshold).
    threshold = norm.ppf(pd_horizon)

    # One-factor simulation.
    M   = rng.standard_normal(n_sims)            # common factor
    Z   = rng.standard_normal((n_sims, n_names)) # idiosyncratic
    U   = np.sqrt(rho) * M[:, None] + np.sqrt(1 - rho) * Z

    # Default indicator: name i defaults if U_i < threshold.
    defaults     = (U < threshold).sum(axis=1)   # number of defaults per sim
    losses_pct   = defaults / n_names * lgd       # portfolio loss as fraction

    # Tranche attachment / detachment points (equity, mezzanine, senior).
    tranches = [(0.00, 0.03), (0.03, 0.06), (0.06, 0.09), (0.09, 1.00)]
    disc     = np.exp(-risk_free * horizon)

    results = {}
    for (attach, detach) in tranches:
        # Tranche loss = min(max(pool_loss - A, 0), D-A) / (D-A).
        tranche_notional = detach - attach
        tranche_loss = np.clip(losses_pct - attach, 0, tranche_notional) / tranche_notional
        el = disc * tranche_loss.mean()
        results[f"{attach*100:.0f}-{detach*100:.0f}%"] = {
            "EL_%": round(el * 100, 3),
            "P(full_loss)": round((tranche_loss >= 1.0).mean(), 4),
        }

    results["pool_EL_%"] = round(losses_pct.mean() * 100, 3)
    results["rho"]       = rho
    return results

print(gaussian_copula_mc(rho=0.10))
print()
print(gaussian_copula_mc(rho=0.40))   # higher rho: senior tranche more at risk`,
    explanation:
      "The one-factor Gaussian copula maps each name's default time to a correlated normal via a shared market factor M. The key insight: given M, defaults are independent across names — so the conditional portfolio loss distribution is binomial. Higher rho (correlation) fattens the tails of the aggregate loss distribution: equity tranches lose expected-loss-like sensitivity while senior tranches become more exposed — the famous 'correlation skew' that misled CDO models pre-2008.",
  },
  {
    id: "pyfin-20260606-b1-pca-yield",
    language: "python",
    title: "PCA on yield curve — level/slope/curvature factor decomposition",
    tag: "finance",
    code: `import numpy as np
from scipy.linalg import eigh

def yield_curve_pca(yields_panel: np.ndarray,
                     maturities: np.ndarray,
                     n_factors: int = 3) -> dict:
    """
    PCA decomposition of daily yield changes into orthogonal risk factors.
    yields_panel: (T, N) matrix of yields — T dates, N maturities.
    Returns loadings (eigenvectors) and variance explained per factor.
    """
    # Work with daily changes to achieve stationarity.
    dy = np.diff(yields_panel, axis=0)   # (T-1, N) changes

    # Covariance matrix (N x N) in basis-point-squared.
    C = np.cov(dy.T * 10000)   # scale to bps for readability

    # eigh: symmetric eigensolver, returns ascending eigenvalues.
    eigvals, eigvecs = eigh(C)
    # Sort descending.
    idx      = np.argsort(eigvals)[::-1]
    eigvals  = eigvals[idx]
    eigvecs  = eigvecs[:, idx]

    loadings = eigvecs[:, :n_factors]   # (N, n_factors)
    var_explained = eigvals[:n_factors] / eigvals.sum()

    # Factor scores (time series of each factor).
    scores = dy @ loadings   # (T-1, n_factors) — principal component returns

    # Sign convention: first PC loadings are positive (level).
    for k in range(n_factors):
        if loadings[:, k].mean() < 0:
            loadings[:, k] *= -1
            scores[:, k]   *= -1

    # DV01 risk decomposition for a 10Y bond (simplified).
    dv01_weights = np.zeros(len(maturities))
    dv01_weights[np.argmin(np.abs(maturities - 10))] = 1.0
    factor_dv01s = dv01_weights @ loadings   # contribution per factor

    return {
        'loadings':       np.round(loadings, 5),
        'var_explained':  np.round(var_explained * 100, 2),
        'cum_var_%':      round(var_explained.sum() * 100, 2),
        'factor_scores':  scores,
        '10Y_factor_DV01': np.round(factor_dv01s, 5),
    }

np.random.seed(42)
T, N = 500, 10
mats  = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
# Simulate a correlated yield panel.
level_shocks = np.random.normal(0, 0.001, T)
slope_shocks = np.random.normal(0, 0.0005, T)
yields = np.zeros((T, N))
for t in range(1, T):
    yields[t] = yields[t-1] + level_shocks[t] + slope_shocks[t] * np.linspace(0.5,-0.5,N)

result = yield_curve_pca(yields, mats)
print("Variance explained per factor:", result['var_explained'], "%")
print("Cumulative:", result['cum_var_%'], "%")
print("Loadings shape (maturities x factors):", result['loadings'].shape)
for i in range(3):
    print(f"Factor {i+1} loadings: {result['loadings'][:,i]}")`,
    explanation:
      "The first three PCs of daily yield changes explain ~99% of variance across all developed-market yield curves and correspond to parallel shift (level, ~90%), tilt (slope, ~8%), and butterfly (curvature, ~2%). This decomposition is the basis of all multi-factor rate risk systems: a trader's DV01 is decomposed into level/slope/curvature DV01s which can be hedged separately. Using yield changes (not levels) ensures stationarity and makes the covariance matrix well-conditioned.",
  },
  {
    id: "pyfin-20260606-b1-regime-switching",
    language: "python",
    title: "Hamilton Markov regime switching — EM estimation for 2-state vol model",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def hamilton_regime_switching(returns: np.ndarray,
                                n_iter: int = 100,
                                tol: float = 1e-6) -> dict:
    """
    Hamilton (1989) 2-state Markov switching model via EM algorithm.
    State 0: low vol (bull), State 1: high vol (bear).
    Transition matrix P = [[p00, p01], [p10, p11]].
    Emission: r_t | s_t=k ~ N(mu_k, sigma_k).
    """
    T = len(returns)
    # Initialise parameters.
    mu    = np.array([returns.mean(), returns.mean() - returns.std()])
    sigma = np.array([returns.std() * 0.6, returns.std() * 1.4])
    P     = np.array([[0.95, 0.05], [0.10, 0.90]])   # transition matrix

    ll_prev = -np.inf

    for iteration in range(n_iter):
        # ===== E-step: Hamilton filter (forward pass) =====
        # xi[t,k] = P(s_t = k | r_1..r_t)
        xi  = np.zeros((T, 2))
        eta = np.zeros((T, 2))   # conditional densities

        for k in range(2):
            eta[:, k] = norm.pdf(returns, mu[k], sigma[k])

        # Initialise with stationary distribution.
        pi = np.linalg.solve(
            np.vstack([P.T - np.eye(2), np.ones((1, 2))]),
            np.array([0, 0, 1.0])
        )
        xi[0] = pi * eta[0]
        xi[0] /= xi[0].sum()

        log_lik = 0.0
        for t in range(1, T):
            pred     = xi[t-1] @ P          # predicted state prob
            xi[t]    = pred * eta[t]
            ll_t     = xi[t].sum()
            log_lik += np.log(ll_t + 1e-300)
            xi[t]   /= ll_t

        # Backward smoothing (Kim smoother).
        xi_smooth = xi.copy()
        for t in range(T - 2, -1, -1):
            ratio         = xi_smooth[t+1] / (xi[t] @ P + 1e-300)
            xi_smooth[t] *= (P @ ratio)
            xi_smooth[t] /= xi_smooth[t].sum()

        # ===== M-step: update parameters =====
        for k in range(2):
            w         = xi_smooth[:, k]
            mu[k]     = (w * returns).sum() / w.sum()
            sigma[k]  = np.sqrt((w * (returns - mu[k])**2).sum() / w.sum())
            sigma[k]  = max(sigma[k], 1e-6)

        # Update transition matrix.
        for i in range(2):
            for j in range(2):
                num = sum(xi_smooth[t, i] * P[i, j] * eta[t+1, j] / (xi[t] @ P)[j]
                          for t in range(T-1))
                P[i, j] = num
            P[i] /= P[i].sum()

        if abs(log_lik - ll_prev) < tol: break
        ll_prev = log_lik

    # Ensure state 0 = low vol.
    if sigma[0] > sigma[1]:
        mu, sigma, xi_smooth = mu[::-1], sigma[::-1], xi_smooth[:, ::-1]
        P = P[::-1, ::-1]

    regime_probs = xi_smooth[:, 1]   # P(high vol) at each date
    return {
        'mu':           np.round(mu * 252, 4),     # annualised
        'sigma':        np.round(sigma * np.sqrt(252), 4),
        'P_stay_bull':  round(P[0, 0], 4),
        'P_stay_bear':  round(P[1, 1], 4),
        'log_lik':      round(log_lik, 2),
        'regime_probs': regime_probs,
        'pct_in_bear':  round(regime_probs.mean() * 100, 1),
    }

np.random.seed(42)
n = 1000
# Regime 0: low vol; regime 1: high vol; simulate true Markov switching.
states = np.zeros(n, dtype=int)
for t in range(1, n):
    states[t] = np.random.choice([0,1], p=[0.95,0.05] if states[t-1]==0 else [0.10,0.90])
returns = np.where(states==0,
                   np.random.normal(0.0003, 0.008, n),
                   np.random.normal(-0.001, 0.022, n))

result = hamilton_regime_switching(returns)
print("Annualised mu (bull/bear):", result['mu'])
print("Annualised vol (bull/bear):", result['sigma'])
print("P(stay bull):", result['P_stay_bull'])
print("% in bear regime:", result['pct_in_bear'], "%")`,
    explanation:
      "The Hamilton filter (a hidden Markov model for time series) uses EM: the E-step runs the forward-backward algorithm to compute smoothed state probabilities, and the M-step updates parameters as weighted moment estimates. The key economic insight is that financial volatility is not constant but switches between low-vol (trending) and high-vol (crisis) regimes that persist for months — transition probabilities P(stay in regime) near 0.95-0.99 are typical.",
  },
  {
    id: "pyfin-20260606-b1-kelly",
    language: "python",
    title: "Kelly criterion — optimal bet sizing with parameter uncertainty",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_sizing(mu: float, sigma: float, rf: float = 0.0,
                  max_leverage: float = 3.0) -> dict:
    """
    Kelly criterion for a continuous lognormal asset.
    Full Kelly: f* = (mu - rf) / sigma^2 (Sharpe ratio / sigma).
    Half Kelly: f*/2 (standard practice due to estimation error).
    Fractional Kelly: accounts for parameter uncertainty.
    """
    excess_mu = mu - rf
    if sigma <= 0: raise ValueError("sigma must be positive")

    f_full    = excess_mu / (sigma ** 2)
    f_half    = f_full / 2
    f_quarter = f_full / 4

    # Optimal growth rates.
    def log_growth(f): return f * excess_mu - 0.5 * f**2 * sigma**2

    g_full    = log_growth(f_full)
    g_half    = log_growth(f_half)

    # Constrained Kelly: cap at max_leverage.
    f_capped  = min(f_full, max_leverage)
    g_capped  = log_growth(f_capped)

    # Estimation error adjustment: parameter uncertainty degrades effective edge.
    # If n observations, uncertainty ~ sigma/sqrt(n) -> reduce by (1 - 1/(n*Sharpe^2)).
    n_days = 252
    sharpe = excess_mu * np.sqrt(252) / (sigma * np.sqrt(252))  # annual Sharpe
    f_uncertainty = max(f_full * (1 - sigma**2 / (n_days * excess_mu**2 + 1e-10)), 0)

    # Probability of ruin (reaching 50% drawdown) at full Kelly.
    # For GBM with drift mu and vol sigma: P(ruin to level L) = exp(-2*f*excess_mu/sigma^2 * log(1/L)) approx.
    ruin_prob = np.exp(-2 * f_capped * excess_mu / (sigma**2) * np.log(2)) if f_capped > 0 else 0.5

    return {
        'f_full_kelly':     round(f_full, 4),
        'f_half_kelly':     round(f_half, 4),
        'f_capped':         round(f_capped, 4),
        'f_uncertainty_adj': round(f_uncertainty, 4),
        'log_growth_full':  round(g_full * 252, 4),    # annualised
        'log_growth_half':  round(g_half * 252, 4),
        'annual_sharpe':    round(sharpe, 3),
        'est_ruin_prob':    round(ruin_prob, 4),
    }

# Example: a strategy with 15% annual excess return, 20% vol.
result = kelly_sizing(mu=0.15/252, sigma=0.20/np.sqrt(252))
print("Kelly sizing results:")
for k, v in result.items():
    print(f"  {k:25s}: {v}")

# Multi-asset Kelly: f* = Sigma^{-1} * mu_excess (vector).
def multi_asset_kelly(mu_excess: np.ndarray, cov: np.ndarray,
                       max_leverage: float = 2.0) -> np.ndarray:
    """Full Kelly weights for multiple assets."""
    f = np.linalg.solve(cov, mu_excess)   # Sigma^{-1} * mu
    leverage = np.abs(f).sum()
    if leverage > max_leverage:
        f *= max_leverage / leverage      # scale down to max leverage
    return np.round(f, 4)

np.random.seed(7)
N = 4
A = np.random.randn(N, N)
cov_ann = A @ A.T / N / 252 + np.eye(N) * 0.0001
mu_ex   = np.array([0.12, 0.08, 0.15, 0.05]) / 252  # daily excess returns
f_multi = multi_asset_kelly(mu_ex, cov_ann)
print("Multi-asset Kelly weights:", f_multi)`,
    explanation:
      "Full Kelly maximises the expected log-wealth growth rate but is notoriously volatile: a 50% drawdown is nearly certain under full Kelly when parameters are estimated from finite data. Half-Kelly reduces drawdown risk at the cost of ~25% lower growth rate (log_growth_half ≈ 0.75 * log_growth_full). The uncertainty-adjusted Kelly automatically shrinks the bet size in proportion to parameter estimation error — with only 252 observations, the effective edge is roughly half the sample edge.",
  },
  {
    id: "pyfin-20260606-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal execution — TWAP vs optimal liquidation trajectory",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X0: float,        # initial position to liquidate
    T: float,         # total execution time (hours)
    N: int = 10,      # number of trading intervals
    sigma: float = 0.02,  # return vol per interval
    gamma: float = 1e-6,  # permanent market impact per share
    eta: float = 2.5e-7,  # temporary impact coef (bid-ask + price impact)
    risk_aversion: float = 1e-6,  # lambda (risk aversion parameter)
) -> dict:
    """
    Almgren-Chriss (2001) optimal liquidation trajectory.
    Minimises: E[cost] + lambda * Var[cost] = permanent + temporary + timing risk.
    Optimal trajectory: x_k = X0 * sinh(kappa*(T-t_k)) / sinh(kappa*T)
    where kappa = sqrt(lambda*sigma^2 / eta).
    """
    dt = T / N
    tau = np.arange(N + 1) * dt   # time points

    kappa = np.sqrt(risk_aversion * sigma**2 / eta)

    # Optimal remaining position at each time step.
    x_opt = X0 * np.sinh(kappa * (T - tau)) / np.sinh(kappa * T)

    # Trades: negative (sells).
    trades_opt = -np.diff(x_opt)   # shares sold per interval

    # TWAP for comparison: sell X0/N shares each interval.
    trades_twap = np.full(N, X0 / N)
    x_twap      = X0 - np.concatenate([[0], np.cumsum(trades_twap)])

    # Expected cost (permanent + temporary impact).
    def expected_cost(trades):
        n = len(trades)
        perm_cost = 0.5 * gamma * X0**2   # invariant to schedule
        temp_cost = eta / dt * np.sum(trades**2)
        return perm_cost + temp_cost

    def variance(trades):
        x_remaining = X0 - np.concatenate([[0], np.cumsum(trades)])
        return sigma**2 * dt * np.sum(x_remaining[:-1]**2)

    ec_opt  = expected_cost(trades_opt)
    ec_twap = expected_cost(trades_twap)
    var_opt  = variance(trades_opt)
    var_twap = variance(trades_twap)

    # Efficient frontier: tradeoff between cost and risk.
    lambdas = np.logspace(-8, -3, 50)
    frontier = []
    for lam in lambdas:
        kap = np.sqrt(lam * sigma**2 / eta)
        x_lam = X0 * np.sinh(kap * (T - tau)) / np.sinh(kap * T)
        tr    = -np.diff(x_lam)
        frontier.append((expected_cost(tr), variance(tr)))

    return {
        'x_opt':  np.round(x_opt, 2),
        'x_twap': np.round(x_twap, 2),
        'trades_opt': np.round(trades_opt, 2),
        'kappa':  round(kappa, 6),
        'EC_opt':  round(ec_opt, 4),
        'EC_twap': round(ec_twap, 4),
        'Var_opt':  round(var_opt, 6),
        'Var_twap': round(var_twap, 6),
        'frontier': frontier[:5],  # sample of frontier
    }

result = almgren_chriss_trajectory(X0=100_000, T=1.0, N=10)
print("Optimal trajectory (shares remaining):", result['x_opt'])
print("TWAP trajectory:", result['x_twap'])
print(f"E[cost] optimal: {result['EC_opt']:.4f}  TWAP: {result['EC_twap']:.4f}")
print(f"Var     optimal: {result['Var_opt']:.6f}  TWAP: {result['Var_twap']:.6f}")`,
    explanation:
      "Almgren-Chriss separates market impact into permanent (moves the price forever, proportional to total shares) and temporary (bid-ask spread + instantaneous price impact, proportional to trading rate). The optimal schedule front-loads sales when risk aversion is high (sell fast to avoid timing risk) or back-loads when risk aversion is low (sell slowly to minimise temporary impact). TWAP is the limit as risk_aversion → 0 (purely minimising variance, no cost concern).",
  },
  {
    id: "pyfin-20260606-b1-ledoit-wolf",
    language: "python",
    title: "Ledoit-Wolf shrinkage — regularised covariance for small T/N ratio",
    tag: "finance",
    code: `import numpy as np

def ledoit_wolf_analytical(returns: np.ndarray) -> dict:
    """
    Ledoit-Wolf (2004) Oracle Approximating Shrinkage (OAS) for covariance.
    Shrinks sample cov towards scaled identity: Sigma* = (1-alpha)*S + alpha*mu*I.
    Analytical formula avoids cross-validation; O(T*N^2) time.
    """
    T, N = returns.shape
    # Demean.
    R = returns - returns.mean(axis=0)

    # Sample covariance.
    S = R.T @ R / T

    # Target: scaled identity F = (trace(S)/N) * I.
    mu = np.trace(S) / N

    # LW closed-form alpha (Oracle Approximating Shrinkage).
    delta = np.linalg.norm(S - mu * np.eye(N), 'fro')**2
    beta_bar = sum(
        np.linalg.norm(np.outer(R[t], R[t]) - S, 'fro')**2
        for t in range(T)
    ) / T**2

    beta  = min(beta_bar, delta)     # cap at delta
    alpha = beta / delta             # shrinkage intensity in [0,1]

    Sigma_star = (1 - alpha) * S + alpha * mu * np.eye(N)

    # Condition numbers.
    cond_S    = np.linalg.cond(S)
    cond_star = np.linalg.cond(Sigma_star)

    # MV weights under both estimators.
    ones = np.ones(N)
    try:
        w_sample = np.linalg.solve(S, ones) / (ones @ np.linalg.solve(S, ones))
        w_lw     = np.linalg.solve(Sigma_star, ones) / (ones @ np.linalg.solve(Sigma_star, ones))
    except np.linalg.LinAlgError:
        w_sample = w_lw = np.full(N, 1/N)

    return {
        'alpha_shrinkage': round(alpha, 4),
        'mu_target':       round(mu, 6),
        'cond_sample':     round(cond_S, 1),
        'cond_LW':         round(cond_star, 1),
        'Sigma_LW':        Sigma_star,
        'w_sample':        np.round(w_sample, 4),
        'w_LW':            np.round(w_lw, 4),
        'max_weight_ratio': round(np.abs(w_sample).max() / np.abs(w_lw).max(), 2),
    }

np.random.seed(42)
T, N = 60, 50   # short window (60 days, 50 stocks) — T/N = 1.2 (very small!)
returns = np.random.multivariate_normal(
    mean=np.zeros(N),
    cov=np.eye(N) * 0.0001,
    size=T
)

result = ledoit_wolf_analytical(returns)
print(f"Shrinkage intensity alpha: {result['alpha_shrinkage']}")
print(f"Condition number (sample): {result['cond_sample']:.1f}")
print(f"Condition number (LW):     {result['cond_LW']:.1f}")
print(f"Max weight (sample vs LW): {result['w_sample'].max():.4f} vs {result['w_lw'].max():.4f}")`,
    explanation:
      "When T/N < 5, the sample covariance matrix is nearly singular (condition number ≫ 1000) and MV optimisation produces extreme, unstable weights. Ledoit-Wolf shrinks towards the scaled identity (which assumes all assets have the same variance and zero correlation): the alpha parameter balances between the noisy sample estimate and the stable but biased target. In practice, LW shrinkage reduces the maximum portfolio weight by 3-10x and dramatically improves out-of-sample performance.",
  },
  {
    id: "pyfin-20260606-b1-brownian-bridge-py",
    language: "python",
    title: "Brownian bridge path sampling — conditional paths for barrier pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def brownian_bridge_paths(
    start: float, end: float, t_start: float, t_end: float,
    n_inner: int, n_paths: int, seed: int = 42
) -> np.ndarray:
    """
    Sample n_inner intermediate points of a Brownian bridge:
    W(t) | W(t_start)=start, W(t_end)=end.
    Conditional distribution: W(t) ~ N(mu_t, var_t) where:
      mu_t  = start + (end - start) * (t - t_start) / (t_end - t_start)
      var_t = (t - t_start) * (t_end - t) / (t_end - t_start)
    Returns (n_paths, n_inner+2) array including endpoints.
    """
    rng  = np.random.default_rng(seed)
    T_   = t_end - t_start
    dt_  = T_ / (n_inner + 1)
    ts   = t_start + np.arange(1, n_inner + 1) * dt_

    # Conditional mean and std at each interior point.
    alpha = (ts - t_start) / T_
    mu_t  = start + (end - start) * alpha           # (n_inner,)
    var_t = (ts - t_start) * (t_end - ts) / T_     # (n_inner,)
    std_t = np.sqrt(var_t)

    # Sample: (n_paths, n_inner) paths.
    Z     = rng.standard_normal((n_paths, n_inner))
    paths = mu_t[None, :] + std_t[None, :] * Z      # broadcast

    # Prepend start, append end.
    starts = np.full((n_paths, 1), start)
    ends   = np.full((n_paths, 1), end)
    return np.concatenate([starts, paths, ends], axis=1)


def barrier_check_bb(paths_log: np.ndarray, log_barrier: float) -> np.ndarray:
    """Return boolean mask: True = path stays above log_barrier (survives)."""
    return (paths_log > log_barrier).all(axis=1)


def dao_call_brownian_bridge(
    S0: float, K: float, B: float, r: float, sigma: float, T: float,
    n_steps: int = 20, n_bridge: int = 10, n_paths: int = 50_000,
    seed: int = 42
) -> float:
    """
    Down-and-out call via GBM with Brownian bridge path refinement.
    Each coarse step is refined with n_bridge bridge points to detect crossings.
    """
    rng   = np.random.default_rng(seed)
    dt    = T / n_steps
    disc  = np.exp(-r * T)
    mu    = r - 0.5 * sigma**2
    logB  = np.log(B)

    logS  = np.full(n_paths, np.log(S0))
    alive = np.ones(n_paths, dtype=bool)
    payoff = np.zeros(n_paths)

    for step in range(n_steps):
        Z       = rng.standard_normal(n_paths)
        logS_new = logS + mu * dt + sigma * np.sqrt(dt) * Z

        # Brownian bridge sub-sampling for surviving paths.
        survivors = alive.nonzero()[0]
        if len(survivors) == 0: break

        bb = brownian_bridge_paths(
            0.0, 0.0, 0.0, dt, n_bridge, len(survivors), seed + step
        )
        # Scale BB to actual log-return range.
        scale = (logS_new[survivors] - logS[survivors])[:, None]
        drifted = logS[survivors, None] + scale * np.linspace(0, 1, n_bridge + 2)[None, :]
        noise   = bb * sigma * np.sqrt(dt)
        paths_log = drifted + noise

        knocked = ~barrier_check_bb(paths_log, logB)
        alive[survivors[knocked]] = False
        logS = logS_new

    ST = np.exp(logS)
    payoff = np.where(alive, np.maximum(ST - K, 0.0), 0.0)
    return float(disc * payoff.mean())

price = dao_call_brownian_bridge(100, 100, 85, 0.05, 0.20, 1.0)
print(f"Down-and-out call (BB refinement): {price:.4f}")`,
    explanation:
      "The Brownian bridge inserts correlated intermediate points between each coarse time step, each drawn from the exact conditional distribution given the coarse endpoints. This allows detecting barrier crossings that fall between discrete simulation dates without requiring a very fine time grid. The key formula: Var[W(t)|W(0)=a, W(T)=b] = t*(T-t)/T peaks at the midpoint and vanishes at both endpoints — the bridge is pinned at start and end.",
  },
  {
    id: "pyfin-20260606-b1-engle-granger",
    language: "python",
    title: "Engle-Granger cointegration test — two-step pairs trading signal",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller

def engle_granger_cointegration(y: np.ndarray, x: np.ndarray,
                                  significance: float = 0.05) -> dict:
    """
    Engle-Granger (1987) two-step cointegration test.
    Step 1: OLS regression of y on x -> estimate cointegrating vector.
    Step 2: ADF test on residuals -> reject unit root = cointegration.
    If cointegrated: spread = y - beta*x - alpha is mean-reverting.
    """
    # Step 1: OLS (in levels, not differences).
    X   = sm.add_constant(x)
    ols = sm.OLS(y, X).fit()
    alpha, beta = ols.params
    resid = ols.resid   # cointegrating residual (spread)

    # Step 2: ADF test on residuals.
    # Critical values differ from standard ADF (Engle-Granger tables).
    adf_result = adfuller(resid, autolag='AIC', regression='nc')
    adf_stat, adf_pval = adf_result[0], adf_result[1]

    is_cointegrated = adf_pval < significance

    # Half-life of mean reversion (from AR(1) on residuals).
    rho   = np.corrcoef(resid[1:], resid[:-1])[0, 1]
    rho   = np.clip(rho, 0.01, 0.999)
    half_life = np.log(2) / np.log(1 / rho)

    # Z-score of current spread.
    spread_mean = resid.mean()
    spread_std  = resid.std()
    z_score_cur = (resid[-1] - spread_mean) / spread_std

    # Johansen-style rank: single pair = 0 or 1 cointegrating relation.
    return {
        'alpha':           round(alpha, 5),
        'beta':            round(beta, 5),
        'adf_statistic':   round(adf_stat, 4),
        'adf_pvalue':      round(adf_pval, 4),
        'is_cointegrated': is_cointegrated,
        'half_life_days':  round(half_life, 2),
        'current_zscore':  round(z_score_cur, 4),
        'spread_std':      round(spread_std, 5),
        'R2':              round(ols.rsquared, 4),
    }

np.random.seed(42)
n = 500
# Simulate cointegrated pair: y = 1.5*x + stationary noise.
x     = 100 + np.cumsum(np.random.normal(0, 1.0, n))
noise = np.zeros(n)
for t in range(1, n):
    noise[t] = 0.85 * noise[t-1] + np.random.normal(0, 0.5)
y = 1.5 * x + 10 + noise

result = engle_granger_cointegration(y, x)
print("Engle-Granger cointegration:")
for k, v in result.items():
    print(f"  {k:22s}: {v}")`,
    explanation:
      "Engle-Granger tests for cointegration by checking whether the regression residuals (the estimated spread) have a unit root: a stationary residual means a linear combination of two I(1) series is I(0) — the spread is mean-reverting. The half-life translates the AR(1) coefficient into a practical metric: a half-life of 5-20 days is actionable for a pairs trading strategy, while >60 days makes convergence too slow to be profitable after financing costs.",
  },
  {
    id: "pyfin-20260606-b1-ou-estimation",
    language: "python",
    title: "Ornstein-Uhlenbeck MLE — speed of mean reversion from spread data",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def ou_mle(spread: np.ndarray, dt: float = 1.0/252) -> dict:
    """
    Exact MLE for Ornstein-Uhlenbeck process:
    dX = kappa*(theta - X)*dt + sigma*dW
    Conditional distribution: X_{t+dt}|X_t ~ N(mu_cond, var_cond)
    mu_cond  = X_t * exp(-kappa*dt) + theta*(1 - exp(-kappa*dt))
    var_cond = sigma^2 / (2*kappa) * (1 - exp(-2*kappa*dt))
    """
    n = len(spread) - 1
    X0, X1 = spread[:-1], spread[1:]

    def neg_loglik(params):
        kappa, theta, sigma = params
        if kappa <= 0 or sigma <= 0: return 1e10
        e_kdt   = np.exp(-kappa * dt)
        mu_c    = X0 * e_kdt + theta * (1 - e_kdt)
        var_c   = sigma**2 / (2*kappa) * (1 - np.exp(-2*kappa*dt))
        if var_c <= 0: return 1e10
        ll = -0.5 * (np.log(2*np.pi*var_c) + (X1 - mu_c)**2 / var_c)
        return -ll.sum()

    # Starting guess: kappa from autocorrelation, theta=mean, sigma=std.
    rho0  = np.corrcoef(X0, X1)[0,1]
    kappa0 = max(-np.log(rho0) / dt, 0.01)
    x0 = [kappa0, spread.mean(), spread.std() * np.sqrt(2*kappa0)]

    res = minimize(neg_loglik, x0, method='L-BFGS-B',
                   bounds=[(1e-4, 100), (-1e6, 1e6), (1e-8, 1e6)])
    kappa, theta, sigma = res.x

    half_life    = np.log(2) / kappa
    e_kdt        = np.exp(-kappa * dt)
    eq_var       = sigma**2 / (2*kappa)
    eq_vol_annual = np.sqrt(eq_var * 252)

    # Fitted residuals.
    mu_fit = X0 * e_kdt + theta * (1 - e_kdt)
    resid  = X1 - mu_fit
    r2     = 1 - resid.var() / X1.var()

    return {
        'kappa':           round(kappa, 5),
        'theta':           round(theta, 5),
        'sigma':           round(sigma, 5),
        'half_life_days':  round(half_life / dt, 2),  # in days
        'eq_vol_annual':   round(eq_vol_annual, 5),
        'log_lik':         round(-res.fun, 2),
        'R2':              round(r2, 5),
    }

np.random.seed(15)
dt  = 1.0/252
n   = 500
kappa_true, theta_true, sigma_true = 5.0, 0.0, 0.02
spread = np.zeros(n)
for t in range(1, n):
    e = np.exp(-kappa_true * dt)
    spread[t] = (spread[t-1] * e + theta_true * (1-e)
                 + sigma_true * np.sqrt((1-e**2)/(2*kappa_true)) * np.random.randn())

result = ou_mle(spread, dt)
print("OU MLE estimates:")
for k, v in result.items():
    print(f"  {k:20s}: {v}")
print(f"  True kappa={kappa_true}, theta={theta_true}, sigma={sigma_true}")`,
    explanation:
      "The exact conditional distribution of the OU process is Gaussian (not an approximation), so MLE is just a weighted least-squares problem. The kappa (mean-reversion speed) parameter is the most important for trading: kappa=5/year gives half_life=ln(2)/5 ≈ 50 days, while kappa=50/year gives half_life=5 days. Estimating kappa with only ~200 data points is unreliable — the confidence interval spans an order of magnitude, which is why many pairs traders rely on the ADF test rather than OU MLE.",
  },
  {
    id: "pyfin-20260606-b1-risk-parity",
    language: "python",
    title: "Risk parity portfolio — equal risk contribution (ERC) via SciPy",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_parity(cov: np.ndarray, max_iter: int = 1000) -> dict:
    """
    Equal Risk Contribution (ERC) portfolio: each asset contributes the
    same marginal contribution to total portfolio variance.
    Marginal Risk Contribution: MRC_i = (Sigma*w)_i * w_i / sigma_p.
    ERC condition: MRC_i = MRC_j for all i,j.
    Solved via Spinu (2013) / Cholesky alternating projection.
    """
    N = cov.shape[0]

    def portfolio_vol(w): return np.sqrt(w @ cov @ w)

    def risk_contributions(w):
        sigma_p = portfolio_vol(w)
        mrc     = cov @ w                          # marginal risk (un-normalised)
        rc      = w * mrc / sigma_p                # risk contribution
        return rc

    # Objective: minimise sum of squared deviations from equal risk.
    def objective(w):
        rc    = risk_contributions(w)
        rc_eq = portfolio_vol(w) / N               # target = equal share
        return np.sum((rc - rc_eq)**2)

    # Constraints: weights sum to 1, non-negative.
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]
    bounds      = [(0.001, 1.0)] * N
    w0          = np.full(N, 1.0 / N)

    result = minimize(objective, w0, method='SLSQP',
                      bounds=bounds, constraints=constraints,
                      options={'ftol': 1e-12, 'maxiter': max_iter})
    w = result.x
    w = np.maximum(w, 0)
    w /= w.sum()

    sigma_p = portfolio_vol(w)
    rc      = risk_contributions(w)

    # Compare with equal-weight.
    w_eq   = np.full(N, 1.0/N)
    rc_eq_ = risk_contributions(w_eq)

    return {
        'weights':        np.round(w, 5),
        'sigma_p_%':      round(sigma_p * np.sqrt(252) * 100, 3),
        'risk_contribs':  np.round(rc / rc.sum(), 5),   # fractional
        'max_rc_deviation': round(np.abs(rc - rc.mean()).max() / rc.mean(), 6),
        'ew_risk_contribs': np.round(rc_eq_ / rc_eq_.sum(), 4),
    }

np.random.seed(5)
N = 5
A = np.random.randn(N, N)
cov = (A @ A.T / N + 0.5 * np.diag([0.04, 0.01, 0.09, 0.02, 0.06]))
cov = cov / 252   # daily covariance

result = risk_parity(cov)
print("Risk parity weights:    ", result['weights'])
print("Risk contributions:     ", result['risk_contribs'])
print("EW risk contributions:  ", result['ew_risk_contribs'])
print("Annualised vol:          ", result['sigma_p_%'], "%")
print("Max RC deviation:        ", result['max_rc_deviation'])`,
    explanation:
      "Risk parity assigns weights inversely proportional to each asset's risk contribution — low-vol assets (bonds) get much larger notional weights than high-vol assets (equities). The ERC condition is stricter than minimum variance: while MV concentrates in the lowest-vol assets, ERC ensures diversification across all risk sources. In practice, risk parity portfolios are heavily levered (bond-heavy portfolios are low-vol) and sensitive to correlation changes.",
  },
  {
    id: "pyfin-20260606-b1-cvar-lp",
    language: "python",
    title: "CVaR minimisation — linear programming formulation (Rockafellar-Uryasev)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import linprog

def cvar_portfolio_optimisation(
    returns: np.ndarray,    # (T, N) scenario matrix
    alpha: float = 0.95,    # confidence level (CVaR_{1-alpha} of losses)
    target_return: float = None,
    long_only: bool = True,
) -> dict:
    """
    Minimise CVaR via the Rockafellar-Uryasev (2000) LP reformulation.
    CVaR_alpha = VaR_alpha + 1/((1-alpha)*T) * sum_t max(-r_t'w - VaR, 0).
    Auxiliary variables z_t >= 0: z_t >= -r_t'w - zeta (zeta = VaR).
    LP: min zeta + 1/((1-alpha)*T) * sum z_t  s.t. w>=0, sum(w)=1, z_t>=0.
    """
    T, N = returns.shape
    c_level = 1 - alpha

    # Variables: [w (N), zeta (1), z (T)]
    # Objective: min zeta + 1/(c_level*T) * sum(z)
    c_vec = np.concatenate([np.zeros(N), [1.0], np.full(T, 1.0 / (c_level * T))])

    # Constraints: z_t + r_t'w + zeta >= 0 -> z_t >= -r_t'w - zeta.
    # -r_t'w - zeta + z_t >= 0 for all t.
    # In linprog: A_ub @ x <= b_ub => use -1 * constraint.
    A_z   = np.zeros((T, N + 1 + T))
    for t in range(T):
        A_z[t, :N]        = -returns[t]    # -r_t' w
        A_z[t, N]         = -1             # -zeta
        A_z[t, N + 1 + t] = -1            # -z_t
    b_z = np.zeros(T)

    # Equality: sum(w) = 1.
    A_eq = np.zeros((1, N + 1 + T))
    A_eq[0, :N] = 1.0
    b_eq = np.array([1.0])

    # Bounds: w >= 0 (long-only), zeta free, z >= 0.
    bounds = ([(0, None)] * N if long_only else [(None, None)] * N) + \
             [(None, None)] + [(0, None)] * T

    # Optional minimum return constraint.
    if target_return is not None:
        A_ret         = np.zeros((1, N + 1 + T))
        A_ret[0, :N]  = -returns.mean(axis=0)   # -E[r]'w <= -target
        b_ret         = np.array([-target_return])
        A_ub = np.vstack([A_z, A_ret])
        b_ub = np.concatenate([b_z, b_ret])
    else:
        A_ub, b_ub = A_z, b_z

    res = linprog(c_vec, A_ub=A_ub, b_ub=b_ub,
                  A_eq=A_eq, b_eq=b_eq,
                  bounds=bounds, method='highs')

    if not res.success:
        return {'error': res.message}

    w     = res.x[:N]
    w     = np.maximum(w, 0); w /= w.sum()
    zeta  = res.x[N]    # VaR
    z     = res.x[N+1:]
    cvar  = zeta + z.mean() / c_level

    port_ret = returns @ w
    return {
        'weights':       np.round(w, 5),
        'VaR_%':         round(-zeta * 100, 3),
        'CVaR_%':        round(-cvar * 100, 3),
        'mean_return_%': round(port_ret.mean() * 252 * 100, 3),
        'sharpe':        round(port_ret.mean() / port_ret.std() * np.sqrt(252), 3),
    }

np.random.seed(42)
T, N = 500, 6
returns = np.random.multivariate_normal(
    mean=np.array([0.0008, 0.0005, 0.0010, 0.0004, 0.0007, 0.0003]),
    cov=np.eye(N) * 0.0001 + 0.00005,
    size=T
)

result = cvar_portfolio_optimisation(returns, alpha=0.95)
print("CVaR-optimal portfolio:")
for k, v in result.items():
    print(f"  {k:18s}: {v}")`,
    explanation:
      "Rockafellar-Uryasev showed that CVaR minimisation is a linear program: the non-smooth max() in the CVaR definition is linearised by introducing one auxiliary variable per scenario. This is significant because CVaR is a coherent risk measure (unlike VaR) and the LP solves efficiently for thousands of scenarios. The LP formulation is also convex in the weights, so it can be combined with other linear constraints (sector limits, turnover bounds) without losing tractability.",
  },
  {
    id: "pyfin-20260606-b1-cir-mle",
    language: "python",
    title: "CIR model MLE calibration — chi-squared exact transition density",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import ncx2
from scipy.optimize import minimize

def cir_mle(rates: np.ndarray, dt: float = 1.0/252) -> dict:
    """
    CIR (Cox-Ingersoll-Ross 1985): dr = kappa*(theta-r)*dt + sigma*sqrt(r)*dW.
    Exact transition density: non-central chi-squared distribution.
    r_{t+dt} | r_t ~ (c/(2*kappa)) * chi2(df, nc) where:
      c   = 2*kappa / (sigma^2 * (1 - exp(-kappa*dt)))
      df  = 4*kappa*theta / sigma^2
      nc  = 2*c*r_t*exp(-kappa*dt)
    """
    r0, r1 = rates[:-1], rates[1:]

    def neg_loglik(params):
        kappa, theta, sigma = params
        if kappa <= 0 or theta <= 0 or sigma <= 0: return 1e10
        if 2*kappa*theta < sigma**2: return 1e10   # Feller condition

        c   = 2*kappa / (sigma**2 * (1 - np.exp(-kappa*dt)))
        df  = 4*kappa*theta / sigma**2
        nc  = 2*c * r0 * np.exp(-kappa*dt)
        x   = 2*c * r1

        # Non-central chi-squared log-PDF.
        ll = ncx2.logpdf(x, df=df, nc=nc) + np.log(2*c)
        return -ll.sum()

    # Starting guesses.
    mu_r  = rates.mean()
    var_r = rates.var()
    kappa0 = 0.5
    theta0 = mu_r
    sigma0 = np.sqrt(var_r * 2 * kappa0 / mu_r)

    res = minimize(neg_loglik, [kappa0, theta0, sigma0], method='L-BFGS-B',
                   bounds=[(1e-4, 20), (1e-5, 0.5), (1e-4, 1.0)],
                   options={'ftol': 1e-12, 'maxiter': 5000})
    kappa, theta, sigma = res.x
    feller = 2*kappa*theta / sigma**2

    # Bond price: P(0,T) = A(T)*exp(-B(T)*r0).
    def cir_bond(r, T):
        h = np.sqrt(kappa**2 + 2*sigma**2)
        A = ((2*h*np.exp(0.5*(kappa+h)*T))
             / (2*h + (kappa+h)*(np.exp(h*T)-1)))**(2*kappa*theta/sigma**2)
        B = (2*(np.exp(h*T)-1)) / (2*h + (kappa+h)*(np.exp(h*T)-1))
        return A * np.exp(-B * r)

    r_now = rates[-1]
    return {
        'kappa':         round(kappa, 5),
        'theta_%':       round(theta*100, 4),
        'sigma':         round(sigma, 5),
        'feller_ratio':  round(feller, 3),   # >1 ensures r stays positive
        'half_life_d':   round(np.log(2)/kappa/dt, 1),
        'log_lik':       round(-res.fun, 2),
        '5Y_bond':       round(cir_bond(r_now, 5.0), 5),
        '10Y_bond':      round(cir_bond(r_now, 10.0), 5),
    }

np.random.seed(8)
n    = 2520   # 10 years daily
r    = np.zeros(n); r[0] = 0.04
dt   = 1/252
kappa_t, theta_t, sigma_t = 0.86, 0.05, 0.024
for t in range(1, n):
    r[t] = (r[t-1] + kappa_t*(theta_t-r[t-1])*dt
            + sigma_t*np.sqrt(max(r[t-1],0)*dt)*np.random.randn())
    r[t] = max(r[t], 1e-6)

result = cir_mle(r, dt)
print("CIR MLE calibration:")
for k, v in result.items():
    print(f"  {k:18s}: {v}")`,
    explanation:
      "The CIR model's exact transition density is a non-central chi-squared distribution (scaled), which makes MLE straightforward and avoids the discretisation error of Euler-approximated likelihoods. The Feller condition (2κθ ≥ σ²) ensures the short rate never touches zero — a critical stability requirement for positive-rate models. CIR bond prices have the same A(T)*exp(-B(T)*r) affine structure as Vasicek but with time-varying volatility that prevents negative rates.",
  },
  {
    id: "pyfin-20260606-b1-sortino-calmar",
    language: "python",
    title: "Sortino, Calmar, Omega — downside-focused performance metrics",
    tag: "finance",
    code: `import numpy as np

def downside_metrics(returns: np.ndarray,
                      rf_daily: float = 0.05/252,
                      mar: float = 0.0) -> dict:
    """
    Compute Sharpe, Sortino, Calmar, Omega, and Ulcer Index.
    All annualised assuming 252 trading days.
    mar: minimum acceptable return for downside deviation.
    """
    n    = len(returns)
    mu   = returns.mean()
    std  = returns.std(ddof=1)
    ann  = 252

    # Sharpe (excess return / total vol).
    sharpe = (mu - rf_daily) / std * np.sqrt(ann)

    # Sortino (excess return / downside deviation below MAR).
    downside = np.minimum(returns - mar, 0.0)
    semi_std = np.sqrt((downside**2).mean())   # semi-deviation
    sortino  = (mu - rf_daily) / semi_std * np.sqrt(ann) if semi_std > 0 else 0

    # Max drawdown and Calmar (annualised return / max drawdown).
    cum_ret  = np.cumprod(1 + returns)
    peak     = np.maximum.accumulate(cum_ret)
    dd       = (cum_ret - peak) / peak
    max_dd   = abs(dd.min())
    ann_ret  = (cum_ret[-1] ** (ann / n)) - 1
    calmar   = ann_ret / max_dd if max_dd > 0 else 0

    # Omega ratio: P(return > threshold) / P(return < threshold) weighted.
    threshold = 0.0
    gains     = np.sum(np.maximum(returns - threshold, 0))
    losses    = np.sum(np.maximum(threshold - returns, 0))
    omega     = gains / losses if losses > 0 else np.inf

    # Ulcer Index: RMS of drawdown (penalises deep AND prolonged drawdowns).
    ulcer = np.sqrt((dd**2).mean())

    # Pain ratio (Calmar with Ulcer instead of max DD).
    pain_ratio = ann_ret / ulcer if ulcer > 0 else 0

    # Hit rate and profit factor.
    wins      = returns[returns > 0]
    losses_arr= returns[returns < 0]
    hit_rate  = len(wins) / n
    pf        = wins.sum() / abs(losses_arr.sum()) if len(losses_arr) > 0 else np.inf

    return {
        'ann_return_%':  round(ann_ret * 100, 3),
        'ann_vol_%':     round(std * np.sqrt(ann) * 100, 3),
        'sharpe':        round(sharpe, 3),
        'sortino':       round(sortino, 3),
        'calmar':        round(calmar, 3),
        'omega':         round(float(omega), 3),
        'max_dd_%':      round(max_dd * 100, 3),
        'ulcer_index':   round(ulcer * 100, 3),
        'pain_ratio':    round(pain_ratio, 3),
        'hit_rate_%':    round(hit_rate * 100, 2),
        'profit_factor': round(float(pf), 3),
    }

np.random.seed(42)
# Strategy A: high Sharpe, moderate drawdown.
rets_a = np.random.normal(0.0008, 0.010, 1260)
# Strategy B: higher return but occasional large losses.
rets_b = np.random.normal(0.0010, 0.012, 1260)
rets_b[::50] -= 0.08   # periodic large loss events

print("Strategy A metrics:")
for k, v in downside_metrics(rets_a).items():
    print(f"  {k:18s}: {v}")
print("\\nStrategy B metrics:")
for k, v in downside_metrics(rets_b).items():
    print(f"  {k:18s}: {v}")`,
    explanation:
      "Sortino penalises only downside volatility, making it more appropriate than Sharpe for strategies with positively-skewed returns (options selling strategies appear worse under Sharpe). Calmar focuses on survival: a strategy with 20% annual return but 40% drawdown (Calmar=0.5) is less attractive than one with 15% return and 10% drawdown (Calmar=1.5). Omega subsumes both: it equals 1 plus Sharpe ratio for normal distributions but captures skewness for non-normal return distributions.",
  },
  {
    id: "pyfin-20260606-b1-barrier-closed",
    language: "python",
    title: "Barrier option closed-form — down-and-out call and in/out parity",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def barrier_options(S: float, K: float, B: float,
                     r: float, q: float, sigma: float, T: float) -> dict:
    """
    Closed-form prices for continuous barrier options (Merton 1973 / Reiner-Rubinstein 1991).
    Down-and-out call (DOC): activated only if S stays above barrier B throughout.
    Down-and-in call (DIC): activated if S touches B from above.
    Parity: DOC + DIC = vanilla call (in + out = vanilla).
    Condition: B < S, B < K for standard DOC.
    """
    if B >= S:
        return {'error': 'Barrier must be below current spot for down barriers'}

    def d1(F, X): return (np.log(F/X) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    def d2(F, X): return d1(F, X) - sigma*np.sqrt(T)
    def N(x):     return norm.cdf(x)

    # Vanilla call.
    vanilla = S*np.exp(-q*T)*N(d1(S,K)) - K*np.exp(-r*T)*N(d2(S,K))

    # Reflection principle parameters.
    mu_  = (r - q - 0.5*sigma**2) / sigma**2   # drift in log-space normalised
    lam_ = np.sqrt(mu_**2 + 2*r/sigma**2)

    x1 = np.log(S/K)/(sigma*np.sqrt(T)) + (1+mu_)*sigma*np.sqrt(T)
    x2 = np.log(S/B)/(sigma*np.sqrt(T)) + (1+mu_)*sigma*np.sqrt(T)
    y1 = np.log(B**2/(S*K))/(sigma*np.sqrt(T)) + (1+mu_)*sigma*np.sqrt(T)
    y2 = np.log(B/S)/(sigma*np.sqrt(T)) + (1+mu_)*sigma*np.sqrt(T)

    eqT = np.exp(-q*T)
    erT = np.exp(-r*T)

    A = S*eqT*N(x1)   - K*erT*N(x1 - sigma*np.sqrt(T))
    B_ = S*eqT*N(x2)  - K*erT*N(x2 - sigma*np.sqrt(T))
    C = S*eqT*(B/S)**(2*(mu_+1)) * N(y1) - K*erT*(B/S)**(2*mu_) * N(y1 - sigma*np.sqrt(T))
    D = S*eqT*(B/S)**(2*(mu_+1)) * N(y2) - K*erT*(B/S)**(2*mu_) * N(y2 - sigma*np.sqrt(T))

    if K >= B:
        doc = A - C
        dic = vanilla - doc
    else:
        doc = B_ - D
        dic = vanilla - doc

    # Digital down-and-out (pays $1 if S stays above B until T and S_T > K).
    digital_doc = erT * N(x1 - sigma*np.sqrt(T)) - erT*(B/S)**(2*mu_)*N(y1 - sigma*np.sqrt(T))

    return {
        'vanilla_call':  round(vanilla, 5),
        'DOC':           round(doc, 5),    # down-and-out call
        'DIC':           round(dic, 5),    # down-and-in call
        'parity_check':  round(doc + dic - vanilla, 10),   # should be ~0
        'digital_DOC':   round(digital_doc, 5),
        'barrier_pct':   round(B/S*100, 1),
    }

# ATM call, barrier at 85% of spot.
result = barrier_options(S=100, K=100, B=85, r=0.05, q=0.0, sigma=0.20, T=1.0)
print("Barrier option prices:")
for k, v in result.items():
    print(f"  {k:15s}: {v}")`,
    explanation:
      "The reflection principle gives the exact price of a continuous barrier option by subtracting the probability contribution from paths that crossed the barrier. In/out parity (DOC + DIC = vanilla call) is the most important identity: it means a barrier option cannot be worth more than the vanilla, and the value is divided between in and out based on how likely the barrier is to be hit. The formula assumes continuous monitoring — discrete daily observation creates a systematic upward bias in DOC prices that must be corrected via the Broadie-Glasserman-Kou adjustment.",
  },
  {
    id: "pyfin-20260606-b1-factor-risk",
    language: "python",
    title: "Barra-style factor risk decomposition — systematic vs idiosyncratic",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm

def factor_risk_decomposition(portfolio_returns: np.ndarray,
                                factor_returns: np.ndarray,
                                factor_names: list[str]) -> dict:
    """
    Multi-factor risk decomposition (Barra / MSCI style).
    portfolio_returns: (T,) array of daily portfolio returns.
    factor_returns:    (T, K) array of K factor returns.
    Decomposes: sigma_p^2 = beta' * Sigma_f * beta + sigma_eps^2.
    """
    T, K = factor_returns.shape

    # OLS regression to estimate factor exposures (betas).
    X = sm.add_constant(factor_returns)
    model = sm.OLS(portfolio_returns, X).fit(cov_type='HAC',
                                              cov_kwds={'maxlags': 5})
    alpha = model.params[0]
    betas = model.params[1:]

    resid = model.resid   # idiosyncratic returns

    # Factor covariance matrix (annualised).
    Sigma_f = np.cov(factor_returns.T) * 252

    # Systematic variance: beta' * Sigma_f * beta.
    sys_var = float(betas @ Sigma_f @ betas)

    # Idiosyncratic variance.
    idio_var = float(resid.var(ddof=1) * 252)

    # Total variance.
    total_var = sys_var + idio_var

    # Factor contribution to total variance.
    # Contribution of factor k: beta_k * (Sigma_f @ beta)[k].
    factor_contrib = betas * (Sigma_f @ betas)

    # Marginal contribution to risk (MCTR).
    sigma_p = np.sqrt(total_var)
    mctr_factor = factor_contrib / sigma_p   # dVol/d(beta_k)

    # Information ratio.
    ir = alpha * 252 / (np.sqrt(idio_var))

    return {
        'alpha_ann_%':         round(alpha * 252 * 100, 3),
        'betas':               np.round(betas, 4),
        'R2':                  round(model.rsquared, 4),
        'sigma_p_ann_%':       round(sigma_p * 100, 3),
        'sys_var_%':           round(sys_var / total_var * 100, 2),
        'idio_var_%':          round(idio_var / total_var * 100, 2),
        'factor_variance_%':   np.round(factor_contrib / total_var * 100, 3),
        'MCTR_pct':            np.round(mctr_factor * 100, 4),
        'IR':                  round(ir, 3),
        'factor_names':        factor_names,
    }

np.random.seed(42)
T = 252
factor_names = ['Market', 'Value', 'Momentum', 'Low_Vol']
K = len(factor_names)
# Simulate factors and a portfolio with known exposures.
F = np.random.multivariate_normal(
    mean=np.zeros(K),
    cov=np.eye(K) * 0.0001 + 0.00003,
    size=T
)
true_betas = np.array([1.05, 0.20, 0.30, -0.15])
true_alpha = 0.0002
eps        = np.random.normal(0, 0.005, T)
port_rets  = true_alpha + F @ true_betas + eps

result = factor_risk_decomposition(port_rets, F, factor_names)
print("Factor risk decomposition:")
for k, v in result.items():
    print(f"  {k:22s}: {v}")`,
    explanation:
      "Factor risk decomposition separates portfolio variance into systematic (explained by factors) and idiosyncratic (stock-specific) components. In a well-diversified fund, idiosyncratic risk should be < 20% — higher idio_var% means the fund has concentrated bets not explained by style factors. MCTR (Marginal Contribution to Total Risk) is the derivative of portfolio vol with respect to each factor exposure: it shows which factor bets are consuming the most risk budget.",
  },
  {
    id: "pyfin-20260606-b1-gamma-scalping",
    language: "python",
    title: "Gamma scalping P&L — delta-hedging simulation with transaction costs",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_greeks(S, K, r, sigma, T):
    if T <= 0: return {'price': max(S-K,0), 'delta': 1.0 if S>K else 0.0, 'gamma': 0.0}
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    nd1 = norm.pdf(d1)
    price = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
    delta = norm.cdf(d1)
    gamma = nd1 / (S * sigma * np.sqrt(T))
    vega  = S * nd1 * np.sqrt(T)
    return {'price': price, 'delta': delta, 'gamma': gamma, 'vega': vega}

def gamma_scalp_simulation(
    S0: float = 100, K: float = 100, r: float = 0.05,
    sigma_real: float = 0.25,    # true realised vol
    sigma_impl: float = 0.20,    # implied vol (option priced at this)
    T: float = 0.25,             # 3-month option
    n_steps: int = 63,           # trading days
    hedge_freq: int = 1,         # re-hedge every n days
    tc_bps: float = 2.0,         # transaction cost in bps of traded notional
    n_paths: int = 10_000,
    seed: int = 42,
) -> dict:
    """
    Simulate P&L from delta-hedging an ATM call at implied vol,
    when realised vol differs from implied vol.
    Expected daily P&L = 0.5 * Gamma * S^2 * (sigma_real^2 - sigma_impl^2) * dt.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    tc  = tc_bps / 10000

    total_pnl = np.zeros(n_paths)

    for path_idx in range(n_paths):
        S    = S0
        g    = bs_greeks(S, K, r, sigma_impl, T)
        delta_held = g['delta']
        option_val = g['price']
        cash       = -(option_val - delta_held * S)   # sell option, buy delta shares
        pnl        = 0.0

        for step in range(n_steps):
            t_rem  = T - step * dt
            Z      = rng.standard_normal()
            dS     = S * ((r - 0.5*sigma_real**2)*dt + sigma_real*np.sqrt(dt)*Z)
            S_new  = S + dS

            # Update cash with interest.
            cash *= np.exp(r * dt)

            # New delta from option model.
            g_new      = bs_greeks(S_new, K, r, sigma_impl, max(t_rem - dt, 1e-6))
            delta_new  = g_new['delta']

            # Re-hedge every hedge_freq steps.
            if step % hedge_freq == 0:
                trade_qty  = delta_new - delta_held
                trade_cost = abs(trade_qty) * S_new * tc
                cash      -= trade_qty * S_new + trade_cost
                delta_held = delta_new

            S = S_new

        # Unwind: close position at expiry.
        payoff     = max(S - K, 0.0)   # option payout
        cash      += delta_held * S    # sell shares
        total_pnl[path_idx] = cash + payoff

    expected_pnl_theory = (0.5 * bs_greeks(S0,K,r,sigma_impl,T)['gamma']
                            * S0**2 * (sigma_real**2 - sigma_impl**2) * T)
    return {
        'mean_pnl':        round(total_pnl.mean(), 4),
        'std_pnl':         round(total_pnl.std(), 4),
        'theory_pnl':      round(expected_pnl_theory, 4),
        'pct_positive':    round((total_pnl > 0).mean() * 100, 1),
        'sharpe_pnl':      round(total_pnl.mean() / total_pnl.std(), 3),
    }

result = gamma_scalp_simulation()
print("Gamma scalping simulation:")
for k, v in result.items():
    print(f"  {k:18s}: {v}")`,
    explanation:
      "Gamma scalping P&L arises from the difference between realised and implied variance: the delta-hedge portfolio earns 0.5*Γ*S²*(σ²_real - σ²_impl)*dt per step, integrated over the option's life. When realised vol > implied vol, the long-gamma position profits; when realised vol < implied vol, it loses. Transaction costs erode the P&L roughly in proportion to the square root of hedge frequency — optimal hedging frequency balances gamma profits against transaction costs.",
  },
  {
    id: "pyfin-20260606-b1-turnover-markowitz",
    language: "python",
    title: "Turnover-constrained Markowitz — rebalancing with L1 penalty",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def turnover_constrained_mvo(
    mu: np.ndarray,
    cov: np.ndarray,
    w_current: np.ndarray,
    risk_aversion: float = 5.0,
    max_turnover: float = 0.20,   # max total one-way turnover (sum |w_new - w_cur|/2)
    tc_per_unit: float = 0.001,   # transaction cost per unit traded
    long_only: bool = True,
) -> dict:
    """
    MVO with turnover constraint and transaction cost penalty.
    Objective: mu'w - (risk_aversion/2)*w'Sigma*w - tc * sum|w - w_cur|.
    Transaction cost term is convex but non-smooth; reformulate via aux vars.
    """
    N = len(mu)
    # Split trades into buys (b) and sells (s): b - s = w_new - w_current.
    # Variables: [w (N), b (N), s (N)].
    # Objective: -mu'w + (ra/2)*w'Sigma*w + tc*(sum b + sum s).

    def objective(x):
        w = x[:N]
        b, s = x[N:2*N], x[2*N:3*N]
        ret  = mu @ w
        risk = 0.5 * risk_aversion * float(w @ cov @ w)
        tc_cost = tc_per_unit * (b.sum() + s.sum())
        return -ret + risk + tc_cost

    def grad(x):
        w = x[:N]; b, s = x[N:2*N], x[2*N:3*N]
        gw = -mu + risk_aversion * (cov @ w)
        gb = np.full(N, tc_per_unit)
        gs = np.full(N, tc_per_unit)
        return np.concatenate([gw, gb, gs])

    # Constraints: w - w_cur = b - s, b>=0, s>=0.
    # w_i = w_cur_i + b_i - s_i -> Equality constraint.
    A_eq = np.zeros((N, 3*N))
    A_eq[:, :N] = np.eye(N)
    A_eq[:, N:2*N] = -np.eye(N)
    A_eq[:, 2*N:3*N] = np.eye(N)
    b_eq = w_current

    constraints = [
        {'type': 'eq', 'fun': lambda x: A_eq @ x - b_eq},
        {'type': 'eq', 'fun': lambda x: x[:N].sum() - 1.0},  # sum(w)=1
        # Turnover: sum(b+s)/2 <= max_turnover.
        {'type': 'ineq', 'fun': lambda x: max_turnover - 0.5*(x[N:2*N]+x[2*N:3*N]).sum()},
    ]

    if long_only:
        bounds = [(0, 1)]*N + [(0, 1)]*N + [(0, 1)]*N
    else:
        bounds = [(-1, 1)]*N + [(0, 1)]*N + [(0, 1)]*N

    x0 = np.concatenate([w_current,
                          np.maximum(w_current, 0) * 0.01,
                          np.maximum(-w_current, 0) * 0.01])

    res = minimize(objective, x0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-11, 'maxiter': 2000})

    w_new = np.maximum(res.x[:N], 0)
    w_new /= w_new.sum()
    trades   = w_new - w_current
    turnover = np.abs(trades).sum() / 2

    return {
        'w_new':    np.round(w_new, 5),
        'trades':   np.round(trades, 5),
        'turnover': round(turnover, 4),
        'exp_ret_%': round(float(mu @ w_new) * 252 * 100, 3),
        'vol_%':    round(np.sqrt(float(w_new @ cov @ w_new) * 252) * 100, 3),
    }

np.random.seed(42)
N = 6
A = np.random.randn(N, N)
cov = (A @ A.T / N + np.eye(N) * 0.5) / 252
mu  = np.random.uniform(0.0005, 0.0015, N)
w0  = np.ones(N) / N   # start equal weight

result = turnover_constrained_mvo(mu, cov, w0, max_turnover=0.10)
print("Turnover-constrained MVO:")
for k, v in result.items():
    print(f"  {k:15s}: {v}")`,
    explanation:
      "Unconstrained MVO produces high-turnover portfolios because small changes in estimated means cause large weight reallocation. The turnover constraint (sum |w_new - w_cur| / 2 ≤ T) directly limits the one-way volume traded per rebalance. Splitting trades into buy/sell variables (b, s) linearises the absolute-value objective into a quadratic-with-linear-constraints problem that SLSQP handles efficiently. In practice, the optimal rebalancing frequency balances alpha decay against transaction costs.",
  },
];
