import type { Snippet } from "./types";

export const pythonFinanceSnippets20260805B1: Snippet[] = [
  {
    id: "pyfin-20260805-b1-sabr-calibration",
    language: "python",
    title: "SABR Model Calibration to Implied Vol Smile",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan (2002) SABR lognormal implied vol approximation.
    F: forward; K: strike; T: expiry; alpha: initial vol;
    beta: backbone (0=normal, 1=lognormal); rho: spot-vol corr; nu: vol-of-vol
    """
    if abs(F - K) < 1e-8:  # ATM case
        FK_beta = F**(1 - beta)
        term1   = alpha / FK_beta
        term2   = 1 + ((1-beta)**2/24 * alpha**2/FK_beta**2
                       + rho*beta*nu*alpha/(4*FK_beta)
                       + (2-3*rho**2)*nu**2/24) * T
        return term1 * term2

    log_FK = np.log(F / K)
    FK_mid = (F * K)**((1 - beta)/2)
    z      = nu / alpha * FK_mid * log_FK
    xi     = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    denom  = FK_mid * (1 + (1-beta)**2/24 * log_FK**2
                         + (1-beta)**4/1920 * log_FK**4)
    A      = alpha / denom

    B1 = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**2
              + rho*beta*nu*alpha/(4*FK_mid)
              + (2-3*rho**2)*nu**2/24) * T

    return A * (z / xi) * B1

def calibrate_sabr(F, T, strikes, market_vols, beta=0.5):
    """Fit alpha, rho, nu to observed strike-vol pairs."""
    def obj(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e9
        model_vols = [sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes]
        return np.sum((np.array(model_vols) - np.array(market_vols))**2)

    best_res = None
    for a0 in [0.10, 0.20, 0.30]:
        res = minimize(obj, [a0, -0.3, 0.4], method='Nelder-Mead',
                       options={'xatol': 1e-8, 'maxiter': 5000})
        if best_res is None or res.fun < best_res.fun:
            best_res = res

    alpha, rho, nu = best_res.x
    return dict(alpha=alpha, rho=rho, nu=nu, beta=beta,
                rmse=np.sqrt(best_res.fun / len(strikes)) * 100)

F, T = 100.0, 1.0
strikes      = [80, 90, 95, 100, 105, 110, 120]
market_vols  = [0.32, 0.26, 0.23, 0.21, 0.20, 0.20, 0.22]
result = calibrate_sabr(F, T, strikes, market_vols, beta=0.5)
print(result)
fitted_vols = [sabr_vol(F, K, T, result['alpha'], result['beta'],
                        result['rho'], result['nu']) for K in strikes]
print("Fitted vols:", [f"{v:.4f}" for v in fitted_vols])`,
    explanation: "SABR calibration fits three parameters (alpha=initial vol, rho=spot-vol correlation, nu=vol-of-vol) to a cross-section of implied vols at fixed maturity. Negative rho produces a downward-sloping skew (equity smile); positive rho produces an upward smile (commodity smile). Beta controls the backbone: beta=1 is lognormal SABR (flat ATM vol as F moves), beta=0 is normal SABR."
  },
  {
    id: "pyfin-20260805-b1-vasicek-mle",
    language: "python",
    title: "Vasicek Short Rate Maximum Likelihood Estimation",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def vasicek_loglik(params, r_series: np.ndarray, dt: float) -> float:
    """
    Exact MLE for Vasicek dr = kappa*(theta-r)*dt + sigma*dW
    via the Gaussian transition density.
    """
    kappa, theta, sigma = params
    if kappa <= 0 or sigma <= 0:
        return 1e10
    n   = len(r_series) - 1
    r_t = r_series[:-1]
    r_T = r_series[1:]
    # Conditional mean and variance of r_{t+dt} | r_t
    e   = np.exp(-kappa * dt)
    mu  = r_t * e + theta * (1 - e)
    var = sigma**2 / (2*kappa) * (1 - e**2)
    if var <= 0:
        return 1e10
    # Log-likelihood of Gaussian transitions
    ll  = -0.5 * (n * np.log(2*np.pi*var) + np.sum((r_T - mu)**2) / var)
    return -ll  # negate for minimisation

def fit_vasicek(rates: np.ndarray, dt: float = 1/252):
    """Fit Vasicek kappa, theta, sigma to daily short-rate observations."""
    res = minimize(vasicek_loglik, [2.0, rates.mean(), rates.std()],
                   args=(rates, dt), method='L-BFGS-B',
                   bounds=[(0.01, 50), (-0.2, 0.5), (1e-4, 0.5)])
    kappa, theta, sigma = res.x
    half_life = np.log(2) / kappa
    return dict(kappa=kappa, theta=theta, sigma=sigma,
                half_life_days=half_life * 252,
                loglik=-res.fun)

rng    = np.random.default_rng(13)
# Simulate Vasicek with kappa=3, theta=0.04, sigma=0.012
r = np.zeros(1000); r[0] = 0.04
dt_sim = 1/252
for t in range(1, 1000):
    r[t] = r[t-1] + 3*(0.04 - r[t-1])*dt_sim + 0.012*np.sqrt(dt_sim)*rng.standard_normal()

result = fit_vasicek(r, dt_sim)
print(f"kappa={result['kappa']:.3f} (true=3.0)")
print(f"theta={result['theta']:.4f} (true=0.040)")
print(f"sigma={result['sigma']:.4f} (true=0.012)")
print(f"mean-reversion half-life: {result['half_life_days']:.1f} trading days")`,
    explanation: "The Vasicek model has an exact Gaussian transition density (not just approximate), so MLE is exact rather than approximate. The conditional mean is theta*(1-e^{-kappa*dt}) + r_t*e^{-kappa*dt} and variance is sigma^2/(2*kappa)*(1-e^{-2*kappa*dt}). MLE consistently estimates all three parameters with standard errors of order 1/sqrt(T), but kappa is the hardest to estimate precisely because mean reversion is slow relative to sample lengths."
  },
  {
    id: "pyfin-20260805-b1-hrp",
    language: "python",
    title: "Hierarchical Risk Parity via Ward Linkage",
    tag: "portfolio",
    code: `import numpy as np
from scipy.cluster.hierarchy import linkage, dendrogram, to_tree
from scipy.spatial.distance import squareform

def hrp_weights(returns: np.ndarray) -> np.ndarray:
    """
    Hierarchical Risk Parity (Lopez de Prado 2016).
    1. Compute corr matrix → distance matrix → hierarchical clusters
    2. Quasi-diagonalise the corr matrix via cluster ordering
    3. Bisect: allocate inverse-variance within each cluster subtree
    """
    n = returns.shape[1]
    # Step 1: correlation-based distance
    C    = np.corrcoef(returns.T)
    dist = np.sqrt(0.5 * (1 - C))
    np.fill_diagonal(dist, 0.0)

    # Step 2: Ward linkage and dendrogram ordering
    condensed = squareform(dist)
    link      = linkage(condensed, method='ward')

    # Leaf order from the dendrogram (quasi-diagonalisation)
    def get_leaf_order(node):
        if node.is_leaf():
            return [node.id]
        return get_leaf_order(node.left) + get_leaf_order(node.right)

    root, _ = to_tree(link, rd=True)
    order   = get_leaf_order(root)

    # Step 3: Recursive bisection with inverse-variance weights
    cov = np.cov(returns.T)
    w   = np.ones(n)

    def bisect(cluster):
        if len(cluster) <= 1:
            return
        split = len(cluster) // 2
        left, right = cluster[:split], cluster[split:]

        # Cluster variances (sum of weights in left/right sub-clusters)
        def cluster_var(c):
            sub_cov = cov[np.ix_(c, c)]
            iv = 1.0 / np.diag(sub_cov)
            iv_w = iv / iv.sum()
            return float(iv_w @ sub_cov @ iv_w)

        var_L, var_R = cluster_var(left), cluster_var(right)
        alpha = 1 - var_L / (var_L + var_R)
        w[left]  *= alpha
        w[right] *= 1 - alpha
        bisect(left)
        bisect(right)

    bisect(order)
    return w / w.sum()

rng = np.random.default_rng(7)
T, N = 250, 10
R    = rng.normal(0, 0.01, (T, N)) + rng.normal(0, 0.008, (T, 1))  # common factor
w    = hrp_weights(R)
print("HRP weights:", np.round(w, 4))
print("Sum:", round(w.sum(), 6))`,
    explanation: "Hierarchical Risk Parity avoids inversion of the covariance matrix — the source of instability in mean-variance optimisation with many assets. Ward linkage groups assets by correlation distance; the dendrogram defines a hierarchy for recursive bisection where each split allocates capital proportional to the inverse variance of each sub-cluster. HRP is robust to estimation error and produces better out-of-sample Sharpe than Markowitz on realistic equity universes."
  },
  {
    id: "pyfin-20260805-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Regression for Alpha Estimation",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd
from scipy.stats import t as t_dist
from typing import Tuple

def fama_french_regression(
    asset_returns: np.ndarray,   # (T,) excess returns over risk-free
    mkt_rf: np.ndarray,          # (T,) market excess return
    smb: np.ndarray,             # (T,) Small-minus-Big factor
    hml: np.ndarray,             # (T,) High-minus-Low factor
) -> dict:
    """
    OLS regression: r_t - rf_t = alpha + beta_m*MKT + beta_s*SMB + beta_v*HML + eps_t
    Returns coefficients, t-stats, R^2, alpha and Newey-West se.
    """
    T = len(asset_returns)
    X = np.column_stack([np.ones(T), mkt_rf, smb, hml])  # (T, 4)
    y = asset_returns

    # OLS: beta = (X'X)^-1 X'y
    XtX     = X.T @ X
    Xty     = X.T @ y
    beta    = np.linalg.solve(XtX, Xty)
    resid   = y - X @ beta
    sse     = resid @ resid
    sst     = np.sum((y - y.mean())**2)
    R2      = 1 - sse / sst

    # Newey-West standard errors (HAC, lag=4)
    lags    = 4
    Omega   = resid**2 * (X * X)  # outer product per obs for homosked base
    meat_NW = X.T @ np.diag(resid**2) @ X  # White heterosked base
    for lag in range(1, lags + 1):
        w_l = 1 - lag / (lags + 1)
        Gamma_l = (X[lag:].T * resid[lag:]) @ (X[:-lag] * resid[:-lag, None])
        meat_NW += w_l * (Gamma_l + Gamma_l.T)
    bread   = np.linalg.inv(XtX)
    cov_NW  = bread @ meat_NW @ bread
    se_NW   = np.sqrt(np.diag(cov_NW))
    t_stats = beta / se_NW
    p_vals  = 2 * (1 - t_dist.cdf(np.abs(t_stats), df=T-4))

    return dict(alpha=beta[0]*252, beta_mkt=beta[1], beta_smb=beta[2],
                beta_hml=beta[3], alpha_tstat=t_stats[0],
                alpha_pval=p_vals[0], R2=R2)

rng  = np.random.default_rng(55)
T    = 500
MKT  = rng.normal(0.0004, 0.01, T)
SMB  = rng.normal(0.0001, 0.007, T)
HML  = rng.normal(0.0002, 0.008, T)
# True: alpha=5bps/day, moderate loading on MKT and SMB
y    = 0.0005 + 1.1*MKT + 0.4*SMB + 0.1*HML + rng.normal(0, 0.006, T)

res = fama_french_regression(y, MKT, SMB, HML)
print(f"Annual alpha (annualised): {res['alpha']*100:.2f}%")
print(f"Alpha t-stat: {res['alpha_tstat']:.3f}  p={res['alpha_pval']:.4f}")
print(f"Beta_MKT: {res['beta_mkt']:.3f}  Beta_SMB: {res['beta_smb']:.3f}")
print(f"R^2: {res['R2']:.4f}")`,
    explanation: "Fama-French 3-factor regression decomposes returns into market, size, and value exposures. Alpha (Jensen's alpha, annualised) represents return not explained by systematic factors — the sought-after skill component. Newey-West standard errors correct for autocorrelation and heteroskedasticity in residuals, providing valid inference even when errors are clustered or have time-varying variance."
  },
  {
    id: "pyfin-20260805-b1-johansen-cointegration",
    language: "python",
    title: "Johansen Cointegration Test for Pairs Trading",
    tag: "factor-models",
    code: `import numpy as np
from scipy.linalg import eig

def johansen_test(Y: np.ndarray, det_order: int = 0, k_ar: int = 1):
    """
    Johansen (1988) maximum eigenvalue test for cointegration.
    Y: (T, n) matrix of I(1) series
    det_order: 0=no trend, 1=constant, 2=trend in levels
    k_ar: number of lagged differences in VECM
    Returns: eigenvalues, sorted descending; 95% critical values (simplified).
    """
    T, n = Y.shape
    # Build VECM: delta_Y_t = Pi * Y_{t-1} + sum Gamma_i * delta_Y_{t-i} + eps
    dY = np.diff(Y, axis=0)
    T1 = len(dY) - k_ar

    # R0: residuals of dY_t on lagged differences (and det. terms)
    # R1: residuals of Y_{t-1} on lagged differences
    def residuals(LHS, RHS_extra=None):
        T_ = len(LHS)
        Z  = np.column_stack([np.ones(T_)] + [dY[k_ar - i - 1:T_ + k_ar - i - 1]
                                              for i in range(k_ar)])
        if RHS_extra is not None:
            Z = np.column_stack([Z, RHS_extra])
        B  = np.linalg.lstsq(Z, LHS, rcond=None)[0]
        return LHS - Z @ B

    R0 = residuals(dY[k_ar:])             # (T1, n)
    R1 = residuals(Y[k_ar-1:T1+k_ar-1])  # (T1, n)

    # S00, S11, S01
    S00 = R0.T @ R0 / T1
    S11 = R1.T @ R1 / T1
    S01 = R0.T @ R1 / T1

    # Solve generalised eigenvalue problem: S01 S11^-1 S10 - lambda * S00
    S11_inv = np.linalg.inv(S11)
    M       = np.linalg.solve(S00, S01) @ S11_inv @ S01.T
    eigenvalues = np.sort(np.real(np.linalg.eigvals(M)))[::-1]
    eigenvalues = np.maximum(eigenvalues, 0)  # numerical clipping

    # Trace statistic: test H0: at most r cointegrating vectors
    trace_stats = [-T1 * np.sum(np.log(1 - eigenvalues[r:])) for r in range(n)]
    # Simplified 95% critical values for n=2: [15.41, 3.76]
    crit_95_trace_n2 = [15.41, 3.76]

    return dict(eigenvalues=eigenvalues, trace_stats=trace_stats,
                crit_95=crit_95_trace_n2 if n == 2 else None)

rng = np.random.default_rng(21)
T   = 500
# Cointegrated pair: Y1 and Y2 share a common stochastic trend
trend = np.cumsum(rng.normal(0, 1, T))  # common I(1) factor
Y1    = trend + rng.normal(0, 0.5, T)
Y2    = 0.8 * trend + 2.0 + rng.normal(0, 0.5, T)
Y     = np.column_stack([Y1, Y2])

res   = johansen_test(Y, det_order=0, k_ar=1)
print("Eigenvalues:", np.round(res['eigenvalues'], 4))
print("Trace stats:", np.round(res['trace_stats'], 2))
print("95% crit:   ", res['crit_95'])
print("Cointegrated (r>=1):", res['trace_stats'][0] > res['crit_95'][0])`,
    explanation: "The Johansen test determines the number of cointegrating relationships in a multivariate system without specifying which series is the dependent variable. The trace statistic tests H0: at most r cointegrating vectors by summing log(1-eigenvalue) — rejection at r=0 means at least one long-run equilibrium exists. For pairs trading, finding r=1 identifies the spread to mean-revert."
  },
  {
    id: "pyfin-20260805-b1-kalman-hedge-ratio",
    language: "python",
    title: "Time-Varying Hedge Ratio via Kalman Filter for Pairs Trading",
    tag: "factor-models",
    code: `import numpy as np

def kalman_pairs_hedge(y: np.ndarray, x: np.ndarray,
                        delta: float = 1e-5, R_noise: float = 0.001):
    """
    Local-level model: y_t = beta_t * x_t + alpha_t + eps_t
    State [alpha_t, beta_t] evolves as random walk (process noise delta).
    Kalman filter estimates time-varying hedge ratio beta_t online.
    """
    T   = len(y)
    n_s = 2  # state dim: [alpha, beta]

    # Initialise
    theta = np.array([0.0, 1.0])   # initial [alpha, beta]
    P     = np.eye(n_s) * 1.0     # initial covariance

    Q = delta / (1 - delta) * np.eye(n_s)  # process noise

    thetas = np.zeros((T, n_s))
    spreads = np.zeros(T)

    for t in range(T):
        H = np.array([1.0, x[t]])  # observation vector

        # Predict
        # theta_pred = theta (random walk: no dynamics)
        P_pred = P + Q

        # Update
        S     = H @ P_pred @ H + R_noise
        K     = P_pred @ H / S   # Kalman gain (n_s,)
        innov = y[t] - H @ theta

        theta = theta + K * innov
        P     = (np.eye(n_s) - np.outer(K, H)) @ P_pred

        thetas[t]  = theta
        spreads[t] = innov

    return dict(alpha=thetas[:, 0], beta=thetas[:, 1], spread=spreads)

rng = np.random.default_rng(9)
T   = 500
common = np.cumsum(rng.normal(0, 1, T))
x = common + rng.normal(0, 0.5, T)
# True beta drifts from 1.0 to 1.5
true_beta = np.linspace(1.0, 1.5, T)
y = true_beta * x + 0.5 + rng.normal(0, 0.3, T)

res = kalman_pairs_hedge(y, x, delta=5e-5)
print("Initial beta estimate:", round(res['beta'][0], 3))
print("Final beta estimate  :", round(res['beta'][-1], 3))
print("True final beta      :", round(true_beta[-1], 3))
print("Spread std           :", round(res['spread'].std(), 4))
print("Spread mean reversion test:",
      abs(res['spread'][-1]) < 2*res['spread'].std())`,
    explanation: "A Kalman filter with a random-walk state model estimates a time-varying hedge ratio that adapts to structural drift in the cointegrating relationship — critical for real-world pairs where betas shift with sector rotations and corporate events. Delta controls the process noise variance relative to measurement noise; small delta means the hedge ratio changes slowly (more stable but lags regime changes)."
  },
  {
    id: "pyfin-20260805-b1-delta-normal-var",
    language: "python",
    title: "Parametric Delta-Normal VaR and CVaR",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def delta_normal_var(positions: np.ndarray, deltas: np.ndarray,
                      cov_matrix: np.ndarray, confidence: float = 0.99,
                      holding_period: int = 1) -> dict:
    """
    Delta-normal parametric VaR.
    positions: (N,) notional positions
    deltas:    (N,) delta sensitivities (dV/dS_i)
    cov_matrix: (N, N) daily return covariance of N risk factors
    Returns 1-day VaR scaled to holding_period.
    """
    w = positions * deltas  # dollar delta vector
    port_var_1d = w @ cov_matrix @ w
    port_vol_h  = np.sqrt(port_var_1d * holding_period)

    z   = norm.ppf(confidence)
    VaR = z * port_vol_h

    # CVaR (Expected Shortfall): E[loss | loss > VaR] = vol * phi(z) / (1 - conf)
    CVaR = port_vol_h * norm.pdf(z) / (1 - confidence)

    # Marginal VaR: dVaR/d(position_i) — contribution to total VaR
    cov_w    = cov_matrix @ w
    mvars    = z * cov_w * np.sqrt(holding_period) / port_vol_h * positions

    return dict(VaR=VaR, CVaR=CVaR, port_vol_annual=port_vol_h*np.sqrt(252),
                marginal_VaR=mvars, component_VaR=mvars,
                pct_contribution=mvars / VaR * 100)

rng = np.random.default_rng(42)
N   = 5
# Random factor covariance (annualised to daily)
vols = np.array([0.20, 0.15, 0.25, 0.18, 0.22]) / np.sqrt(252)
corr = np.array([[1.0, 0.5, 0.3, 0.2, 0.1],
                  [0.5, 1.0, 0.4, 0.3, 0.2],
                  [0.3, 0.4, 1.0, 0.5, 0.3],
                  [0.2, 0.3, 0.5, 1.0, 0.4],
                  [0.1, 0.2, 0.3, 0.4, 1.0]])
cov = np.outer(vols, vols) * corr

positions = np.array([1e6, -5e5, 8e5, -2e5, 3e5])
deltas    = np.ones(N)   # linear instruments (delta = 1)

res = delta_normal_var(positions, deltas, cov, confidence=0.99, holding_period=10)
print(f"10-day 99% VaR : \${res['VaR']:,.0f}")
print(f"10-day 99% CVaR: \${res['CVaR']:,.0f}")
print("Component VaR %:", np.round(res['pct_contribution'], 1))`,
    explanation: "Delta-normal VaR linearises the portfolio value around current deltas and assumes normally distributed returns, giving a closed-form formula VaR = z * sigma_portfolio. CVaR (Expected Shortfall) = sigma * phi(z)/(1-confidence), always higher than VaR and convex — making it the Basel III/IV risk measure for capital requirements. Marginal VaR = dVaR/dw_i decomposes total VaR into per-position contributions that sum to the portfolio VaR."
  },
  {
    id: "pyfin-20260805-b1-historical-var-decay",
    language: "python",
    title: "Historical Simulation VaR with Exponential Decay Weighting",
    tag: "risk",
    code: `import numpy as np

def historical_var_decay(pnl: np.ndarray, confidence: float = 0.99,
                          decay: float = 0.98,
                          holding_period: int = 1) -> dict:
    """
    Historical simulation VaR with exponential decay weighting (EWHS).
    Recent observations get higher weight — adapts faster to vol regime changes.
    pnl: (T,) array of daily portfolio P&L (losses are negative)
    decay: lambda (0.94 is RiskMetrics standard; 0.98 = slower decay)
    """
    T = len(pnl)
    # Weights: w_t = decay^(T-t-1) for t=0..T-1, normalised
    weights = decay ** np.arange(T - 1, -1, -1, dtype=float)
    weights /= weights.sum()

    # Sort P&L ascending (worst first) along with weights
    order   = np.argsort(pnl)
    sorted_pnl     = pnl[order]
    sorted_weights = weights[order]

    # Weighted CDF: find the (1-confidence) quantile
    cum_w  = np.cumsum(sorted_weights)
    alpha  = 1 - confidence
    idx    = np.searchsorted(cum_w, alpha)
    VaR    = -sorted_pnl[min(idx, T-1)]  # sign: VaR is positive loss

    # Weighted ES: mean of tail P&L weighted by tail weights
    tail_mask = cum_w <= alpha
    if tail_mask.any():
        tail_pnl  = sorted_pnl[tail_mask]
        tail_wt   = sorted_weights[tail_mask]
        ES        = -np.average(tail_pnl, weights=tail_wt)
    else:
        ES        = VaR

    # Scaled to holding period (sqrt-of-time rule)
    VaR_h = VaR * np.sqrt(holding_period)
    ES_h  = ES  * np.sqrt(holding_period)

    return dict(VaR=VaR, CVaR=ES, VaR_h=VaR_h, CVaR_h=ES_h,
                effective_window=1/(1-decay))

rng   = np.random.default_rng(77)
# Regime shift: quiet period then stressed
quiet  = rng.normal(0, 0.5e6, 500)
stress = rng.normal(-1e5, 2e6, 100)
pnl    = np.concatenate([quiet, stress])

res_eq     = historical_var_decay(pnl, confidence=0.99, decay=1.0)   # equal weights
res_decay  = historical_var_decay(pnl, confidence=0.99, decay=0.97)  # EWHS

print(f"Equal-weight 99% 1d VaR : \${res_eq['VaR']:,.0f}")
print(f"EWHS (0.97)  99% 1d VaR : \${res_decay['VaR']:,.0f}")
print(f"Effective window (EWHS) : {res_decay['effective_window']:.0f} days")`,
    explanation: "Exponentially-weighted historical simulation (EWHS) downweights old observations by lambda^(T-t), making VaR respond faster to volatility regime changes — uniform historical VaR with T=500 days is slow to forget a quiet period 2 years ago. The effective window 1/(1-lambda) gives the equivalent number of uniform observations; lambda=0.97 gives ~33 days of effective history vs 500 for equal-weight."
  },
  {
    id: "pyfin-20260805-b1-backtest-slippage",
    language: "python",
    title: "Backtesting Framework with Slippage and Market Impact Models",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd

def backtest_with_costs(signals: pd.DataFrame, prices: pd.DataFrame,
                         adv: pd.DataFrame,
                         fixed_spread_bps: float = 5.0,
                         market_impact_coeff: float = 0.1,
                         max_pct_adv: float = 0.05) -> pd.Series:
    """
    Backtest a cross-sectional signal with transaction cost models.
    signals: (T, N) target weights
    prices:  (T, N) close prices
    adv:     (T, N) average daily volume in shares
    fixed_spread_bps: bid-ask spread assumption (round-trip)
    market_impact_coeff: Almgren-Chriss linear impact coefficient
    max_pct_adv: clip position to % of ADV
    Returns daily strategy returns net of costs.
    """
    T, N      = signals.shape
    portfolio = 1e6   # $1M notional
    prev_w    = pd.Series(np.zeros(N), index=signals.columns)
    rets      = []

    for t in range(1, T):
        price_today = prices.iloc[t]
        price_prev  = prices.iloc[t-1]
        daily_ret   = (price_today / price_prev - 1).fillna(0)

        # Target weights from signal
        target_w = signals.iloc[t-1]
        target_w = target_w / (target_w.abs().sum() + 1e-9)  # dollar-neutral

        # Turnover and ADV-based sizing
        turnover  = (target_w - prev_w).abs()
        shares    = portfolio * turnover / price_today.clip(lower=0.01)
        adv_today = adv.iloc[t].clip(lower=1)
        pct_adv   = shares / adv_today
        scale      = np.where(pct_adv > max_pct_adv, max_pct_adv / pct_adv, 1.0)
        target_w_clipped = prev_w + (target_w - prev_w) * pd.Series(scale, index=target_w.index)

        # Gross return
        gross_ret = (target_w_clipped * daily_ret).sum()

        # Costs: fixed spread + linear market impact
        spread_cost = turnover.sum() * fixed_spread_bps / 2 / 1e4
        impact_cost = (market_impact_coeff * pct_adv * turnover).sum()

        rets.append(gross_ret - spread_cost - impact_cost)
        prev_w = target_w_clipped.copy()

    return pd.Series(rets, index=prices.index[1:], name='net_return')

rng  = np.random.default_rng(31)
T, N = 252, 20
df_prices  = pd.DataFrame(100 * np.exp(np.cumsum(rng.normal(0.0002, 0.015, (T,N)), axis=0)),
                           columns=[f'S{i}' for i in range(N)])
df_adv     = pd.DataFrame(np.full((T, N), 1e6))
df_adv.columns = df_prices.columns

# Random signal (mean-reverting)
df_signals = pd.DataFrame(rng.normal(0, 1, (T, N)), columns=df_prices.columns)

net_rets = backtest_with_costs(df_signals, df_prices, df_adv)
sharpe   = net_rets.mean() / net_rets.std() * np.sqrt(252)
print(f"Annualised net return: {net_rets.mean()*252*100:.2f}%")
print(f"Net Sharpe: {sharpe:.3f}")`,
    explanation: "Realistic backtesting must model two cost components: fixed spread (half-spread paid on every share traded, regardless of size) and market impact (Almgren-Chriss linear impact: proportional to participation rate pct_adv). ADV capping prevents the backtest from assuming unrealistic position sizes — a 5% ADV limit is standard for mid-cap stocks. Gross Sharpe >> Net Sharpe is a common signal that the signal doesn't survive real-world execution."
  },
  {
    id: "pyfin-20260805-b1-efficient-frontier",
    language: "python",
    title: "Mean-Variance Efficient Frontier with Constraints",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def efficient_frontier(mu: np.ndarray, Sigma: np.ndarray,
                        n_points: int = 50,
                        allow_short: bool = False) -> dict:
    """
    Trace the mean-variance efficient frontier by solving:
    min w' Sigma w  s.t.  w' mu = target_ret, sum(w)=1, [w>=0]
    for a range of target returns.
    """
    n = len(mu)
    constraints = [{'type': 'eq', 'fun': lambda w: w.sum() - 1}]
    bounds = None if allow_short else [(0.0, 1.0)] * n

    # Min-variance portfolio (no return constraint)
    res_mv = minimize(lambda w: w @ Sigma @ w, np.full(n, 1/n),
                      method='SLSQP', bounds=bounds, constraints=constraints,
                      options={'ftol': 1e-10})
    mu_mv = res_mv.x @ mu

    # Max-return portfolio
    mu_max = mu.max() if allow_short else (mu * (res_mv.x > 0.01)).max()
    mu_max = mu.max()

    frontier_vols, frontier_rets, frontier_weights = [], [], []
    for target in np.linspace(mu_mv, mu_max, n_points):
        cons = constraints + [{'type': 'eq', 'fun': lambda w, t=target: w @ mu - t}]
        res  = minimize(lambda w: w @ Sigma @ w, res_mv.x,
                        method='SLSQP', bounds=bounds, constraints=cons,
                        options={'ftol': 1e-12})
        if res.success:
            frontier_vols.append(np.sqrt(res.x @ Sigma @ res.x) * np.sqrt(252))
            frontier_rets.append(res.x @ mu * 252)
            frontier_weights.append(res.x)

    sharpes = [r/v for r, v in zip(frontier_rets, frontier_vols)]
    best_idx = int(np.argmax(sharpes))
    return dict(vols=frontier_vols, rets=frontier_rets,
                weights=frontier_weights,
                tangency_idx=best_idx,
                tangency_weights=frontier_weights[best_idx],
                max_sharpe=sharpes[best_idx])

rng  = np.random.default_rng(11)
N    = 8
vols = rng.uniform(0.10, 0.30, N)
corr = np.full((N,N), 0.3); np.fill_diagonal(corr, 1.0)
Sig  = np.outer(vols, vols) * corr / 252
mu   = rng.uniform(0.05, 0.20, N) / 252

ef   = efficient_frontier(mu, Sig, n_points=30, allow_short=False)
print(f"Tangency portfolio Sharpe: {ef['max_sharpe']:.3f}")
print(f"Tangency weights: {np.round(ef['tangency_weights'], 3)}")
print(f"Frontier vol range: [{min(ef['vols']):.3f}, {max(ef['vols']):.3f}]")`,
    explanation: "The efficient frontier is traced by solving a quadratic program for the minimum-variance portfolio at each target return level. The tangency portfolio (maximum Sharpe ratio on the frontier) is where the capital market line from the risk-free rate is tangent to the frontier. Without short-selling, the frontier is bounded by individual asset maximum returns and minimum variances — corner solutions arise frequently."
  },
  {
    id: "pyfin-20260805-b1-risk-neutral-density",
    language: "python",
    title: "Risk-Neutral Density Extraction via Breeden-Litzenberger",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    if T <= 0 or sigma <= 0:
        return max(S - K, 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def extract_rnd(S: float, r: float, T: float,
                strikes: np.ndarray, iv_surface) -> dict:
    """
    Breeden-Litzenberger (1978): q(K) = e^{rT} * d^2 C / d K^2
    Risk-neutral density = second derivative of call price w.r.t. strike.
    iv_surface: callable K -> implied vol (smooth function, e.g. SABR fitted).
    """
    # Dense strike grid for numerical differentiation
    K_grid = np.linspace(strikes[0], strikes[-1], 300)
    C      = np.array([bs_call(S, K, r, iv_surface(K), T) for K in K_grid])

    dK     = K_grid[1] - K_grid[0]
    # Second derivative via central differences
    d2C    = np.gradient(np.gradient(C, dK), dK)
    rnd    = np.exp(r * T) * d2C

    # Clip negative values (numerical artefacts at tails)
    rnd    = np.maximum(rnd, 0.0)
    # Normalise to integrate to 1
    mass   = np.trapz(rnd, K_grid)
    rnd_n  = rnd / (mass + 1e-12)

    # Risk-neutral moments
    E_K     = np.trapz(K_grid * rnd_n, K_grid)
    E_K2    = np.trapz(K_grid**2 * rnd_n, K_grid)
    var_K   = E_K2 - E_K**2
    skew_K  = (np.trapz((K_grid - E_K)**3 * rnd_n, K_grid)) / var_K**1.5
    kurt_K  = (np.trapz((K_grid - E_K)**4 * rnd_n, K_grid)) / var_K**2

    return dict(K=K_grid, rnd=rnd_n, mean=E_K, std=np.sqrt(var_K),
                skewness=skew_K, excess_kurtosis=kurt_K - 3)

S, r, T = 100.0, 0.05, 1.0
K_obs   = np.linspace(70, 130, 20)
# Negatively skewed smile
iv_func = lambda K: 0.20 + 0.08 * np.log(S / K)
result  = extract_rnd(S, r, T, K_obs, iv_func)
print(f"RND mean    : {result['mean']:.4f}  (expect ~{S*np.exp(r*T):.2f})")
print(f"RND std     : {result['std']:.4f}")
print(f"RND skewness: {result['skewness']:.4f}  (expect negative for equity smile)")`,
    explanation: "The Breeden-Litzenberger formula extracts the unique risk-neutral density from option prices via the second derivative of calls with respect to strike. A negatively-skewed RND (left tail heavier than lognormal) corresponds to a negative vol skew: OTM puts are expensive because the market assigns higher probability to left-tail outcomes. The RND mean equals the forward price S*exp(rT) under no-arbitrage."
  },
  {
    id: "pyfin-20260805-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion for Optimal Position Sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(win_prob: float, win_loss_ratio: float) -> float:
    """
    Simple Kelly (binary outcome): f* = p - (1-p)/b
    p: probability of winning; b: win/loss ratio (odds)
    """
    return win_prob - (1 - win_prob) / win_loss_ratio

def continuous_kelly(mu: float, sigma: float, r: float = 0.0) -> float:
    """
    Continuous Kelly for lognormal asset: f* = (mu - r) / sigma^2
    This is the Merton proportion for maximising log-wealth growth.
    mu: expected log return (per period)
    sigma: log return volatility
    r: risk-free rate
    """
    return (mu - r) / (sigma**2)

def half_kelly_backtest(returns: np.ndarray, kelly_fraction_f: float,
                         max_leverage: float = 2.0) -> dict:
    """
    Backtest wealth growth under f (or fractional Kelly: f/2 for safety).
    """
    f   = min(kelly_fraction_f, max_leverage)
    W   = np.cumprod(1 + f * returns)
    dd  = 1 - W / np.maximum.accumulate(W)
    return dict(final_wealth=W[-1], max_drawdown=dd.max(),
                sharpe=returns.mean()/returns.std()*np.sqrt(252),
                kelly_sharpe=(f*returns).mean()/(f*returns).std()*np.sqrt(252))

rng  = np.random.default_rng(19)
T    = 1000
# Strategy with edge: mu=15bps/day, sigma=1%
mu, sigma = 0.0015, 0.01
rets = rng.normal(mu, sigma, T)

f_full  = continuous_kelly(mu, sigma)
f_half  = f_full / 2
f_quart = f_full / 4

print(f"Full Kelly fraction: {f_full:.4f}")
print(f"Half Kelly fraction: {f_half:.4f}")
res_full = half_kelly_backtest(rets, f_full)
res_half = half_kelly_backtest(rets, f_half)

for name, f, res in [("Full", f_full, res_full), ("Half", f_half, res_half)]:
    print(f"\\n{name} Kelly (f={f:.3f}):")
    print(f"  Terminal wealth: {res['final_wealth']:.2f}x")
    print(f"  Max drawdown   : {res['max_drawdown']*100:.1f}%")`,
    explanation: "The Kelly fraction maximises the expected log-wealth growth rate — equivalently, the long-run compound growth rate. For a continuous lognormal asset, f* = (mu - r)/sigma^2 — the Merton proportion. Half-Kelly is the standard hedge fund practice: it sacrifices ~25% of expected growth but cuts variance in half and maximum drawdown by approximately the same factor, dramatically improving practical risk management."
  },
  {
    id: "pyfin-20260805-b1-fx-vol-smile",
    language: "python",
    title: "FX Volatility Smile via Risk Reversal and Butterfly",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bs_call(F, K, sigma, T, disc):
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2  = d1 - sigma*np.sqrt(T)
    return disc * (F*norm.cdf(d1) - K*norm.cdf(d2))

def bs_put(F, K, sigma, T, disc):
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2  = d1 - sigma*np.sqrt(T)
    return disc * (K*norm.cdf(-d2) - F*norm.cdf(-d1))

def delta_to_strike(delta: float, F: float, sigma: float, T: float,
                     call: bool = True) -> float:
    """Convert delta-quoted FX option to absolute strike."""
    d1_target = norm.ppf(delta if call else -delta)
    log_FK = d1_target * sigma * np.sqrt(T) - 0.5 * sigma**2 * T
    return F * np.exp(-log_FK)

def build_fx_smile(atm_vol: float, rr_25: float, bf_25: float,
                    F: float, T: float, r_d: float, r_f: float,
                    delta_grid: np.ndarray = None) -> dict:
    """
    Construct FX vol smile from market quotes:
    ATM vol (delta-neutral straddle)
    25-delta Risk Reversal = vol_25C - vol_25P
    25-delta Butterfly = (vol_25C + vol_25P)/2 - atm_vol
    """
    disc = np.exp(-r_d * T)
    # Recover 25-delta call and put vols
    vol_25C = atm_vol + 0.5*rr_25 + bf_25
    vol_25P = atm_vol - 0.5*rr_25 + bf_25

    K_atm = F * np.exp(-0.5 * atm_vol**2 * T)  # delta-neutral ATM
    K_25C = delta_to_strike(0.25, F, vol_25C, T, call=True)
    K_25P = delta_to_strike(0.25, F, vol_25P, T, call=False)

    strikes = np.sort([K_25P, K_atm, K_25C])
    vols    = np.array([vol_25P, atm_vol, vol_25C])

    # Simple linear interpolation for illustration
    if delta_grid is None:
        delta_grid = np.linspace(0.05, 0.50, 20)
    K_interp = np.array([delta_to_strike(d, F, atm_vol, T) for d in delta_grid])
    vol_interp = np.interp(K_interp, strikes, vols)

    return dict(K_25P=K_25P, K_atm=K_atm, K_25C=K_25C,
                vol_25P=vol_25P, atm_vol=atm_vol, vol_25C=vol_25C,
                K_grid=K_interp, vol_grid=vol_interp)

# EUR/USD: ATM 8%, RR = -1% (euro put skew), BF = 0.5%
result = build_fx_smile(0.08, -0.01, 0.005, F=1.10, T=0.25, r_d=0.05, r_f=0.03)
print(f"25-delta put strike : {result['K_25P']:.4f}  vol={result['vol_25P']*100:.2f}%")
print(f"ATM strike          : {result['K_atm']:.4f}  vol={result['atm_vol']*100:.2f}%")
print(f"25-delta call strike: {result['K_25C']:.4f}  vol={result['vol_25C']*100:.2f}%")`,
    explanation: "FX options are quoted in delta space (25-delta, 10-delta) rather than by strike because it makes cross-maturity comparisons scale-invariant. Risk Reversal = vol_call - vol_put captures skewness; Butterfly = average(wing vols) - ATM captures excess kurtosis/smile curvature. A negative RR (put vol > call vol) indicates tail hedging demand for downside protection, common in EURUSD and USDJPY."
  },
  {
    id: "pyfin-20260805-b1-lookback-mc",
    language: "python",
    title: "Fixed-Strike Lookback Option Pricing via Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np

def lookback_call_mc(S0: float, K: float, r: float, sigma: float, T: float,
                      n_paths: int = 200_000, n_steps: int = 252,
                      seed: int = 42) -> dict:
    """
    Fixed-strike lookback call: payoff = max(max_t S(t) - K, 0)
    Floating-strike lookback call: payoff = S(T) - min_t S(t)
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)
    drift = (r - 0.5*sigma**2)*dt
    vol   = sigma*np.sqrt(dt)

    S       = np.full(n_paths, S0, dtype=np.float64)
    S_max   = np.full(n_paths, S0, dtype=np.float64)
    S_min   = np.full(n_paths, S0, dtype=np.float64)

    for _ in range(n_steps):
        Z = rng.standard_normal(n_paths)
        S *= np.exp(drift + vol*Z)
        np.maximum(S_max, S, out=S_max)
        np.minimum(S_min, S, out=S_min)

    # Fixed-strike lookback call: pays max over path vs K
    pay_fixed_call = np.maximum(S_max - K, 0.0)
    # Fixed-strike lookback put: pays K vs min over path
    pay_fixed_put  = np.maximum(K - S_min, 0.0)
    # Floating-strike lookback call: S(T) - min (always ITM)
    pay_float_call = np.maximum(S - S_min, 0.0)

    price_fc = disc * pay_fixed_call.mean()
    price_fp = disc * pay_fixed_put.mean()
    price_fl = disc * pay_float_call.mean()

    se_fc = disc * pay_fixed_call.std() / np.sqrt(n_paths)

    return dict(fixed_call=price_fc, fixed_put=price_fp,
                float_call=price_fl, se_fixed_call=se_fc)

res = lookback_call_mc(S0=100, K=100, r=0.05, sigma=0.20, T=1.0)
print(f"Fixed-strike lookback call : {res['fixed_call']:.4f} ± {res['se_fixed_call']:.4f}")
print(f"Fixed-strike lookback put  : {res['fixed_put']:.4f}")
print(f"Floating-strike lookback call: {res['float_call']:.4f}")
print(f"Lookback premium vs vanilla (≈10.45): extra={res['fixed_call']-10.45:.4f}")`,
    explanation: "A lookback option pays based on the maximum or minimum of the asset price path, not just the terminal value. Fixed-strike lookback calls are more expensive than vanilla calls (they see the maximum, not just the terminal price) and the premium grows with sigma and T because more time gives the path more opportunity to reach a high maximum. Floating-strike lookbacks always expire ITM (S_T - S_min >= 0) and price around 2× the ATM call."
  },
  {
    id: "pyfin-20260805-b1-forward-rate-agreement",
    language: "python",
    title: "Forward Rate Agreement (FRA) Pricing and Convexity Adjustment",
    tag: "fixed-income",
    code: `import numpy as np

def fra_npv(F_market: float, K: float, notional: float,
            delta: float, P_T2: float) -> float:
    """
    FRA NPV (receive fixed K, pay floating F):
    NPV = (K - F) * delta * N * P(0, T2)
    F_market: current forward rate for period [T1, T2]
    delta:    day-count fraction (e.g. 0.25 for 3m)
    P_T2:     discount factor to payment date T2
    """
    return (K - F_market) * delta * notional * P_T2

def forward_libor(P_T1: float, P_T2: float, delta: float) -> float:
    """Forward LIBOR rate L(0; T1, T2) = (P(0,T1)/P(0,T2) - 1) / delta"""
    return (P_T1 / P_T2 - 1.0) / delta

def fra_convexity_adj(sigma_r: float, T1: float, T2: float,
                       rho_LR: float = 1.0) -> float:
    """
    FRA vs futures convexity adjustment (Hull & White, 1990):
    adj = -0.5 * sigma_r^2 * T1 * T2
    Adjusts futures rate down to FRA rate.
    Only significant for long-dated contracts (T1 > 1y).
    """
    return -0.5 * sigma_r**2 * T1 * T2

# Example: 3x6 FRA (fixes in 3m, settles in 6m)
r0     = 0.05
P_3m   = np.exp(-r0 * 0.25)   # P(0, 3m)
P_6m   = np.exp(-r0 * 0.50)   # P(0, 6m)
delta  = 0.25                  # 3-month accrual
K_fra  = 0.051                 # agreed fixed rate

F_fwd  = forward_libor(P_3m, P_6m, delta)
npv    = fra_npv(F_fwd, K_fra, notional=1e6, delta=delta, P_T2=P_6m)
adj    = fra_convexity_adj(sigma_r=0.01, T1=0.25, T2=0.50)

print(f"Forward LIBOR 3x6 : {F_fwd*100:.4f}%")
print(f"FRA NPV (K=5.1%)  : \${npv:,.2f}")
print(f"Convexity adj (bps): {adj*1e4:.4f}")
print(f"Direction: {'receive fixed profit' if npv > 0 else 'receive fixed loss'}",
      f"because F={'<' if F_fwd < K_fra else '>'} K")`,
    explanation: "An FRA is a single-period interest rate swap paying (K - L) * delta * N at T2 — it locks in a borrowing rate K for a future period. The forward LIBOR rate L(0;T1,T2) = (P(T1)/P(T2) - 1)/delta is the fair K that makes NPV zero. The futures-FRA convexity adjustment arises because futures are marked to market daily (daily settlement introduces a correlation between the margin and reinvestment rate), making futures rates systematically above FRA rates."
  },
  {
    id: "pyfin-20260805-b1-credit-var-mc",
    language: "python",
    title: "Credit VaR via Monte Carlo with Factor Model Defaults",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def credit_var_mc(exposures: np.ndarray, pd_annuals: np.ndarray,
                   lgd: float = 0.45, rho: float = 0.15,
                   n_scenarios: int = 100_000,
                   confidence: float = 0.999,
                   seed: int = 42) -> dict:
    """
    One-factor Gaussian copula credit VaR (Basel IRB approach).
    Each obligor defaults if its latent score crosses its threshold.
    Common factor induces correlation.
    exposures:  (N,) EAD per obligor
    pd_annuals: (N,) 1-year default probabilities
    rho:        asset correlation (single factor)
    """
    rng = np.random.default_rng(seed)
    N   = len(exposures)
    # Default thresholds: N^{-1}(PD_i)
    thresholds = norm.ppf(pd_annuals)

    # Sample common factor Z ~ N(0,1) and idiosyncratic eps_i ~ N(0,1)
    Z   = rng.standard_normal(n_scenarios)  # (M,)
    eps = rng.standard_normal((n_scenarios, N))  # (M, N)

    # Asset value score: A_i = sqrt(rho)*Z + sqrt(1-rho)*eps_i
    sqrt_rho = np.sqrt(rho)
    A = sqrt_rho * Z[:, None] + np.sqrt(1 - rho) * eps  # (M, N)

    # Default indicator: A_i < threshold_i
    defaults = (A < thresholds[None, :]).astype(float)   # (M, N)

    # Portfolio loss in each scenario
    losses = (defaults * exposures[None, :] * lgd).sum(axis=1)  # (M,)

    el   = losses.mean()
    UL99 = np.quantile(losses, confidence)
    ES99 = losses[losses > UL99].mean()

    return dict(EL=el, UL_CVaR=UL99, ES=ES99,
                CVaR_pct=UL99 / exposures.sum() * 100)

rng_setup = np.random.default_rng(3)
N   = 50
exposures  = rng_setup.uniform(1e5, 5e5, N)
pd_annuals = rng_setup.uniform(0.005, 0.10, N)

res = credit_var_mc(exposures, pd_annuals, lgd=0.45, rho=0.15)
print(f"Expected Loss     : \${res['EL']:,.0f}")
print(f"99.9% Credit VaR  : \${res['UL_CVaR']:,.0f}")
print(f"99.9% ES (CVaR)   : \${res['ES']:,.0f}")
print(f"CVaR as % of EAD  : {res['CVaR_pct']:.2f}%")`,
    explanation: "The one-factor Gaussian copula model (Basel IRB foundation) induces default correlation through a common factor: two obligors default together more often when both have high factor loadings (rho). The Vasicek asymptotic formula gives a closed-form UL for large N but MC is needed for finite portfolios and full loss distribution. The 99.9% credit VaR is the Basel capital requirement before the economic downturn multiplier."
  },
  {
    id: "pyfin-20260805-b1-swap-curve-bootstrap",
    language: "python",
    title: "Swap Curve Bootstrapping from Market Par Rates",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_swap_curve(par_rates: dict, payment_freq: int = 2) -> dict:
    """
    Bootstrap zero-coupon discount factors from par swap rates.
    par_rates: {tenor_years: par_rate} e.g. {1: 0.04, 2: 0.043, ...}
    payment_freq: coupons per year (2 = semi-annual)
    Returns: {tenor: discount_factor}
    """
    sorted_tenors = sorted(par_rates.keys())
    dfs = {0.0: 1.0}  # today

    for T in sorted_tenors:
        R     = par_rates[T]
        delta = 1.0 / payment_freq  # coupon period
        coupon = R * delta  # periodic coupon

        # Sum of known discount factors for intermediate coupons
        known_coupon_sum = 0.0
        t = delta
        while t < T - delta/2:
            # Interpolate or use known DFs
            if t in dfs:
                known_coupon_sum += coupon * dfs[t]
            else:
                # Log-linear interpolation
                keys = sorted(dfs.keys())
                for i in range(len(keys)-1):
                    if keys[i] <= t <= keys[i+1]:
                        a = (t - keys[i]) / (keys[i+1] - keys[i])
                        df_t = np.exp((1-a)*np.log(dfs[keys[i]])
                                     + a*np.log(dfs[keys[i+1]]))
                        known_coupon_sum += coupon * df_t
                        break
            t = round(t + delta, 8)

        # Solve: par = coupon * sum_known + (coupon + 1) * df(T)
        df_T = (1.0 - known_coupon_sum) / (coupon + 1.0)
        dfs[T] = df_T

    # Convert to zero rates
    zero_rates = {T: -np.log(df)/T for T, df in dfs.items() if T > 0}
    return dict(discount_factors=dfs, zero_rates=zero_rates)

par_rates = {0.25: 0.048, 0.5: 0.049, 1: 0.050, 2: 0.050, 3: 0.049,
             5: 0.047, 7: 0.046, 10: 0.045, 20: 0.043, 30: 0.042}

result = bootstrap_swap_curve(par_rates, payment_freq=2)
print("Bootstrapped zero rates:")
for T, z in sorted(result['zero_rates'].items()):
    df = result['discount_factors'][T]
    print(f"  T={T:4.1f}y:  DF={df:.6f}  z={z*100:.4f}%")`,
    explanation: "Swap curve bootstrapping extracts the zero-coupon discount curve from par swap quotes iteratively: each tenor's discount factor is solved from the par condition — the swap NPV equals zero at fair value. Intermediate payment dates not directly quoted require log-linear interpolation of the partial curve already built. This two-stage process (interpolate interiors, solve terminal) preserves the par condition exactly at all quoted maturities."
  },
  {
    id: "pyfin-20260805-b1-vix-replication",
    language: "python",
    title: "VIX-Style Model-Free Implied Volatility Calculation",
    tag: "derivatives",
    code: `import numpy as np

def compute_mfiv(strikes: np.ndarray, call_prices: np.ndarray,
                  put_prices: np.ndarray, S: float, F: float,
                  r: float, T: float) -> float:
    """
    CBOE VIX methodology: model-free implied variance.
    sigma^2 = (2/T) * sum_i [ DeltaK_i / K_i^2 * e^{rT} * option_i ]
    - Use OTM puts for K < F, OTM calls for K > F, average at ATM
    - DeltaK_i = midpoint between adjacent strikes
    """
    n   = len(strikes)
    disc = np.exp(r * T)

    # Select OTM options at each strike
    prices = np.where(strikes < F, put_prices,
             np.where(strikes > F, call_prices,
                      0.5*(call_prices + put_prices)))  # ATM: average

    # Strike spacing
    dK = np.zeros(n)
    dK[0]    = strikes[1] - strikes[0]
    dK[-1]   = strikes[-1] - strikes[-2]
    dK[1:-1] = (strikes[2:] - strikes[:-2]) / 2

    # VIX integral
    contrib  = dK / strikes**2 * prices * disc
    sigma2   = (2 / T) * contrib.sum()

    # CBOE adjustment: subtract (F/K0 - 1)^2 where K0 is nearest strike to F
    idx_K0 = np.argmin(np.abs(strikes - F))
    K0     = strikes[idx_K0]
    sigma2 -= (F / K0 - 1)**2 / T

    return np.sqrt(max(sigma2, 0)) * 100  # in vol percent

S, F, r, T = 4000.0, 4010.0, 0.05, 30/365
K = np.linspace(3600, 4400, 81)

# Simulate a skewed smile
iv = 0.20 + 0.12 * np.log(F / K)  # negative skew
from scipy.stats import norm
d1 = (np.log(F/K) + 0.5*iv**2*T)/(iv*np.sqrt(T))
d2 = d1 - iv*np.sqrt(T)
disc_T = np.exp(-r*T)
calls = disc_T * (F*norm.cdf(d1) - K*norm.cdf(d2))
puts  = disc_T * (K*norm.cdf(-d2) - F*norm.cdf(-d1))

vix = compute_mfiv(K, calls, puts, S, F, r, T)
print(f"Model-free implied vol (VIX-style): {vix:.2f}%")
print(f"ATM implied vol: {20:.2f}%  (VIX > ATM due to skew premium)")`,
    explanation: "The CBOE VIX is a model-free variance swap rate computed as the sum of OTM option prices weighted by 1/K² across all strikes — the Carr-Madan replication portfolio. It captures the full volatility surface including skew and kurtosis, unlike the single-point ATM vol. VIX systematically exceeds ATM vol when the vol surface is negatively skewed because the integral overweights OTM put prices which carry the skew premium."
  },
];
