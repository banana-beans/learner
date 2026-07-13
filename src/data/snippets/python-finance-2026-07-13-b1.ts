import { Snippet } from "./types";

export const pythonFinanceSnippets20260713B1: Snippet[] = [
  {
    id: "pyfin-20260713-b1-newey-west",
    language: "python",
    title: "Newey-West HAC Standard Errors for OLS",
    tag: "risk",
    code: `import numpy as np

def newey_west_se(X, residuals, lags=None):
    """
    Heteroskedasticity and Autocorrelation Consistent (HAC) standard errors.
    Uses Bartlett kernel with automatic lag selection (lags = 4*(T/100)^(2/9)).
    X: (T, k) regressor matrix (with intercept column)
    residuals: (T,) OLS residuals
    """
    T, k = X.shape
    if lags is None:
        lags = int(4 * (T / 100) ** (2 / 9))

    # Meat of the sandwich estimator: sum of outer products of score vectors
    u = residuals[:, None] * X   # (T, k) score matrix
    S = u.T @ u / T              # lag-0 covariance

    for lag in range(1, lags + 1):
        w  = 1 - lag / (lags + 1)   # Bartlett kernel weight
        Sl = (u[lag:].T @ u[:-lag]) / T
        S += w * (Sl + Sl.T)

    # Bread of the sandwich: (X'X)^{-1}
    XtX_inv = np.linalg.inv(X.T @ X / T)

    # Sandwich variance: (X'X)^{-1} S (X'X)^{-1} / T
    V_hac = (XtX_inv @ S @ XtX_inv) / T
    return np.sqrt(np.diag(V_hac))

def ols_with_hac(y, X, lags=None):
    """Fit OLS and return coefficients with Newey-West standard errors."""
    beta  = np.linalg.lstsq(X, y, rcond=None)[0]
    resid = y - X @ beta
    se    = newey_west_se(X, resid, lags)
    t_stats = beta / se
    return beta, se, t_stats

# Example: regression of excess returns on lagged signal
rng  = np.random.default_rng(42)
T, k = 500, 3
X    = np.column_stack([np.ones(T), rng.standard_normal((T, k-1))])
beta_true = np.array([0.001, 0.05, -0.03])
y    = X @ beta_true + rng.normal(0, 0.01, T)

# Induce autocorrelation in residuals (AR(1))
noise = np.zeros(T)
for t in range(1, T): noise[t] = 0.5 * noise[t-1] + rng.normal(0, 0.01)
y += noise

beta, se_hac, t_stats = ols_with_hac(y, X)
print("Beta:", np.round(beta, 4))
print("HAC SE:", np.round(se_hac, 5))
print("t-stats:", np.round(t_stats, 2))`,
    explanation:
      "Newey-West HAC standard errors correct OLS inference when residuals are both heteroskedastic and autocorrelated — common in financial time series where signal persistence and volatility clustering violate OLS assumptions. The sandwich estimator weights lagged cross-products by a Bartlett kernel (declining linearly to zero at max lag) to ensure positive definiteness. Without HAC correction, standard errors are understated and t-statistics are inflated, leading to false discoveries of significant alpha.",
  },
  {
    id: "pyfin-20260713-b1-engle-granger",
    language: "python",
    title: "Engle-Granger Cointegration Test",
    tag: "portfolio",
    code: `import numpy as np
from scipy import stats

def adf_test(series, lags=1):
    """
    Augmented Dickey-Fuller test for unit root.
    H0: series has a unit root (non-stationary).
    Returns (test_statistic, p_value_approx).
    """
    y    = np.diff(series)
    T    = len(y)
    x    = series[:-1]   # lagged level

    # Augment with lagged differences to remove serial correlation
    cols = [x]
    for lag in range(1, lags + 1):
        if lag < len(y):
            cols.append(np.concatenate([np.zeros(lag), np.diff(y[:-(lag)] if lag > 0 else y)]))
    X = np.column_stack(cols[:T - lags] if lags > 0 else [x[:T]])

    # ADF regression: dy_t = rho*y_{t-1} + sum(gamma_i * dy_{t-i}) + eps
    y_reg = y[lags:]
    X_reg = np.column_stack([x[lags:]] + [np.diff(series)[lags-i:T-i] for i in range(1, lags+1)])
    beta, _, _, _ = np.linalg.lstsq(X_reg, y_reg, rcond=None)

    resid = y_reg - X_reg @ beta
    sigma2 = resid @ resid / (len(resid) - X_reg.shape[1])
    var_b  = sigma2 * np.linalg.inv(X_reg.T @ X_reg)
    adf_stat = beta[0] / np.sqrt(var_b[0, 0])

    # MacKinnon (1994) approximate critical values for ADF (no drift, no trend)
    # -3.43 (1%), -2.86 (5%), -2.57 (10%)
    cv_5pct = -2.86
    return adf_stat, adf_stat < cv_5pct  # True if reject H0 (stationary)

def engle_granger_cointegration(y, x, lags=1):
    """
    Engle-Granger 2-step cointegration test.
    Step 1: Regress y on x, get residuals.
    Step 2: ADF test on residuals. Reject H0 → cointegrated.
    Returns: (hedge_ratio, intercept, adf_stat, is_cointegrated, spread)
    """
    # Step 1: OLS regression
    X_reg = np.column_stack([np.ones(len(x)), x])
    beta  = np.linalg.lstsq(X_reg, y, rcond=None)[0]
    intercept, hedge_ratio = beta

    # Equilibrium spread (residuals from long-run relationship)
    spread = y - (intercept + hedge_ratio * x)

    # Step 2: ADF test on residuals
    adf_stat, is_cointegrated = adf_test(spread, lags)

    return hedge_ratio, intercept, adf_stat, is_cointegrated, spread

# Simulate cointegrated pair
rng = np.random.default_rng(42)
n   = 500
common_trend = np.cumsum(rng.standard_normal(n))
y  = 2.5 * common_trend + 10 + np.cumsum(rng.normal(0, 0.1, n))  # cointegrated
x  = 1.0 * common_trend + 5  + np.cumsum(rng.normal(0, 0.1, n))

hr, alpha, adf, coint, spread = engle_granger_cointegration(y, x)
print(f"Hedge ratio: {hr:.4f}, Intercept: {alpha:.4f}")
print(f"ADF stat: {adf:.4f} (5% CV=-2.86), Cointegrated: {coint}")
print(f"Spread std: {spread.std():.4f}")`,
    explanation:
      "Engle-Granger tests for cointegration in two steps: first estimate the long-run equilibrium relationship via OLS, then test whether the residual (spread) is stationary using ADF. A stationary spread means the pair cannot diverge permanently — an exploitable mean-reversion signal. The hedge ratio from step 1 gives the number of x-shares to sell per y-share. Note that EG has limited power for small samples; the Johansen test handles multiple cointegrating vectors and is preferred for portfolios of 3+ assets.",
  },
  {
    id: "pyfin-20260713-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(t, beta0, beta1, beta2, tau):
    """
    Nelson-Siegel (1987) yield curve model.
    y(t) = beta0 + beta1*(1-e^{-t/tau})/(t/tau)
           + beta2*[(1-e^{-t/tau})/(t/tau) - e^{-t/tau}]
    beta0: long-run level (t → inf)
    beta1: short-term component (loads on short rates; negative = hump)
    beta2: medium-term hump (loads on mid-curve)
    tau:   decay factor (location of maximum beta2 loading)
    """
    if np.isscalar(t):
        t = np.array([t])
    t = np.asarray(t, dtype=float)
    t = np.where(t < 1e-10, 1e-10, t)   # avoid division by zero at t=0

    x    = t / tau
    load1 = (1 - np.exp(-x)) / x
    load2 = load1 - np.exp(-x)

    return beta0 + beta1 * load1 + beta2 * load2

def fit_nelson_siegel(maturities, yields, tau_grid=None):
    """
    Fit NS model by nonlinear least squares.
    Grid search over tau, then refine with L-BFGS-B.
    """
    if tau_grid is None:
        tau_grid = np.arange(0.5, 5.1, 0.5)

    maturities = np.asarray(maturities)
    yields     = np.asarray(yields)

    best_params, best_rmse = None, np.inf

    for tau0 in tau_grid:
        def objective(params):
            b0, b1, b2, tau = params
            if tau <= 0 or b0 <= 0:
                return 1e10
            fitted = nelson_siegel(maturities, b0, b1, b2, tau)
            return np.mean((fitted - yields) ** 2)

        x0  = [yields[-1], yields[0] - yields[-1], 0.0, tau0]
        bounds = [(0.001, 0.20), (-0.15, 0.15), (-0.15, 0.15), (0.1, 10)]
        res = minimize(objective, x0, bounds=bounds, method='L-BFGS-B')
        if res.fun < best_rmse:
            best_rmse = res.fun
            best_params = res.x

    b0, b1, b2, tau = best_params
    fitted = nelson_siegel(maturities, b0, b1, b2, tau)
    rmse   = np.sqrt(np.mean((fitted - yields)**2))
    return best_params, fitted, rmse

# US Treasury-like yields
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.052, 0.053, 0.051, 0.048, 0.046, 0.044, 0.043, 0.042, 0.041, 0.040])

params, fitted, rmse = fit_nelson_siegel(mats, yields)
b0, b1, b2, tau = params
print(f"beta0 (level): {b0:.4f}, beta1 (slope): {b1:.4f}")
print(f"beta2 (hump):  {b2:.4f}, tau: {tau:.4f}")
print(f"RMSE: {rmse*10000:.2f} bps")`,
    explanation:
      "The Nelson-Siegel model decomposes the yield curve into three factors: level (β₀), slope (β₁), and curvature/hump (β₂). This matches the three principal components found empirically in yield data. The model is not arbitrage-free (no-arbitrage extensions include Svensson and the Diebold-Li dynamic factor model), but it interpolates observed yields smoothly and is the standard for central bank yield curve reporting. The tau parameter sets the maturity at which β₂ has its maximum loading (~1.5–3 years for most curves).",
  },
  {
    id: "pyfin-20260713-b1-hull-white-tree",
    language: "python",
    title: "Hull-White Trinomial Tree (Short Rate Model)",
    tag: "fixed-income",
    code: `import numpy as np

def hull_white_trinomial(r0, kappa, sigma, theta_t, T, N=100):
    """
    Hull-White one-factor short rate model via trinomial tree.
    dr = kappa*(theta(t) - r)*dt + sigma*dW
    theta(t) calibrated to fit initial term structure exactly.
    r0: current short rate
    kappa: mean reversion speed
    sigma: rate volatility
    theta_t: callable theta(t) or float (constant)
    Returns: (tree, discount_factors)
    """
    dt   = T / N
    dx   = sigma * np.sqrt(3 * dt)   # node spacing for trinomial
    jmax = int(np.ceil(0.184 / (kappa * dt)))   # Hull-White branching limit

    # State space: j = -jmax..jmax
    nodes = 2 * jmax + 1
    r = {}
    for j in range(-jmax, jmax + 1):
        r[j] = j * dx

    # Transition probabilities (depend on j to ensure mean reversion)
    def probs(j):
        eta   = kappa * j * dt
        pu = 1/6 + (eta**2 + eta) / 2
        pm = 2/3 - eta**2
        pd = 1/6 + (eta**2 - eta) / 2
        return pu, pm, pd

    # Arrow-Debreu prices: Q[t][j] = price of security paying 1 if in state j at t
    Q = {0: {0: 1.0}}
    discount_factors = [1.0]

    for t in range(N):
        dt_t = t * dt
        theta = theta_t(dt_t) if callable(theta_t) else theta_t
        Q_next = {}

        # Drift correction: alpha(t) to fit initial term structure
        sum_Q = sum(Q[t].values())
        # Simplified: alpha = theta (full calibration requires bootstrapping)
        alpha_t = theta

        for j, Qj in Q[t].items():
            pu, pm, pd = probs(j)
            rate_j = r[j] + alpha_t
            df_j   = np.exp(-rate_j * dt)

            for dj, p in [(1, pu), (0, pm), (-1, pd)]:
                jn = max(-jmax, min(jmax, j + dj))
                Q_next[jn] = Q_next.get(jn, 0) + Qj * p * df_j

        Q[t + 1] = Q_next
        # Term discount factor: sum of Arrow-Debreu prices at time t+1
        discount_factors.append(sum(Q_next.values()))

    return discount_factors

theta_const = 0.05  # simplified: flat target rate
dfs = hull_white_trinomial(r0=0.04, kappa=0.1, sigma=0.01,
                            theta_t=theta_const, T=5.0, N=60)
# Zero rates from discount factors
for i, df in enumerate(dfs[::12]):   # annual
    if i == 0: continue
    T_i = i * 5.0 / (len(dfs) / 12)
    z   = -np.log(df) / T_i if df > 0 and T_i > 0 else 0
    print(f"T={T_i:.1f}Y  df={df:.6f}  zero={z*100:.3f}%")`,
    explanation:
      "The Hull-White model adds mean-reversion (κ) and time-varying drift θ(t) to the Vasicek model. θ(t) is calibrated to the observed yield curve, ensuring exact fit to initial market prices — unlike Vasicek which can only approximate. The trinomial tree alternates between three branching nodes per time step; the branching probabilities are chosen so the mean reversion is reflected in the transition structure. j_max prevents negative probabilities at extreme rates.",
  },
  {
    id: "pyfin-20260713-b1-cds-hazard",
    language: "python",
    title: "CDS Pricing with Piecewise Hazard Rates",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_value(spread_bps, hazard_rate, discount_factors, tenors,
              recovery=0.40, notional=1.0):
    """
    Value a CDS with constant hazard rate and given discount curve.
    spread_bps: contractual CDS spread in basis points
    hazard_rate: constant default intensity h (per year)
    discount_factors: list of (tenor, df) pairs
    Returns: mark-to-market value to protection buyer
    """
    spread = spread_bps / 10000.0

    # Survival probability: P(tau > t) = exp(-h*t)
    def surv(t): return np.exp(-hazard_rate * t)
    def df(t):
        # Linear interpolation of discount factors
        ts = [x[0] for x in discount_factors]
        ds = [x[1] for x in discount_factors]
        return np.interp(t, ts, ds)

    dt = 0.25   # quarterly premium payments
    pv_premium = 0.0
    pv_default = 0.0

    t = dt
    while t <= tenors[-1] + 1e-9:
        # Premium leg: spread × df × survival probability (accrual simplified)
        pv_premium += spread * dt * df(t) * surv(t)

        # Default leg: (1 - recovery) × df × prob of default in [t-dt, t]
        pv_default += (1 - recovery) * df(t) * (surv(t - dt) - surv(t))
        t += dt

    # Accrued interest on default: spread/2 × average survival-weighted period
    pv_accrued = spread * dt / 2 * sum(
        df(t) * (surv(t - dt) - surv(t))
        for t in np.arange(dt, tenors[-1] + dt, dt)
    )

    return notional * (pv_default - pv_premium - pv_accrued)

def par_cds_spread(hazard_rate, discount_factors, tenors, recovery=0.40):
    """Find the par spread that makes CDS NPV = 0 at inception."""
    def npv(s):
        return cds_value(s * 10000, hazard_rate, discount_factors, tenors, recovery)
    return brentq(npv, 1, 10000)  # search 1bps to 100%

# Example: 5Y CDS on IG corporate (h ≈ 0.5% / year)
T_nodes = [1, 2, 3, 5, 7, 10]
ois_dfs  = [(t, np.exp(-0.04 * t)) for t in T_nodes]

hazard_rate = 0.005    # 50bps annual default intensity ≈ IG issuer
par_spread  = par_cds_spread(hazard_rate, ois_dfs, T_nodes)
print(f"Par CDS spread: {par_spread:.2f} bps")
print(f"Implied PD (5Y): {(1 - np.exp(-hazard_rate*5))*100:.2f}%")

# Value an existing CDS at new hazard rate (spread widening)
mtm = cds_value(par_spread * 10000 * 0.8, hazard_rate * 1.5, ois_dfs, T_nodes)
print(f"MTM after 50% spread widening: {mtm*1e6:.0f} per $1M notional")`,
    explanation:
      "CDS pricing splits into a premium leg (periodic spread payments, conditional on survival) and a default leg (protection payment at default). The hazard rate h is the instantaneous default intensity; survival probability = exp(−ht) under constant h. Par spread equates the two legs. Accrued interest matters because the default can occur mid-period. In practice, hazard rates are bootstrapped to fit CDS quotes across multiple tenors simultaneously (analogous to yield curve stripping).",
  },
  {
    id: "pyfin-20260713-b1-kelly-multiasset",
    language: "python",
    title: "Kelly Criterion for Multi-Asset Fractional Sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def kelly_fraction_continuous(mu, Sigma, rf=0.0, max_leverage=2.0):
    """
    Continuous-time Kelly criterion for multi-asset portfolios.
    Maximize E[log(1 + r_p)] where r_p = w'(mu - rf) + rf.
    Solution: w* = Sigma^{-1} (mu - rf)   (unconstrained)
    With leverage constraint: scale w* so sum(|w|) <= max_leverage.
    mu: expected excess returns (annual)
    Sigma: covariance matrix (annual)
    """
    n   = len(mu)
    excess = mu - rf

    # Unconstrained Kelly: inverse covariance × excess returns
    Sigma_inv = np.linalg.inv(Sigma)
    w_star    = Sigma_inv @ excess

    # Half-Kelly (practical): scale by 0.5 to reduce variance of outcomes
    w_half_kelly = 0.5 * w_star

    # Constrained: enforce sum(|w|) <= max_leverage
    leverage = np.abs(w_half_kelly).sum()
    if leverage > max_leverage:
        w_half_kelly = w_half_kelly / leverage * max_leverage

    # Expected log growth rate under Kelly weights (geometric mean)
    mu_p  = w_half_kelly @ excess + rf
    var_p = w_half_kelly @ Sigma @ w_half_kelly
    log_growth = mu_p - 0.5 * var_p    # continuous-time approximation

    return w_half_kelly, log_growth

def fractional_kelly(mu, Sigma, rf=0.0, f=0.5):
    """
    f-Kelly: trade f fraction of the full Kelly position.
    f=1: full Kelly (maximizes log wealth but high variance)
    f=0.5: half Kelly (common practice: 75% of Sharpe, 50% of drawdown)
    """
    n = len(mu)
    Sigma_inv = np.linalg.inv(Sigma)
    w_full = Sigma_inv @ (mu - rf)
    return f * w_full

# Example: 4 assets
mu    = np.array([0.08, 0.12, 0.06, 0.10])
vols  = np.array([0.15, 0.25, 0.10, 0.20])
rho   = np.array([[1, .3, .1, .2], [.3, 1, .1, .3],
                   [.1, .1, 1, .2], [.2, .3, .2, 1]])
Sigma = np.diag(vols) @ rho @ np.diag(vols)
rf    = 0.04

w_kelly, g = kelly_fraction_continuous(mu, Sigma, rf, max_leverage=1.5)
print("Half-Kelly weights:", np.round(w_kelly, 4))
print(f"Expected log growth: {g*100:.2f}% p.a.")
print(f"Kelly Sharpe proxy: {(w_kelly @ (mu-rf)) / np.sqrt(w_kelly @ Sigma @ w_kelly):.2f}")`,
    explanation:
      "The continuous-time Kelly criterion for multiple assets is Σ⁻¹(μ−rf) — the same as the Markowitz tangency portfolio up to a scalar. It maximises the long-run growth rate of wealth (geometric mean), not the arithmetic mean. Full Kelly produces large drawdowns; half-Kelly is common in practice: it achieves 75% of the maximum Sharpe ratio but only half the variance of wealth fluctuations. The leverage constraint prevents ruin from over-leveraged positions when signals are estimated with error.",
  },
  {
    id: "pyfin-20260713-b1-cvar-lp",
    language: "python",
    title: "CVaR Portfolio Optimisation (Linear Program)",
    tag: "risk",
    code: `import numpy as np

def cvar_portfolio_lp(returns, alpha=0.05, min_return=0.0):
    """
    Minimize CVaR (Expected Shortfall) via Rockafellar-Uryasev (2000) LP.
    The LP equivalent: minimize VaR_alpha + E[max(-r - VaR, 0)] / alpha
    returns: (T, N) scenario returns matrix
    alpha: tail probability (e.g., 0.05 for 95% CVaR)
    min_return: minimum expected return constraint
    Uses a pure-numpy LP solver via linprog from scipy.
    """
    from scipy.optimize import linprog

    T, N = returns.shape

    # Variables: [w (N), zeta (scalar VaR), u_t (T auxiliary)]
    # Minimize: zeta + (1/alpha*T) * sum(u_t)
    # Subject to:
    #   u_t >= -r_t'w - zeta  for all t  (u_t >= 0 implicit via bounds)
    #   sum(w) = 1, w >= 0
    #   mean(r'w) >= min_return

    n_vars = N + 1 + T    # w, zeta, u_1..u_T

    # Objective
    c = np.zeros(n_vars)
    c[N] = 1.0                       # zeta coefficient
    c[N+1:] = 1.0 / (alpha * T)     # u_t coefficients

    # Inequality constraints: -r_t'w - zeta + u_t >= 0 → -r_t'w - zeta - u_t <= 0
    # Rewrite: u_t - r_t'w - zeta >= 0
    A_ub = np.zeros((T, n_vars))
    for t in range(T):
        A_ub[t, :N]  = returns[t]     # -r_t'w (negative: we want >= 0 → flip)
        A_ub[t, N]   = 1.0            # + zeta
        A_ub[t, N+t+1] = -1.0         # - u_t
    b_ub = np.zeros(T)

    # Equality: sum(w) = 1
    A_eq = np.zeros((1, n_vars))
    A_eq[0, :N] = 1.0
    b_eq = np.array([1.0])

    # Bounds: w >= 0, zeta free, u >= 0
    bounds = [(0, None)] * N + [(None, None)] + [(0, None)] * T

    # Minimum return: mean(r'w) >= min_return
    if min_return > 0:
        A_ret = np.zeros((1, n_vars))
        A_ret[0, :N] = -returns.mean(axis=0)   # negate for <= constraint
        b_ret = np.array([-min_return])
        A_ub = np.vstack([A_ub, A_ret])
        b_ub = np.append(b_ub, b_ret)

    res = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                  bounds=bounds, method='highs')

    w    = res.x[:N]
    VaR  = res.x[N]
    CVaR = res.fun
    return w, VaR, CVaR

# Simulate 1000 scenarios for 5 assets
rng  = np.random.default_rng(42)
T, N = 1000, 5
rets = rng.multivariate_normal(
    mean=np.array([0.0003, 0.0005, 0.0002, 0.0004, 0.0001]),
    cov=np.eye(N) * 0.0002 + 0.0001,
    size=T
)

w, var95, cvar95 = cvar_portfolio_lp(rets, alpha=0.05, min_return=0.0002)
print(f"Weights: {np.round(w, 4)}")
print(f"95% VaR:  {var95*100:.4f}%  CVaR: {cvar95*100:.4f}%")`,
    explanation:
      "Rockafellar and Uryasev showed that CVaR minimisation is equivalent to a linear program when losses are represented as scenarios. The auxiliary variable u_t absorbs the positive part of the loss exceeding VaR, avoiding the need for integer variables or quantile regression. This makes CVaR a tractable risk measure for large-scale portfolio optimisation — unlike VaR, which is non-convex and non-differentiable. CVaR is coherent (satisfies subadditivity) and is the regulatory ES measure under Basel III.",
  },
  {
    id: "pyfin-20260713-b1-risk-parity",
    language: "python",
    title: "Risk Parity: Equal Risk Contribution Portfolio",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_contribution(w, Sigma):
    """Risk contribution of each asset: RC_i = w_i * (Sigma w)_i / sigma_p"""
    sigma_p = np.sqrt(w @ Sigma @ w)
    marginal = Sigma @ w
    return w * marginal / sigma_p   # (N,)

def risk_parity(Sigma, target_rc=None, max_iter=500):
    """
    Equal Risk Contribution (ERC) portfolio.
    Minimises sum( (RC_i/sigma_p - 1/N)^2 ) subject to sum(w)=1, w>=0.
    Sigma: covariance matrix
    target_rc: optional target risk contributions (default: equal)
    """
    N = Sigma.shape[0]
    if target_rc is None:
        target_rc = np.ones(N) / N   # equal risk budget

    def objective(w):
        rc   = risk_contribution(w, Sigma)
        diff = rc / rc.sum() - target_rc
        return np.sum(diff ** 2)

    def gradient(w):
        sigma_p = np.sqrt(w @ Sigma @ w)
        rc      = risk_contribution(w, Sigma)
        total_rc = rc.sum()
        # Numerical gradient (autodiff alternative: use JAX)
        eps = 1e-6
        grad = np.zeros(N)
        f0   = objective(w)
        for i in range(N):
            w_eps = w.copy(); w_eps[i] += eps
            grad[i] = (objective(w_eps) - f0) / eps
        return grad

    constraints = {'type': 'eq', 'fun': lambda w: np.sum(w) - 1}
    bounds = [(0.001, 1.0)] * N
    w0 = np.ones(N) / N

    result = minimize(objective, w0, jac='2-point',
                      method='SLSQP', constraints=constraints,
                      bounds=bounds,
                      options={'maxiter': max_iter, 'ftol': 1e-12})
    w = result.x
    rc = risk_contribution(w, Sigma)

    return w, rc

# Example: 4 assets with different volatilities
vols  = np.array([0.08, 0.15, 0.12, 0.20])  # bonds, equities, REITs, commodities
rho   = np.array([[1, .1, .2, .05], [.1, 1, .5, .2],
                   [.2, .5, 1, .15], [.05, .2, .15, 1]])
Sigma = np.diag(vols) @ rho @ np.diag(vols)

w_rp, rc = risk_parity(Sigma)
print("ERC weights:", np.round(w_rp, 4))
print("Risk contribs:", np.round(rc / rc.sum(), 4))
print("Portfolio vol:", np.sqrt(w_rp @ Sigma @ w_rp) * 100, "%")`,
    explanation:
      "Risk parity weights assets so each contributes equally to total portfolio variance. The marginal risk contribution of asset i is ∂σ_p/∂w_i = (Σw)_i / σ_p; the dollar risk contribution is w_i × (Σw)_i / σ_p. Equalising these produces the ERC portfolio. Compared to equal-weight, risk parity over-weights low-volatility assets (bonds) and under-weights high-volatility ones (equities), improving Sharpe ratio by reducing volatility concentration. Bridgewater's All Weather fund popularised this approach.",
  },
  {
    id: "pyfin-20260713-b1-momentum-turnover",
    language: "python",
    title: "Momentum Portfolio with Turnover Constraint (cvxpy)",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def momentum_with_turnover(mu_signal, Sigma, w_prev,
                            turnover_limit=0.20, risk_aversion=1.0,
                            leverage_max=1.0):
    """
    Maximize: signal'w - lambda*w'Sigma*w  (risk-adjusted momentum)
    Subject to:
      sum(w) = 1, w >= 0
      sum(|w - w_prev|) <= turnover_limit   (one-way turnover)
      sum(w) <= leverage_max
    w_prev: previous period weights (for turnover calculation)
    """
    N = len(mu_signal)
    w = cp.Variable(N)

    # Objective: signal minus risk penalty
    objective = mu_signal @ w - risk_aversion * cp.quad_form(w, Sigma)

    # Turnover: linearise |w - w_prev| using auxiliary variables
    delta = cp.Variable(N)   # delta >= |w - w_prev|

    constraints = [
        cp.sum(w) == 1,
        w >= 0,
        w <= leverage_max / N * 5,      # cap individual weight
        delta >= w - w_prev,
        delta >= w_prev - w,
        delta >= 0,
        cp.sum(delta) <= turnover_limit, # one-way turnover limit
    ]

    prob = cp.Problem(cp.Maximize(objective), constraints)
    prob.solve(solver=cp.OSQP, warm_start=True, verbose=False)

    if prob.status not in ('optimal', 'optimal_inaccurate'):
        return w_prev, 0.0   # fallback to previous weights

    w_opt     = np.maximum(w.value, 0)
    w_opt    /= w_opt.sum()
    turnover  = np.abs(w_opt - w_prev).sum()
    return w_opt, turnover

# Simulate a month of signal + rebalancing
rng   = np.random.default_rng(42)
N     = 50   # 50-stock universe
Sigma = np.eye(N) * 0.04 + 0.01   # simplified covariance

w_current = np.ones(N) / N   # start equal-weight
total_to   = 0.0

for month in range(12):
    # New momentum signal each month (12-1 month return)
    signal = rng.normal(0, 0.01, N)
    w_new, to = momentum_with_turnover(
        signal, Sigma, w_current,
        turnover_limit=0.20,    # max 20% one-way per month
        risk_aversion=2.0
    )
    total_to  += to
    w_current  = w_new

print(f"Average monthly turnover: {total_to/12:.1%}")
print(f"Final weight entropy: {-(w_current * np.log(w_current + 1e-9)).sum():.2f}")`,
    explanation:
      "Turnover constraints are linearised by introducing auxiliary variables δ_i ≥ |w_i − w_prev_i|, converting the absolute value into linear inequalities. Without a turnover constraint, optimal momentum portfolios rebalance aggressively, generating 100%+ monthly turnover; at 10bps one-way cost, this destroys alpha. A 20% monthly turnover limit preserves signal-driven rotation while keeping transaction costs manageable. cvxpy's warm-start reuses the previous solution as an initial point, accelerating sequential monthly optimisations.",
  },
  {
    id: "pyfin-20260713-b1-student-t-copula",
    language: "python",
    title: "Student-t Copula for Tail-Dependent Portfolio Simulation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm, t as tdist, chi2

def student_t_copula_simulate(Rho, nu, n_sims, marginal_dfs=None, seed=42):
    """
    Simulate from a d-dimensional Student-t copula.
    Rho: (d, d) correlation matrix
    nu: copula degrees of freedom (tail dependence)
    marginal_dfs: optional list of dfs for marginal distributions (default: same nu)
    Returns: (n_sims, d) uniform marginals U in [0,1]
    """
    rng = np.random.default_rng(seed)
    d   = Rho.shape[0]

    # Cholesky factorisation of Rho
    L = np.linalg.cholesky(Rho)

    # Step 1: sample standard Gaussian
    Z = rng.standard_normal((n_sims, d)) @ L.T

    # Step 2: scale by chi-squared (shared across all dimensions → tail dependence)
    W = chi2.rvs(df=nu, size=n_sims, random_state=rng)   # (n_sims,)
    X = Z * np.sqrt(nu / W[:, None])   # (n_sims, d) — t-distributed

    # Step 3: convert to uniform via marginal CDF
    if marginal_dfs is None:
        U = tdist.cdf(X, df=nu)
    else:
        U = np.column_stack([tdist.cdf(X[:, i], df=marginal_dfs[i])
                              for i in range(d)])
    return U

def tail_dependence_lambda(U, threshold=0.05):
    """
    Empirical upper/lower tail dependence coefficient.
    lambda_L = lim_{u->0} P(U1 < u | U2 < u) — lower tail dependence
    """
    n = len(U)
    lower = np.mean((U[:, 0] < threshold) & (U[:, 1] < threshold)) / threshold
    upper = np.mean((U[:, 0] > 1-threshold) & (U[:, 1] > 1-threshold)) / threshold
    return lower, upper

# 3-asset portfolio: Student-t copula captures joint crashes
Rho = np.array([[1, 0.6, 0.3], [0.6, 1, 0.5], [0.3, 0.5, 1]])
nu  = 4    # heavy tails: equity-like

U = student_t_copula_simulate(Rho, nu=nu, n_sims=100_000)

# Check tail dependence (should be > 0 for Student-t, = 0 for Gaussian)
lam_L, lam_U = tail_dependence_lambda(U[:, :2], threshold=0.05)
print(f"Lower tail dependence (assets 1&2): {lam_L:.3f}")
print(f"Upper tail dependence:              {lam_U:.3f}")

# Gaussian copula for comparison (should give lambda ≈ 0)
from scipy.stats import norm as norm_dist
U_gauss = norm_dist.cdf(np.random.default_rng(0).standard_normal((100_000, 3))
                         @ np.linalg.cholesky(Rho).T)
lam_L_g, _ = tail_dependence_lambda(U_gauss[:, :2])
print(f"Gaussian copula lower tail dep:    {lam_L_g:.3f}  (near 0)")`,
    explanation:
      "The Student-t copula introduces positive tail dependence: the shared chi-squared scaling factor W means all assets crash together when W is small (extreme draw). Tail dependence coefficient λ = lim P(U₁ < u | U₂ < u) as u→0 measures this. For the Gaussian copula, λ = 0 (assets become independent in the tails); for the t-copula with ν = 4, λ ≈ 0.3 for ρ = 0.6. This captures the empirical observation that asset correlations spike during crises — the critical failure of the Gaussian copula in CDO pricing.",
  },
  {
    id: "pyfin-20260713-b1-hist-es-bootstrap",
    language: "python",
    title: "Historical Simulation ES with Bootstrap Confidence Intervals",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def historical_es(returns, alpha=0.01, n_bootstrap=1000, seed=42):
    """
    Historical simulation Expected Shortfall (ES) with bootstrap CI.
    alpha: tail probability (0.01 = 99% ES)
    Returns: (es_point, es_lower_95pct, es_upper_95pct)
    """
    rng = np.random.default_rng(seed)
    returns = np.asarray(returns)
    T = len(returns)

    # Point estimate
    var_level = np.quantile(returns, alpha)
    tail_losses = returns[returns <= var_level]
    es_point = -tail_losses.mean() if len(tail_losses) > 0 else 0.0

    # Bootstrap: resample returns with replacement
    es_boot = np.zeros(n_bootstrap)
    for b in range(n_bootstrap):
        sample = rng.choice(returns, size=T, replace=True)
        var_b  = np.quantile(sample, alpha)
        tail_b = sample[sample <= var_b]
        es_boot[b] = -tail_b.mean() if len(tail_b) > 0 else 0.0

    # 95% confidence interval (percentile method)
    es_lo = np.percentile(es_boot, 2.5)
    es_hi = np.percentile(es_boot, 97.5)

    return es_point, es_lo, es_hi

def rolling_es(returns, window=252, alpha=0.01):
    """Rolling ES over a lookback window (no bootstrap for speed)."""
    n = len(returns)
    es_series = np.full(n, np.nan)
    for t in range(window, n):
        window_rets = returns[t - window:t]
        var_t = np.quantile(window_rets, alpha)
        tail  = window_rets[window_rets <= var_t]
        es_series[t] = -tail.mean() if len(tail) > 0 else np.nan
    return es_series

# Simulate daily returns with a crash period
rng  = np.random.default_rng(42)
T    = 1000
rets = np.concatenate([
    rng.normal(0.0005, 0.012, 750),     # normal period
    rng.normal(-0.002, 0.030, 250),     # stress period
])

es, lo, hi = historical_es(rets, alpha=0.01, n_bootstrap=2000)
print(f"99% Historical ES: {es*100:.3f}%")
print(f"95% CI: [{lo*100:.3f}%, {hi*100:.3f}%]")

roll_es = rolling_es(rets, window=252, alpha=0.01)
stress_avg = np.nanmean(roll_es[750:])
print(f"Average rolling ES in stress period: {stress_avg*100:.3f}%")`,
    explanation:
      "Historical simulation (HS) ES makes no distributional assumption — the empirical tail mean directly estimates expected shortfall. The bootstrap confidence interval captures estimation uncertainty from finite sample size: with T=1000 observations and α=1%, only ~10 tail observations drive the ES estimate, making sampling variance substantial. The width of the CI motivates minimum history requirements: IMA (FRTB) requires at least 1 year of daily data, stressed to a 12-month crisis window.",
  },
  {
    id: "pyfin-20260713-b1-factor-neutralize",
    language: "python",
    title: "Cross-Sectional Factor Neutralization",
    tag: "portfolio",
    code: `import numpy as np

def factor_neutralize(signals, factor_exposures):
    """
    Orthogonalise alpha signals against factor exposures.
    Removes the component of each signal explained by the factors,
    producing a residual signal with zero factor loading.

    signals: (N,) raw signal for N stocks
    factor_exposures: (N, K) factor exposure matrix (e.g. beta, size, value)
    Returns: (N,) factor-neutral residual signal
    """
    N, K = factor_exposures.shape
    F = factor_exposures

    # OLS projection: signals = F @ gamma + residual
    # gamma = (F'F)^{-1} F' signals
    FtF    = F.T @ F
    gamma  = np.linalg.lstsq(FtF, F.T @ signals, rcond=None)[0]
    factor_component = F @ gamma
    residual         = signals - factor_component

    return residual, gamma

def sector_neutralize(signals, sector_ids):
    """
    Demean signals within each sector (sector-neutral long-short).
    signals: (N,) raw signals
    sector_ids: (N,) integer sector labels
    """
    neutralised = signals.copy()
    for sector in np.unique(sector_ids):
        mask = sector_ids == sector
        neutralised[mask] -= signals[mask].mean()
    return neutralised

def cross_sectional_zscore(signals, winsorize_z=3.0):
    """Rank-transform and winsorise signals for robustness."""
    # Rank transform: uniform then normal via probit
    n = len(signals)
    ranks  = signals.argsort().argsort()
    uniform = (ranks + 0.5) / n
    z_scores = np.sqrt(2) * np.arcsin(2 * uniform - 1)  # arcsin squeezing

    # Clip extreme values
    z_scores = np.clip(z_scores, -winsorize_z, winsorize_z)
    # Re-standardise after clipping
    return (z_scores - z_scores.mean()) / (z_scores.std() + 1e-8)

# Example: momentum signal neutralized vs market beta + size
rng  = np.random.default_rng(42)
N    = 500
momentum   = rng.standard_normal(N)   # raw 12-1M return signal
market_beta = rng.normal(1.0, 0.3, N)
log_mktcap  = rng.normal(10, 1.5, N)
sector_ids  = rng.integers(0, 11, N)  # 11 GICS sectors

F = np.column_stack([market_beta, log_mktcap])
neutral_signal, gammas = factor_neutralize(momentum, F)
neutral_signal = sector_neutralize(neutral_signal, sector_ids)
final_signal   = cross_sectional_zscore(neutral_signal)

print(f"Correlation with beta before: {np.corrcoef(momentum, market_beta)[0,1]:.3f}")
print(f"Correlation with beta after:  {np.corrcoef(neutral_signal, market_beta)[0,1]:.4f}")
print(f"Signal mean: {final_signal.mean():.6f}  std: {final_signal.std():.4f}")`,
    explanation:
      "Factor neutralization removes systematic factor exposures from alpha signals so the resulting portfolio bets are pure-alpha, not disguised factor bets. Cross-sectional OLS projects the signal onto the factor space; the residual is orthogonal to all factors by construction. Sector neutralization prevents the signal from just going long growth sectors and short value sectors. Rank-transform z-scoring makes the signal distribution uniform and robust to outliers — raw price or return signals often have fat tails that distort portfolio weights.",
  },
  {
    id: "pyfin-20260713-b1-realized-vol",
    language: "python",
    title: "Realized Volatility Estimators (Parkinson, Yang-Zhang)",
    tag: "risk",
    code: `import numpy as np

def parkinson_vol(high, low, ann_factor=252):
    """
    Parkinson (1980) range-based vol estimator.
    Uses high-low range; 5x more efficient than close-to-close for GBM.
    """
    return np.sqrt(ann_factor / (4 * np.log(2))
                   * np.mean(np.log(high / low) ** 2))

def garman_klass_vol(open_, high, low, close, ann_factor=252):
    """
    Garman-Klass (1980): uses O, H, L, C.
    6.5x more efficient than close-to-close estimator.
    """
    term1 = 0.5 * np.log(high / low) ** 2
    term2 = (2 * np.log(2) - 1) * np.log(close / open_) ** 2
    return np.sqrt(ann_factor * np.mean(term1 - term2))

def yang_zhang_vol(open_, high, low, close, ann_factor=252):
    """
    Yang-Zhang (2000): handles opening jumps (overnight returns).
    Optimal combination of overnight, open-to-close, and GK estimators.
    """
    n  = len(close)
    k  = 0.34 / (1.34 + (n + 1) / (n - 1))   # optimal weight

    # Overnight return: open_t vs close_{t-1}
    ov_ret  = np.log(open_[1:] / close[:-1])
    ov_vol  = np.var(ov_ret, ddof=1)

    # Open-to-close return
    oc_ret  = np.log(close[1:] / open_[1:])
    oc_vol  = np.var(oc_ret, ddof=1)

    # Garman-Klass RS component (within-day range)
    h  = np.log(high[1:] / open_[1:])
    l  = np.log(low[1:]  / open_[1:])
    c_ = np.log(close[1:] / open_[1:])
    rs_vol = np.mean(h*(h-c_) + l*(l-c_))

    yz_var = ov_vol + k * oc_vol + (1 - k) * rs_vol
    return np.sqrt(ann_factor * yz_var)

def close_to_close_vol(close, ann_factor=252):
    """Standard close-to-close log-return volatility."""
    log_rets = np.diff(np.log(close))
    return np.std(log_rets, ddof=1) * np.sqrt(ann_factor)

# Simulate OHLC data
rng   = np.random.default_rng(42)
T     = 252
true_vol = 0.20  # 20% annual
dt    = 1/252
rets  = rng.normal(0.0, true_vol * np.sqrt(dt), T)
close = 100 * np.exp(np.cumsum(rets))
open_ = np.roll(close, 1); open_[0] = 100
high  = close * np.exp(np.abs(rng.normal(0, true_vol * np.sqrt(dt/2), T)))
low   = close * np.exp(-np.abs(rng.normal(0, true_vol * np.sqrt(dt/2), T)))

print(f"True vol:          {true_vol:.4f}")
print(f"Close-to-Close:    {close_to_close_vol(close):.4f}")
print(f"Parkinson:         {parkinson_vol(high, low):.4f}")
print(f"Garman-Klass:      {garman_klass_vol(open_, high, low, close):.4f}")
print(f"Yang-Zhang:        {yang_zhang_vol(open_, high, low, close):.4f}")`,
    explanation:
      "Close-to-close volatility discards 80% of the price information in a trading day. The Parkinson estimator uses the high-low range and is 5× more efficient for GBM (no overnight jumps). Garman-Klass incorporates the opening and closing prices for 6.5× efficiency. Yang-Zhang adds an explicit overnight-return component using an optimal weighting k≈0.34, making it unbiased under opening gaps. For implied vol surfaces and risk model calibration, these high-efficiency estimators reduce the required history by 5–6×.",
  },
  {
    id: "pyfin-20260713-b1-delta-hedge-sim",
    language: "python",
    title: "Delta Hedging P&L Simulation (Gamma P&L vs Theta Decay)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_price_greeks(S, K, r, sigma, T):
    """Returns (price, delta, gamma, theta, vega) for a call."""
    if T <= 0:
        return max(S-K, 0), float(S>K), 0, 0, 0
    sq = np.sqrt(T)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sq)
    d2 = d1 - sigma*sq
    N1 = norm.cdf(d1); N2 = norm.cdf(d2)
    nd1 = norm.pdf(d1)
    price = S*N1 - K*np.exp(-r*T)*N2
    delta = N1
    gamma = nd1 / (S * sigma * sq)
    theta = (-S*nd1*sigma/(2*sq) - r*K*np.exp(-r*T)*N2) / 365
    vega  = S*nd1*sq / 100
    return price, delta, gamma, theta, vega

def delta_hedge_simulation(S0, K, r, sigma_true, sigma_hedge,
                            T, N_steps=252, n_paths=5000, seed=42):
    """
    Simulate discrete delta hedging P&L.
    sigma_true: actual vol (GBM)
    sigma_hedge: vol used for Black-Scholes delta
    P&L from gamma scalping vs theta bleed.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / N_steps
    disc = np.exp(-r * T)

    hedge_pnl = np.zeros(n_paths)

    for path in range(n_paths):
        S   = S0
        t   = T
        cumulative_pnl = 0.0

        # Initial option premium (sell the call)
        price0, delta0, _, _, _ = bs_price_greeks(S, K, r, sigma_hedge, t)
        cash = price0 - delta0 * S   # receive premium, buy delta shares

        for step in range(N_steps):
            dW   = rng.standard_normal() * np.sqrt(dt)
            S_new = S * np.exp((r - 0.5*sigma_true**2)*dt + sigma_true*dW)

            t_new = t - dt
            _, delta_new, _, _, _ = bs_price_greeks(S_new, K, r, sigma_hedge, max(t_new, 1e-10))

            # Rebalance: buy (delta_new - delta0) shares, finance with cash
            cash = (cash - (delta_new - delta0) * S_new) * np.exp(r * dt)
            S, delta0, t = S_new, delta_new, t_new

        # Final: option payoff + close hedge + cash
        option_payoff = max(S - K, 0)
        cumulative_pnl = cash + delta0 * S - option_payoff
        hedge_pnl[path] = cumulative_pnl

    return hedge_pnl

pnl = delta_hedge_simulation(
    S0=100, K=100, r=0.04, sigma_true=0.22, sigma_hedge=0.20,
    T=0.25, N_steps=63, n_paths=2000
)
print(f"Mean P&L:  {pnl.mean():.4f}  (vol spread: sold at 20%, actual 22% → positive gamma)")
print(f"Std P&L:   {pnl.std():.4f}")
print(f"Sharpe:    {pnl.mean()/pnl.std() * np.sqrt(252):.2f}")`,
    explanation:
      "Delta hedging P&L decomposes into: gamma P&L = ½Γ(dS)² per rebalance (positive when sold vol > realised vol) and theta bleed = Θ·dt per day (always negative for long option). When sigma_hedge < sigma_true, we sell cheap options and earn positive expected P&L from gamma scalping. Rebalancing frequency affects the variance of P&L: continuous hedging gives zero residual (Black-Scholes world), while daily hedging leaves path-dependent gamma exposure. This simulation is the standard tool for understanding vol risk management.",
  },
  {
    id: "pyfin-20260713-b1-arima-forecast",
    language: "python",
    title: "ARIMA(p,d,q) Fitting and Forecasting",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.signal import lfilter

def arima_estimate(y, p=2, d=1, q=1):
    """
    Fit ARIMA(p,d,q) via conditional MLE (CSS — conditional sum of squares).
    Returns (phi, theta, sigma2): AR params, MA params, residual variance.
    """
    # Difference d times
    yd = y.copy()
    for _ in range(d):
        yd = np.diff(yd)

    T = len(yd)

    def css_loglik(params):
        phi   = params[:p]
        theta = params[p:p+q]
        if any(np.abs(np.roots(np.concatenate([[1], -phi]))) >= 1): return 1e10
        if any(np.abs(np.roots(np.concatenate([[1], theta]))) >= 1): return 1e10

        # Recursively compute residuals
        eps = np.zeros(T)
        for t in range(max(p, q), T):
            ar_part = sum(phi[i] * yd[t-1-i] for i in range(p))
            ma_part = sum(theta[j] * eps[t-1-j] for j in range(q))
            eps[t]  = yd[t] - ar_part - ma_part

        sigma2 = np.mean(eps[max(p,q):]**2)
        return np.sum(eps[max(p,q):]**2) / sigma2 + T * np.log(sigma2)

    x0 = np.zeros(p + q)
    res = minimize(css_loglik, x0, method='Nelder-Mead',
                   options={'maxiter': 5000, 'xatol': 1e-6})
    phi, theta = res.x[:p], res.x[p:p+q]

    # Residuals for sigma estimation
    eps = np.zeros(T)
    for t in range(max(p, q), T):
        ar_part = sum(phi[i] * yd[t-1-i] for i in range(p))
        ma_part = sum(theta[j] * eps[t-1-j] for j in range(q))
        eps[t]  = yd[t] - ar_part - ma_part
    sigma2 = np.var(eps[max(p,q):])
    return phi, theta, sigma2

def arima_forecast(y, phi, theta, d, steps=10):
    """Multi-step forecast (point estimates); no PI for brevity."""
    yd = y.copy()
    for _ in range(d): yd = np.diff(yd)

    T   = len(yd)
    eps = np.zeros(T)
    for t in range(max(len(phi), len(theta)), T):
        ar_part = sum(phi[i] * yd[t-1-i] for i in range(len(phi)))
        ma_part = sum(theta[j] * eps[t-1-j] for j in range(len(theta)))
        eps[t]  = yd[t] - ar_part - ma_part

    forecasts_diff = []
    yd_ext = list(yd)
    eps_ext = list(eps)
    for h in range(steps):
        ar_part = sum(phi[i] * yd_ext[-(i+1)] for i in range(len(phi)))
        ma_part = sum(theta[j] * eps_ext[-(j+1)] for j in range(len(theta)))
        f = ar_part + ma_part
        forecasts_diff.append(f)
        yd_ext.append(f); eps_ext.append(0.0)

    # Undo differencing d times
    last_val = y[-1]
    for _ in range(d):
        forecasts_diff = np.cumsum([last_val] + forecasts_diff)[1:]
        last_val = forecasts_diff[-1]
    return np.array(forecasts_diff)

rng  = np.random.default_rng(42)
T    = 300
y    = np.cumsum(rng.normal(0, 1, T)) + 0.3 * np.cumsum(rng.normal(0, 0.5, T))

phi, theta, sigma2 = arima_estimate(y, p=2, d=1, q=1)
print(f"AR: {np.round(phi, 4)}, MA: {np.round(theta, 4)}, sigma={np.sqrt(sigma2):.4f}")
fcast = arima_forecast(y, phi, theta, d=1, steps=5)
print("5-step forecast:", np.round(fcast, 3))`,
    explanation:
      "ARIMA(p,d,q) models non-stationary time series by differencing d times before fitting an ARMA(p,q). Conditional sum-of-squares (CSS) estimation minimises the sum of squared one-step forecast errors — computationally cheaper than exact MLE but asymptotically equivalent. For financial series, ARIMA captures short-term autocorrelation in prices but not heteroskedasticity in returns; ARMA-GARCH extensions combine both. Common applications: momentum signal smoothing, short-term return prediction, and spread mean-reversion modeling.",
  },
  {
    id: "pyfin-20260713-b1-lasso-factors",
    language: "python",
    title: "Lasso Regression for Sparse Factor Selection",
    tag: "portfolio",
    code: `import numpy as np
from sklearn.linear_model import LassoCV, Lasso
from sklearn.preprocessing import StandardScaler

def lasso_factor_selection(returns, factors, cv_folds=5, max_factors=None):
    """
    Select relevant risk factors for a return series via Lasso regression.
    Lasso adds L1 penalty: coefficients shrink to zero for irrelevant factors.
    returns: (T,) asset return series
    factors: (T, K) factor return matrix (e.g. Fama-French + macro + sector)
    Returns: (selected_factor_names, loadings, r2)
    """
    T, K = factors.shape

    # Standardise factors (Lasso is sensitive to scale)
    scaler = StandardScaler()
    X_std  = scaler.fit_transform(factors)

    # Cross-validated Lasso: automatically selects lambda
    lasso_cv = LassoCV(cv=cv_folds, fit_intercept=True,
                        max_iter=10000, n_alphas=100)
    lasso_cv.fit(X_std, returns)

    loadings_std = lasso_cv.coef_
    # Unstandardise loadings back to original scale
    loadings_raw = loadings_std / scaler.scale_

    # Selected factors: non-zero loadings
    selected = np.where(np.abs(loadings_raw) > 1e-8)[0]

    # R² of Lasso fit
    y_hat = lasso_cv.predict(X_std)
    ss_tot = np.sum((returns - returns.mean())**2)
    ss_res = np.sum((returns - y_hat)**2)
    r2 = 1 - ss_res / ss_tot

    return selected, loadings_raw, r2, lasso_cv.alpha_

# Fama-French 5 + momentum + quality + low-vol + macro (10 candidates)
rng      = np.random.default_rng(42)
T        = 500
K        = 10
true_factors = [0, 2, 5]   # only 3 factors matter
factor_rets  = rng.normal(0, 0.01, (T, K))
true_loads   = np.zeros(K)
true_loads[true_factors] = [0.8, 0.3, -0.2]

returns = factor_rets @ true_loads + rng.normal(0, 0.008, T)

factor_names = ['MKT','SMB','HML','RMW','CMA','MOM','QMJ','BAB','TERM','CREDIT']
sel_idx, loads, r2, alpha = lasso_factor_selection(returns, factor_rets)

print(f"Selected factors: {[factor_names[i] for i in sel_idx]}")
print(f"Loadings: {loads[sel_idx].round(4)}")
print(f"Lasso alpha: {alpha:.6f}  R²: {r2:.4f}")`,
    explanation:
      "Lasso (L1 regularisation) performs automatic factor selection: it shrinks irrelevant factor loadings exactly to zero, unlike Ridge (L2) which only shrinks them toward zero. For a 50-factor model, Lasso typically selects 5–15 material factors, reducing overfitting and improving out-of-sample explanatory power. Cross-validated lambda selection balances fit vs sparsity. Standardising factors before Lasso is critical — Lasso penalises all coefficients equally, so unscaled factors with large variance would dominate.",
  },
  {
    id: "pyfin-20260713-b1-rolling-corr-regime",
    language: "python",
    title: "Rolling Correlation Regime Detection",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def rolling_correlation_regimes(returns_a, returns_b, window=60,
                                 high_corr_threshold=0.7,
                                 low_corr_threshold=0.3):
    """
    Detect correlation regimes between two assets using rolling correlation.
    High correlation: diversification benefits have collapsed (risk-off).
    Low/negative correlation: normal or flight-to-quality regime.
    """
    T = len(returns_a)
    roll_corr = np.full(T, np.nan)

    for t in range(window, T):
        ra = returns_a[t-window:t]
        rb = returns_b[t-window:t]
        if ra.std() < 1e-10 or rb.std() < 1e-10:
            continue
        roll_corr[t] = np.corrcoef(ra, rb)[0, 1]

    # Regime classification
    regimes = np.full(T, 'normal', dtype=object)
    regimes[roll_corr > high_corr_threshold]  = 'crisis'   # corr spike
    regimes[roll_corr < low_corr_threshold]   = 'diverge'  # diversified
    regimes[np.isnan(roll_corr)]              = 'unknown'

    # Regime-conditional statistics
    crisis_mask  = (regimes == 'crisis')
    diverge_mask = (regimes == 'diverge')
    normal_mask  = (regimes == 'normal')

    def regime_stats(mask):
        if mask.sum() < 5:
            return {}
        ra_r = returns_a[mask]; rb_r = returns_b[mask]
        pnl_eq = 0.5 * ra_r + 0.5 * rb_r   # equal-weight portfolio
        return {
            'count':   int(mask.sum()),
            'corr':    float(np.nanmean(roll_corr[mask])),
            'avg_ret': float(pnl_eq.mean() * 252),
            'vol':     float(pnl_eq.std() * np.sqrt(252)),
        }

    return roll_corr, regimes, {
        'crisis':  regime_stats(crisis_mask),
        'diverge': regime_stats(diverge_mask),
        'normal':  regime_stats(normal_mask),
    }

# Equity vs Bonds: normally negative corr, spikes during flight-to-quality unwind
rng = np.random.default_rng(42)
T   = 1000
eq  = np.concatenate([
    rng.normal(0.0004, 0.012, 800),   # normal
    rng.normal(-0.001, 0.025, 200),   # stress
])
bond= np.concatenate([
    -0.2 * eq[:800] + rng.normal(0, 0.004, 800),   # negative corr in normal
    +0.6 * eq[800:] + rng.normal(0, 0.008, 200),   # positive corr in stress
])

roll_corr, regimes, stats = rolling_correlation_regimes(eq, bond, window=60)
for regime, s in stats.items():
    if s:
        print(f"{regime:8s}: count={s['count']:4d}  corr={s['corr']:6.3f}  "
              f"ann_ret={s['avg_ret']:6.2%}  vol={s['vol']:5.2%}")`,
    explanation:
      "Rolling correlation regimes capture the time-varying nature of diversification. In crises, equity-bond correlations spike positive (both assets sell off as investors raise cash), eliminating the normal diversification benefit. A threshold on 60-day rolling correlation provides a simple, interpretable regime signal. Regime-conditional statistics (Sharpe in crisis vs normal) reveal whether a portfolio's diversification holds up when it matters most. For multi-asset risk systems, correlation regimes inform dynamic hedging overlays.",
  },
];
