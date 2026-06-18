import { Snippet } from "./types";

export const pythonFinanceSnippets20260618B1: Snippet[] = [
  {
    id: "pyfin-20260618-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Yield Curve Calibration",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel_yield(T, beta0, beta1, beta2, tau):
    """
    y(T) = beta0 + beta1*(1-e^{-T/tau})/(T/tau)
                 + beta2*[(1-e^{-T/tau})/(T/tau) - e^{-T/tau}]
    beta0: long-run level; beta1: slope; beta2: curvature; tau: decay.
    """
    x = T / tau
    load1 = (1 - np.exp(-x)) / x
    load2 = load1 - np.exp(-x)
    return beta0 * np.ones_like(T) + beta1 * load1 + beta2 * load2

def fit_nelson_siegel(maturities, yields):
    """Joint fit over all 4 parameters via least-squares."""
    maturities = np.array(maturities)
    yields = np.array(yields)

    def sse(params):
        b0, b1, b2, tau = params
        if tau <= 0:
            return 1e10
        yhat = nelson_siegel_yield(maturities, b0, b1, b2, tau)
        return np.sum((yhat - yields)**2)

    # Grid search over tau for better starting point
    best = None
    for tau0 in np.linspace(0.5, 5.0, 10):
        res = minimize(sse, [yields[-1], yields[0]-yields[-1], 0.0, tau0],
                       method='Nelder-Mead', options={'maxiter': 2000, 'xatol': 1e-8})
        if best is None or res.fun < best.fun:
            best = res

    b0, b1, b2, tau = best.x
    print(f"beta0={b0:.4f}  beta1={b1:.4f}  beta2={b2:.4f}  tau={tau:.4f}")
    print(f"RMSE: {np.sqrt(best.fun/len(maturities))*10000:.2f} bps")
    return best.x

# USD Treasury curve (approximate 2024 levels)
tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.054, 0.053, 0.051, 0.048, 0.046, 0.044, 0.044, 0.043, 0.045, 0.044])
params = fit_nelson_siegel(tenors, yields)

# Evaluate fitted curve on fine grid
T_fine = np.linspace(0.1, 30, 300)
y_fit = nelson_siegel_yield(T_fine, *params)
print(f"2y-10y spread: {(y_fit[np.argmin(np.abs(T_fine-10))] - y_fit[np.argmin(np.abs(T_fine-2))])*10000:.1f} bps")`,
    explanation: "Nelson-Siegel provides a parsimonious 4-parameter fit to the yield curve where beta0/beta1/beta2 represent level, slope, and curvature — the three principal components that explain ~99.9% of historical yield curve variance. For fixed tau, the model is linear in betas and can be solved via OLS; full 4-parameter optimisation uses a grid search over tau to avoid local minima.",
  },
  {
    id: "pyfin-20260618-b1-hull-white",
    language: "python",
    title: "Hull-White One-Factor Short Rate Monte Carlo",
    tag: "rates",
    code: `import numpy as np
from scipy.stats import norm

def hull_white_mc(r0, kappa, theta_t, sigma, T, n_steps=252, n_paths=100_000, seed=42):
    """
    Hull-White (extended Vasicek):
      dr = kappa*(theta(t) - r)*dt + sigma*dW
    theta(t) fitted to initial yield curve — here taken as constant for illustration.
    Exact discretisation uses Gaussian distribution of r(t+dt)|r(t).
    Returns: (paths: n_paths x n_steps+1, discount factors for each path)
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    t_grid = np.linspace(0, T, n_steps + 1)

    emk = np.exp(-kappa * dt)
    var_step = sigma**2 * (1 - emk**2) / (2 * kappa)
    std_step = np.sqrt(var_step)

    r_paths = np.zeros((n_paths, n_steps + 1))
    r_paths[:, 0] = r0

    Z = rng.standard_normal((n_paths, n_steps))
    for t in range(n_steps):
        # theta(t): use fitted value from initial curve (constant here)
        theta = theta_t if np.isscalar(theta_t) else theta_t[t]
        r_paths[:, t+1] = (r_paths[:, t] * emk
                           + theta * (1 - emk)
                           + std_step * Z[:, t])

    # Discount factors: exp(-integral r dt)
    df_paths = np.exp(-r_paths[:, :-1].sum(axis=1) * dt)

    # ZCB price: E[exp(-int r dt)]
    zcb = df_paths.mean()
    se = df_paths.std() / np.sqrt(n_paths)

    print(f"ZCB P(0,{T}) MC   = {zcb:.6f} +/- {1.96*se:.6f}")

    # Analytic Vasicek ZCB for comparison
    B = (1 - np.exp(-kappa*T)) / kappa
    A = np.exp((theta_t - sigma**2/(2*kappa**2))*(B - T) - sigma**2*B**2/(4*kappa))
    zcb_analytic = A * np.exp(-B * r0)
    print(f"ZCB P(0,{T}) analytic = {zcb_analytic:.6f}")
    return r_paths, df_paths

r_paths, dfs = hull_white_mc(r0=0.04, kappa=0.5, theta_t=0.05, sigma=0.01, T=5.0)`,
    explanation: "The Hull-White model extends Vasicek by allowing theta(t) to be time-varying, calibrated to match the initial yield curve exactly (perfect fit to today's market prices). The exact discretisation — sampling from the known Gaussian conditional distribution — avoids Euler-Milstein bias regardless of step size, critical for accurate swaption and Bermudan pricing.",
  },
  {
    id: "pyfin-20260618-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Dynamic Hedge Ratio for Pairs Trading",
    tag: "stat-arb",
    code: `import numpy as np

def kalman_pairs(y, x, delta=1e-4, R=1e-3):
    """
    State-space pairs model: y_t = beta_t * x_t + alpha_t + e_t
    State: [beta_t, alpha_t], evolves as random walk.
    delta: state noise variance (how fast hedge ratio drifts).
    R: observation noise variance.
    Returns: beta_path, alpha_path, spread_path, Q_path (uncertainty).
    """
    n = len(y)
    # State: [beta, alpha]
    theta = np.zeros(2)        # initial state
    P = np.eye(2)              # state covariance
    Q = delta / (1 - delta) * np.eye(2)  # state transition noise

    beta_path  = np.zeros(n)
    alpha_path = np.zeros(n)
    spread     = np.zeros(n)
    Q_path     = np.zeros(n)

    for t in range(n):
        # Measurement matrix H_t = [x_t, 1]
        H = np.array([x[t], 1.0])

        # Predict
        # (state random walk: no transition matrix needed — stays the same)
        P = P + Q

        # Update
        S = H @ P @ H + R             # innovation variance
        K = P @ H / S                  # Kalman gain
        y_pred = H @ theta             # predicted y
        innov = y[t] - y_pred

        theta = theta + K * innov      # updated state
        P = (np.eye(2) - np.outer(K, H)) @ P

        beta_path[t]  = theta[0]
        alpha_path[t] = theta[1]
        spread[t]     = y[t] - theta[0] * x[t] - theta[1]
        Q_path[t]     = np.sqrt(S)    # 1-sigma uncertainty

    z_score = spread / Q_path
    return beta_path, alpha_path, z_score

# Generate cointegrated pair
rng = np.random.default_rng(42)
n = 500
x = np.cumsum(rng.normal(0, 1, n))
# True beta drifts slowly over time
true_beta = 2.0 + np.cumsum(rng.normal(0, 0.005, n))
y = true_beta * x + rng.normal(0, 2, n)

beta, alpha, z = kalman_pairs(y, x)
# Trading rule: enter when |z| > 2, exit when |z| < 0.5
entries = np.abs(z) > 2.0
print(f"Estimated beta range: [{beta.min():.2f}, {beta.max():.2f}]")
print(f"Signals: {entries.sum()} entry days out of {n}")`,
    explanation: "The Kalman filter provides a time-varying hedge ratio that adapts to slowly changing economic relationships — superior to static OLS when the cointegrating vector drifts. The key parameter delta controls the speed of adaptation: small delta assumes a stable relationship (few updates), large delta allows rapid mean-reversion of the hedge ratio. The z-score of the spread normalised by the predicted standard deviation provides a natural, calibrated trading signal.",
  },
  {
    id: "pyfin-20260618-b1-sabr-calib",
    language: "python",
    title: "SABR Model Calibration (Hagan Approximation)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan (2002) SABR approximate implied vol formula.
    Returns Black-Scholes implied volatility for given SABR parameters.
    """
    if abs(F - K) < 1e-10:
        # ATM formula
        FK_mid = F
        term1 = alpha / (FK_mid**(1 - beta))
        term2 = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**(2-2*beta)
                     + rho*beta*nu*alpha/(4*FK_mid**(1-beta))
                     + (2-3*rho**2)/24 * nu**2) * T
        return term1 * term2

    z = nu / alpha * (F*K)**((1-beta)/2) * np.log(F/K)
    x_z = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    FK_beta = (F*K)**((1-beta)/2)
    log_FK  = np.log(F/K)

    A = alpha / (FK_beta * (1 + (1-beta)**2/24 * log_FK**2
                            + (1-beta)**4/1920 * log_FK**4))
    B = z / x_z if abs(x_z) > 1e-10 else 1.0

    C = 1 + ((1-beta)**2/24 * alpha**2 / FK_beta**2
             + rho*beta*nu*alpha/(4*FK_beta)
             + (2-3*rho**2)/24 * nu**2) * T

    return A * B * C

def calibrate_sabr(strikes, market_vols, F, T, beta=0.5):
    """Calibrate alpha, rho, nu for fixed beta via least-squares."""
    def sse(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        model_vols = [sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes]
        return np.sum((np.array(model_vols) - np.array(market_vols))**2)

    # ATM vol gives initial alpha estimate
    atm_idx = np.argmin(np.abs(np.array(strikes) - F))
    alpha0 = market_vols[atm_idx] * F**(1-beta)
    res = minimize(sse, [alpha0, -0.3, 0.5], method='Nelder-Mead',
                   options={'xatol': 1e-7, 'fatol': 1e-10, 'maxiter': 5000})
    alpha, rho, nu = res.x
    print(f"SABR: alpha={alpha:.4f} rho={rho:.4f} nu={nu:.4f} beta={beta}")

    model_vols = [sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes]
    rmse = np.sqrt(np.mean((np.array(model_vols) - np.array(market_vols))**2)) * 10000
    print(f"RMSE: {rmse:.2f} vols bps")
    return alpha, rho, nu

F, T = 100.0, 0.5
strikes = [85, 90, 95, 100, 105, 110, 115]
# Simulate a skewed market vol surface
true = [sabr_vol(F, K, T, 0.25, 0.5, -0.4, 0.6) for K in strikes]
alpha, rho, nu = calibrate_sabr(strikes, true, F, T, beta=0.5)`,
    explanation: "The SABR model's Hagan approximation gives a closed-form relationship between model parameters (alpha, rho, nu) and implied volatility across strikes, making calibration a fast nonlinear least-squares problem rather than Monte Carlo. The rho parameter controls skew (negative rho → downward skew for equity), while nu controls the vol-of-vol (smile curvature). Beta is typically fixed at 0.5 (CEV-like) or 1.0 (lognormal backbone) before calibrating the remaining parameters.",
  },
  {
    id: "pyfin-20260618-b1-var-deltanormal",
    language: "python",
    title: "Delta-Normal Parametric VaR",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def delta_normal_var(weights, mu, Sigma, confidence=0.99, horizon_days=1, notional=1e6):
    """
    Parametric VaR under multivariate normal returns.
    sigma_p^2 = w' Sigma w  (portfolio variance)
    VaR_p = notional * (-mu_p + z_alpha * sigma_p) * sqrt(horizon)
    where mu and Sigma are DAILY parameters.
    """
    w = np.array(weights)
    w /= w.sum()

    mu_p = w @ mu
    sigma_p = np.sqrt(w @ Sigma @ w)
    z = norm.ppf(confidence)

    # Daily VaR (1-day horizon)
    var_1d = notional * (-mu_p + z * sigma_p)
    # Scale to horizon via square-root-of-time
    var_h  = notional * (-mu_p * horizon_days + z * sigma_p * np.sqrt(horizon_days))

    # Component VaR: contribution of each position
    marginal_var = notional * Sigma @ w / sigma_p * z
    comp_var = w * marginal_var
    # Diversified vs undiversified VaR
    undiversified = notional * z * np.sqrt(np.diag(Sigma)) * np.abs(w)

    print(f"Portfolio vol (daily): {sigma_p*100:.3f}%")
    print(f"1-day {confidence*100:.0f}% VaR   : \${var_1d:,.0f}")
    print(f"{horizon_days}-day {confidence*100:.0f}% VaR  : \${var_h:,.0f}")
    print(f"Diversification benefit: \${(undiversified.sum() - var_1d):,.0f}")

    return var_1d, var_h, comp_var

# Example: 4-asset portfolio
rng = np.random.default_rng(7)
n = 4
daily_vols = np.array([0.016, 0.020, 0.018, 0.022])  # ~25% annual
corr = np.array([[1.0, 0.5, 0.3, 0.2],
                 [0.5, 1.0, 0.4, 0.3],
                 [0.3, 0.4, 1.0, 0.1],
                 [0.2, 0.3, 0.1, 1.0]])
Sigma = np.diag(daily_vols) @ corr @ np.diag(daily_vols)
mu = np.array([0.0004, 0.0005, 0.0003, 0.0006])
w = [0.4, 0.3, 0.2, 0.1]

var_1d, var_10d, cvars = delta_normal_var(w, mu, Sigma, horizon_days=10)`,
    explanation: "Delta-normal VaR assumes returns are jointly normal and uses the portfolio's mean and variance to compute quantile losses analytically. Its key advantage is speed (one matrix multiply) but its flaw is fat-tail underestimation — historical equity returns have excess kurtosis of 3-6, making the normal 99% VaR too low by 20-40%. Component VaR identifies which positions contribute most to tail risk, guiding de-risking decisions.",
  },
  {
    id: "pyfin-20260618-b1-var-historical",
    language: "python",
    title: "Historical Simulation VaR with Volatility Scaling",
    tag: "risk",
    code: `import numpy as np

def historical_var(returns, weights, confidence=0.99, horizon=1,
                   vol_scale=True, ewma_lambda=0.94, notional=1e6):
    """
    Historical simulation VaR.
    vol_scale: apply Hull-White volatility scaling (adjust scenarios by current/historical vol).
    Returns are daily, shape (T, n_assets).
    """
    returns = np.array(returns)
    T, n = returns.shape
    w = np.array(weights) / np.sum(weights)

    # Portfolio returns for each historical scenario
    port_ret = returns @ w   # shape (T,)

    if vol_scale:
        # EWMA volatility estimate at each point in time
        ewma_var = np.zeros(T)
        ewma_var[0] = port_ret[0]**2
        for t in range(1, T):
            ewma_var[t] = ewma_lambda * ewma_var[t-1] + (1-ewma_lambda) * port_ret[t-1]**2
        current_vol = np.sqrt(ewma_var[-1])
        hist_vol    = np.sqrt(ewma_var)

        # Scale each scenario: multiply by (current_vol / vol_at_that_time)
        scaled = port_ret * (current_vol / np.maximum(hist_vol, 1e-8))
    else:
        scaled = port_ret

    # VaR: quantile of scaled losses
    losses = -scaled * notional * np.sqrt(horizon)
    var = np.percentile(losses, confidence * 100)
    es  = losses[losses >= var].mean()

    # Stressed VaR: worst 250-day window
    rolling_var = [np.percentile(-scaled[i:i+250]*notional, confidence*100)
                   for i in range(max(1, T-250))]
    stressed_var = max(rolling_var)

    print(f"Historical {confidence*100:.0f}% VaR  : \${var:,.0f}")
    print(f"Historical {confidence*100:.0f}% ES   : \${es:,.0f}")
    print(f"Stressed VaR (worst 250d): \${stressed_var:,.0f}")
    return var, es

# Generate synthetic return history
rng = np.random.default_rng(3)
T, n = 1000, 4
vols = np.array([0.016, 0.020, 0.018, 0.022])
ret = rng.normal(0, 1, (T, n)) * vols[None, :]
# Add a crisis period with 3× vol
ret[400:450] *= 3.0
w = [0.4, 0.3, 0.2, 0.1]
historical_var(ret, w)`,
    explanation: "Historical simulation VaR makes no distributional assumption — it uses actual past returns as scenarios, automatically capturing fat tails, skewness, and cross-asset tail dependence. The Hull-White volatility scaling multiplies each historical scenario by (today's vol / vol at scenario time), reweighting recent crisis scenarios upward when current volatility is elevated. This addresses the 'stale scenario' problem: plain historical simulation underestimates risk after low-vol periods.",
  },
  {
    id: "pyfin-20260618-b1-garch11",
    language: "python",
    title: "GARCH(1,1) Log-Likelihood Estimation",
    tag: "econometrics",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_fit(returns):
    """
    GARCH(1,1): sigma_t^2 = omega + alpha*e_{t-1}^2 + beta*sigma_{t-1}^2
    Constraints: omega>0, alpha>=0, beta>=0, alpha+beta<1 (stationarity).
    Returns (omega, alpha, beta) MLE estimates.
    """
    n = len(returns)

    def neg_ll(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        sigma2 = np.zeros(n)
        sigma2[0] = returns.var()
        ll = 0.0
        for t in range(1, n):
            sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
            if sigma2[t] <= 0:
                return 1e10
            ll += -0.5 * (np.log(2*np.pi) + np.log(sigma2[t]) + returns[t]**2 / sigma2[t])
        return -ll

    # Initial guess: moment matching
    var0 = returns.var()
    omega0 = var0 * 0.05
    res = minimize(neg_ll, [omega0, 0.1, 0.8], method='L-BFGS-B',
                   bounds=[(1e-8, None), (0, 0.999), (0, 0.999)])

    omega, alpha, beta = res.x
    persistence = alpha + beta
    long_run_vol = np.sqrt(omega / (1 - persistence)) * np.sqrt(252)

    print(f"omega={omega:.6f}  alpha={alpha:.4f}  beta={beta:.4f}")
    print(f"Persistence (alpha+beta): {persistence:.4f}")
    print(f"Long-run annual vol: {long_run_vol*100:.2f}%")
    print(f"HL of variance shocks: {-np.log(2)/np.log(persistence):.1f} days")

    # Filtered conditional variance
    sigma2 = np.zeros(n)
    sigma2[0] = returns.var()
    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    return omega, alpha, beta, sigma2

rng = np.random.default_rng(17)
n = 2000
# Generate GARCH(1,1) process with omega=1e-5, alpha=0.1, beta=0.85
omega_t, alpha_t, beta_t = 1e-5, 0.1, 0.85
sigma2 = np.zeros(n); sigma2[0] = omega_t / (1 - alpha_t - beta_t)
e = rng.standard_normal(n)
for t in range(1, n):
    sigma2[t] = omega_t + alpha_t * (e[t-1]*np.sqrt(sigma2[t-1]))**2 + beta_t*sigma2[t-1]
returns = e * np.sqrt(sigma2)
garch11_fit(returns)`,
    explanation: "GARCH(1,1) captures volatility clustering — the empirical observation that large returns tend to be followed by large returns. The persistence parameter alpha+beta (typically 0.97-0.99 for daily equity returns) measures how quickly volatility shocks decay: a half-life of 23 days means a market shock takes 3 weeks to decay by half. High persistence is why GARCH-based VaR responds slowly to volatility regime changes compared to EWMA models.",
  },
  {
    id: "pyfin-20260618-b1-pca-returns",
    language: "python",
    title: "PCA Factor Model on Equity Return Matrix",
    tag: "factor-models",
    code: `import numpy as np

def pca_factor_model(returns, n_factors=3):
    """
    PCA on demeaned return matrix: R = F @ L^T + E
    F: T x k factor returns, L: n x k loadings, E: idiosyncratic.
    Returns: loadings, factor_returns, explained_var_ratio, R2_per_stock.
    """
    T, n = returns.shape
    # Demean cross-sectionally
    R = returns - returns.mean(axis=0)

    # Covariance matrix (time-series covariance)
    C = R.T @ R / T   # (n x n)

    # Eigendecomposition (sorted descending)
    vals, vecs = np.linalg.eigh(C)
    idx = np.argsort(vals)[::-1]
    vals, vecs = vals[idx], vecs[:, idx]

    # Top k factors
    loadings = vecs[:, :n_factors]           # (n, k) — eigenvectors
    factor_returns = R @ loadings             # (T, k) — time series of factors

    # Explained variance
    expl_ratio = vals[:n_factors] / vals.sum()
    cum_expl   = expl_ratio.cumsum()

    # R2 per stock
    R_hat = factor_returns @ loadings.T
    tss = (R**2).sum(axis=0)
    rss = ((R - R_hat)**2).sum(axis=0)
    r2  = 1 - rss / (tss + 1e-15)

    print(f"Explained variance:")
    for i, (ev, ce) in enumerate(zip(expl_ratio, cum_expl)):
        print(f"  PC{i+1}: {ev*100:.2f}%  cumul: {ce*100:.2f}%")
    print(f"Mean R2 per stock: {r2.mean():.3f}")

    # Factor interpretation: correlation of factor with equal-weight portfolio
    ewp_ret = R.mean(axis=1)
    for i in range(n_factors):
        corr = np.corrcoef(factor_returns[:, i], ewp_ret)[0, 1]
        print(f"  PC{i+1} corr with EWP: {corr:.3f}")

    return loadings, factor_returns, expl_ratio, r2

# Generate 50 correlated stock returns
rng = np.random.default_rng(5)
n, T = 50, 500
market_factor = rng.normal(0, 0.01, T)
sector_factor = rng.normal(0, 0.007, T)
betas_m = rng.uniform(0.7, 1.3, n)
betas_s = rng.uniform(-0.3, 0.3, n)
idio    = rng.normal(0, 0.015, (T, n))
returns = market_factor[:, None]*betas_m + sector_factor[:, None]*betas_s + idio

loadings, frets, expl, r2 = pca_factor_model(returns)`,
    explanation: "PCA on the return covariance matrix extracts the directions of maximum variance — the first eigenvector corresponds to the market factor (all stocks move together), explaining ~40-60% of cross-sectional variance for large-cap equities. The loadings matrix L gives each stock's factor exposure; the idiosyncratic residual R - F·L^T should be approximately uncorrelated across stocks in a well-specified factor model.",
  },
  {
    id: "pyfin-20260618-b1-rf-alpha",
    language: "python",
    title: "Random Forest Alpha Signal from Factor Exposures",
    tag: "factor-models",
    code: `import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler

def rf_alpha_model(features, forward_returns, n_estimators=100, n_splits=5):
    """
    Random forest regressor for 1-month forward return prediction.
    features: (T, n_features) — momentum, value, quality, vol factors.
    forward_returns: (T,) — 1-month ahead return.
    Walk-forward validation via TimeSeriesSplit.
    """
    T = len(forward_returns)
    tscv = TimeSeriesSplit(n_splits=n_splits)
    scaler = StandardScaler()

    oos_preds = np.full(T, np.nan)
    oos_ic    = []

    for fold, (train_idx, test_idx) in enumerate(tscv.split(features)):
        X_train = scaler.fit_transform(features[train_idx])
        X_test  = scaler.transform(features[test_idx])
        y_train = forward_returns[train_idx]

        rf = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=4,               # shallow to prevent overfit on small N
            min_samples_leaf=20,
            n_jobs=-1,
            random_state=42
        )
        rf.fit(X_train, y_train)
        preds = rf.predict(X_test)
        oos_preds[test_idx] = preds

        ic = np.corrcoef(preds, forward_returns[test_idx])[0, 1]
        oos_ic.append(ic)
        print(f"  Fold {fold+1}: IC={ic:.3f}")

    valid = ~np.isnan(oos_preds)
    ic_full = np.corrcoef(oos_preds[valid], forward_returns[valid])[0, 1]
    icir    = np.mean(oos_ic) / (np.std(oos_ic) + 1e-8)
    print(f"Full OOS IC: {ic_full:.3f}  ICIR: {icir:.2f}")

    # Feature importance
    rf_full = RandomForestRegressor(n_estimators=n_estimators, max_depth=4,
                                     min_samples_leaf=20, n_jobs=-1, random_state=42)
    rf_full.fit(scaler.fit_transform(features), forward_returns)
    feat_names = ['momentum_1m', 'momentum_12m', 'pb_ratio', 'roa', 'vol_60d', 'size']
    for name, imp in sorted(zip(feat_names, rf_full.feature_importances_),
                            key=lambda x: -x[1]):
        print(f"  {name:15s}: {imp:.4f}")
    return oos_preds, ic_full

# Simulate factor data
rng = np.random.default_rng(11)
T = 300
features = rng.normal(0, 1, (T, 6))
# Forward return has weak signal from momentum and value
fwd_ret = (0.15 * features[:, 0] + 0.10 * features[:, 2]
           + rng.normal(0, 0.08, T))
rf_alpha_model(features, fwd_ret)`,
    explanation: "Random forest is used in quant equity because it handles nonlinear interactions between factors (e.g., momentum is stronger for small-cap or high-quality stocks) without overfitting as severely as deep trees. Walk-forward time-series cross-validation is essential — standard k-fold leaks future information. The Information Coefficient (IC = rank correlation of predictions and outcomes) and ICIR (IC/stdev(IC)) are the standard performance metrics for quantitative signals.",
  },
  {
    id: "pyfin-20260618-b1-control-variates",
    language: "python",
    title: "Control Variates MC: Geometric Asian as Control for Arithmetic",
    tag: "monte-carlo",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_closed(S, K, T, r, sigma, N):
    """Kemna-Vorst closed form for geometric Asian call."""
    sigma_g = sigma * np.sqrt((N+1)*(2*N+1) / (6*N*N))
    b = 0.5*(r - 0.5*sigma**2) + 0.5*sigma_g**2
    F = S * np.exp(b * T)
    sqT = np.sqrt(T)
    d1 = (np.log(F/K) + 0.5*sigma_g**2*T) / (sigma_g*sqT)
    d2 = d1 - sigma_g * sqT
    return np.exp(-r*T) * (F*norm.cdf(d1) - K*norm.cdf(d2))

def asian_mc_cv(S, K, T, r, sigma, N=52, n_paths=100_000, seed=42):
    """
    Arithmetic Asian call price via control variates.
    Control: geometric Asian with known closed-form expectation.
    """
    rng = np.random.default_rng(seed)
    dt = T / N
    Z = rng.standard_normal((n_paths, N))

    log_incr = (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z
    log_S = np.log(S) + np.cumsum(log_incr, axis=1)
    S_paths = np.exp(log_S)

    arith_avg = S_paths.mean(axis=1)
    geom_avg  = np.exp(np.log(S_paths).mean(axis=1))  # geometric mean

    X_arith = np.maximum(arith_avg - K, 0)
    X_geom  = np.maximum(geom_avg  - K, 0)

    EX_geom = geometric_asian_closed(S, K, T, r, sigma, N) * np.exp(r*T)  # undiscounted

    # Optimal control variate coefficient
    cov_mat = np.cov(X_arith, X_geom)
    beta_opt = cov_mat[0, 1] / (cov_mat[1, 1] + 1e-12)

    X_cv = X_arith - beta_opt * (X_geom - EX_geom)
    price_cv    = np.exp(-r*T) * X_cv.mean()
    price_crude = np.exp(-r*T) * X_arith.mean()

    se_cv    = np.exp(-r*T) * X_cv.std()    / np.sqrt(n_paths)
    se_crude = np.exp(-r*T) * X_arith.std() / np.sqrt(n_paths)

    print(f"Arithmetic Asian call (crude): {price_crude:.4f}  SE: {se_crude:.6f}")
    print(f"Arithmetic Asian call (CV):    {price_cv:.4f}  SE: {se_cv:.6f}")
    print(f"Variance reduction factor: {(se_crude/se_cv)**2:.1f}x")
    print(f"Optimal beta: {beta_opt:.4f}")
    return price_cv

asian_mc_cv(S=100, K=100, T=1.0, r=0.05, sigma=0.20)`,
    explanation: "The geometric average Asian option is an ideal control variate because it is highly correlated with the arithmetic average (both depend on the same path of stock prices) and has a known closed-form price under GBM. The optimal beta minimises variance by removing exactly the shared component; typical variance reductions of 10-50× reduce the required number of paths by the same factor to achieve a given precision.",
  },
  {
    id: "pyfin-20260618-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Execution Trajectory",
    tag: "execution",
    code: `import numpy as np

def almgren_chriss(Q, T, sigma, eta, gamma, lam=1e-6, n_steps=20):
    """
    Almgren-Chriss (2001) optimal liquidation.
    Q: initial shares, T: time horizon, sigma: price vol,
    eta: temporary impact coefficient, gamma: permanent impact,
    lam: risk-aversion (trades off E[cost] vs Var[cost]).
    Closed-form: x_t = Q * sinh(kappa*(T-t)) / sinh(kappa*T)
    where kappa = sqrt(lam * sigma^2 / eta).
    """
    kappa = np.sqrt(lam * sigma**2 / eta)
    dt = T / n_steps
    t_grid = np.linspace(0, T, n_steps + 1)

    # Optimal inventory trajectory
    x = Q * np.sinh(kappa * (T - t_grid)) / np.sinh(kappa * T)
    x = np.maximum(x, 0)

    # Trading rate (shares per unit time)
    v = -np.diff(x) / dt

    # Expected cost components
    temp_impact  = eta * np.sum(v**2) * dt          # temporary impact
    perm_impact  = 0.5 * gamma * Q**2                # permanent impact (price independent of schedule)
    timing_risk  = lam * sigma**2 * np.sum(x[:-1]**2) * dt  # risk cost (inventory*vol)

    total_cost   = temp_impact + perm_impact + timing_risk
    is_shortfall = total_cost

    # Compare with TWAP (uniform liquidation)
    v_twap    = Q / T
    twap_cost = eta * v_twap**2 * T + perm_impact + lam * sigma**2 * (Q**2 * T / 3)

    print(f"Optimal trajectory (kappa={kappa:.4f}):")
    print(f"  Temp impact: {temp_impact:.4f}")
    print(f"  Timing risk: {timing_risk:.4f}")
    print(f"  Total cost : {total_cost:.4f}")
    print(f"  TWAP cost  : {twap_cost:.4f}")
    print(f"  Savings    : {(twap_cost - total_cost):.4f} ({(twap_cost-total_cost)/twap_cost*100:.1f}%)")
    print(f"\nSchedule (first 5 slices):")
    for i in range(min(5, n_steps)):
        print(f"  t={t_grid[i]:.2f}: inventory={x[i]:.0f}, trade={v[i]:.1f}/unit-time")
    return x, v, total_cost

almgren_chriss(Q=100_000, T=1.0, sigma=0.02, eta=0.1, gamma=5e-7, lam=1e-6)`,
    explanation: "The Almgren-Chriss framework balances market impact cost (trading faster → higher temporary impact) against timing risk (trading slower → more exposure to price moves). The closed-form trajectory is a hyperbolic sine schedule: with high risk aversion (large lambda) the optimal strategy front-loads execution to reduce inventory variance, while with zero risk aversion it degenerates to TWAP. The kappa parameter is the key scalar controlling the urgency of the schedule.",
  },
  {
    id: "pyfin-20260618-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Options",
    tag: "monte-carlo",
    code: `import numpy as np
from scipy.stats import norm

def is_call_mc(S, K, T, r, sigma, n_paths=50_000, seed=42):
    """
    Importance sampling for deep OTM call.
    Shift the drift of Z to centre paths near the strike:
      mu* = argmin KL divergence s.t. E*[payoff] large
      For call: mu* = ln(K/S)/(sigma*sqrt(T)) - (r - 0.5*sigma^2)*sqrt(T)/sigma
    The likelihood ratio (Radon-Nikodym) corrects for the change of measure.
    """
    rng = np.random.default_rng(seed)
    sqT = np.sqrt(T)

    # Optimal shift: centre the log-normal distribution at K
    mu_star = (np.log(K/S) - (r - 0.5*sigma**2)*T) / (sigma*sqT)

    # Crude MC
    Z_crude = rng.standard_normal(n_paths)
    ST_crude = S * np.exp((r - 0.5*sigma**2)*T + sigma*sqT*Z_crude)
    pay_crude = np.maximum(ST_crude - K, 0)
    price_crude = np.exp(-r*T) * pay_crude.mean()
    se_crude    = np.exp(-r*T) * pay_crude.std() / np.sqrt(n_paths)

    # Importance sampling: sample Z ~ N(mu*, 1)
    Z_is = rng.standard_normal(n_paths) + mu_star
    ST_is = S * np.exp((r - 0.5*sigma**2)*T + sigma*sqT*Z_is)
    pay_is = np.maximum(ST_is - K, 0)

    # Likelihood ratio: dP/dP* = exp(-mu* * Z_is + 0.5 * mu_star^2)
    lr = np.exp(-mu_star * Z_is + 0.5 * mu_star**2)
    pay_weighted = pay_is * lr
    price_is = np.exp(-r*T) * pay_weighted.mean()
    se_is    = np.exp(-r*T) * pay_weighted.std() / np.sqrt(n_paths)

    # Black-Scholes exact
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2 = d1 - sigma*sqT
    bs_exact = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    print(f"BS exact : {bs_exact:.6f}")
    print(f"Crude MC : {price_crude:.6f}  SE: {se_crude:.6f}")
    print(f"IS MC    : {price_is:.6f}  SE: {se_is:.6f}")
    print(f"Variance reduction: {(se_crude/se_is)**2:.0f}x")
    return price_is

# Deep OTM: K = 1.5 * S → most paths end worthless under crude MC
is_call_mc(S=100, K=150, T=0.5, r=0.05, sigma=0.20)`,
    explanation: "For a deep OTM call (K = 1.5S, 50% OTM), less than 1% of crude MC paths have non-zero payoff — 99% of computation is wasted. Importance sampling shifts the sampling distribution to centre on the strike, then corrects via the likelihood ratio (Radon-Nikodym derivative). The variance reduction is proportional to 1/p where p is the probability of the event under the original measure — a 1000× speedup for 0.1% probability events.",
  },
  {
    id: "pyfin-20260618-b1-pandas-multiindex",
    language: "python",
    title: "Pandas Multi-Index for Cross-Sectional Factor Research",
    tag: "data",
    code: `import numpy as np
import pandas as pd

def build_factor_panel(n_stocks=50, n_periods=60):
    """Build a date x stock multi-index panel with factor data."""
    rng = np.random.default_rng(13)
    dates   = pd.date_range('2020-01-31', periods=n_periods, freq='ME')
    tickers = [f'STK{i:03d}' for i in range(n_stocks)]

    # Multi-index: (date, ticker)
    idx = pd.MultiIndex.from_product([dates, tickers], names=['date', 'ticker'])
    df = pd.DataFrame({
        'ret_fwd'   : rng.normal(0, 0.05, len(idx)),
        'momentum'  : rng.normal(0, 1, len(idx)),
        'value'     : rng.normal(0, 1, len(idx)),
        'quality'   : rng.normal(0, 1, len(idx)),
        'vol_30d'   : rng.uniform(0.01, 0.05, len(idx)),
    }, index=idx)
    return df

df = build_factor_panel()

# Cross-sectional z-score per date
def cs_zscore(panel):
    return panel.groupby(level='date').transform(
        lambda x: (x - x.mean()) / (x.std() + 1e-8)
    )

factors = ['momentum', 'value', 'quality']
df[factors] = cs_zscore(df[factors])

# Information coefficient per date (rank-IC)
def rank_ic(panel, factor, fwd='ret_fwd'):
    return panel.groupby(level='date').apply(
        lambda g: g[factor].rank().corr(g[fwd].rank(), method='spearman')
    )

for f in factors:
    ic_series = rank_ic(df, f)
    print(f"{f:12s}: mean IC={ic_series.mean():.3f}  ICIR={ic_series.mean()/ic_series.std():.2f}")

# Quintile portfolio returns
df['momentum_q'] = df.groupby(level='date')['momentum'].transform(
    lambda x: pd.qcut(x, 5, labels=False, duplicates='drop')
)
quintile_rets = df.groupby(['date', 'momentum_q'])['ret_fwd'].mean().unstack()
long_short = quintile_rets[4] - quintile_rets[0]
print(f"L/S momentum Sharpe: {long_short.mean()/long_short.std()*np.sqrt(12):.2f}")

# Pivot table: mean IC by quintile
print(df.pivot_table(values='ret_fwd', index='momentum_q', aggfunc='mean'))`,
    explanation: "Multi-index DataFrames are the standard structure for cross-sectional factor research panels. The groupby(level='date') pattern applies any function cross-sectionally (across stocks at each date) without looping over dates. Cross-sectional z-scoring neutralises level effects so factor exposures are comparable across time periods with different market regimes. The long-short Sharpe ratio annualises to compare signal quality across factors.",
  },
  {
    id: "pyfin-20260618-b1-svensson",
    language: "python",
    title: "Svensson Extended Yield Curve (6-Parameter)",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_yield(T, b0, b1, b2, b3, tau1, tau2):
    """
    Svensson (1994) extension of Nelson-Siegel with second hump:
    y(T) = b0 + b1*(1-e^{-T/t1})/(T/t1)
              + b2*[(1-e^{-T/t1})/(T/t1) - e^{-T/t1}]
              + b3*[(1-e^{-T/t2})/(T/t2) - e^{-T/t2}]
    """
    def ns_factor(T, tau):
        x = T / tau
        load1 = (1 - np.exp(-x)) / x
        load2 = load1 - np.exp(-x)
        return load1, load2

    L1, L2 = ns_factor(T, tau1)
    L3, L4 = ns_factor(T, tau2)
    return b0 + b1*L1 + b2*L2 + b3*L4

def fit_svensson(maturities, yields):
    """Fit 6-parameter Svensson curve."""
    M, Y = np.array(maturities), np.array(yields)

    def sse(p):
        b0, b1, b2, b3, t1, t2 = p
        if t1 <= 0 or t2 <= 0 or t1 == t2:
            return 1e10
        yhat = svensson_yield(M, b0, b1, b2, b3, t1, t2)
        return np.sum((yhat - Y)**2)

    best = None
    for t1_0, t2_0 in [(1.0, 3.0), (0.5, 5.0), (2.0, 7.0), (1.5, 4.0)]:
        res = minimize(sse, [Y[-1], Y[0]-Y[-1], 0.1, 0.1, t1_0, t2_0],
                       method='Nelder-Mead', options={'maxiter': 5000, 'xatol': 1e-9})
        if best is None or res.fun < best.fun:
            best = res

    b0, b1, b2, b3, t1, t2 = best.x
    print(f"b0={b0:.4f} b1={b1:.4f} b2={b2:.4f} b3={b3:.4f}")
    print(f"tau1={t1:.4f} tau2={t2:.4f}")
    rmse = np.sqrt(best.fun / len(M)) * 10000
    print(f"RMSE: {rmse:.2f} bps")

    T_fine = np.linspace(0.25, 30, 200)
    y_fit = svensson_yield(T_fine, b0, b1, b2, b3, t1, t2)
    return best.x, y_fit

# German Bund curve (approximate 2024, inverted)
tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
yields = np.array([0.038, 0.037, 0.035, 0.028, 0.026, 0.025, 0.026, 0.027, 0.028, 0.028, 0.027])
params, y_fit = fit_svensson(tenors, yields)`,
    explanation: "Svensson extends Nelson-Siegel by adding a second curvature term with its own decay factor tau2, allowing the model to fit curves with two humps or a more complex long-end shape. This is the standard model used by central banks (BIS, ECB, SNB) for publishing official yield curves. The extra flexibility comes at the cost of identification risk when tau1 ≈ tau2 — starting from multiple tau pairs and selecting the best fit handles this.",
  },
  {
    id: "pyfin-20260618-b1-roll-spread",
    language: "python",
    title: "Roll's Effective Bid-Ask Spread Estimator",
    tag: "microstructure",
    code: `import numpy as np

def roll_spread(prices):
    """
    Roll (1984): effective spread = 2 * sqrt(-Cov(dp_t, dp_{t-1}))
    Under the Roll model, serial covariance of price changes is negative
    and equals -(s/2)^2 where s is the effective spread.
    Glosten-Harris extension: also estimates adverse selection component.
    """
    dP = np.diff(prices)
    n = len(dP)

    # Serial covariance of price changes (lag-1)
    cov_1 = np.cov(dP[:-1], dP[1:])[0, 1]

    # Roll estimator: spread = 2*sqrt(-cov) if cov < 0
    if cov_1 < 0:
        spread_roll = 2 * np.sqrt(-cov_1)
    else:
        spread_roll = 0.0
        print("Warning: positive serial covariance (trending prices or zero spread)")

    # Percentage spread relative to midprice
    mid = prices[:-1].mean()
    spread_pct = spread_roll / mid * 100

    # Variance ratio: var(5-step) / (5 * var(1-step)) — measure of microstructure noise
    dP5 = prices[5:] - prices[:-5]
    vr = np.var(dP5) / (5 * np.var(dP))

    # Alternative: Corwin-Schultz (2012) using high-low prices
    # spread_cs = 2*(exp(alpha) - 1) / (1 + exp(alpha)) where alpha from daily HL ranges
    print(f"Roll effective spread : {spread_roll:.4f} ({spread_pct:.3f}%)")
    print(f"Lag-1 price autocov   : {cov_1:.6f}")
    print(f"Variance ratio (5/1)  : {vr:.4f}")
    return spread_roll, cov_1, vr

def kyle_lambda(trades, midquotes):
    """
    Kyle (1985) price impact lambda: dp = lambda * signed_flow + noise.
    lambda measures how much the mid moves per unit of signed order flow.
    """
    signed_flow = np.sign(trades['direction']) * trades['size']
    dq = np.diff(midquotes)
    n = min(len(dq), len(signed_flow))
    X = signed_flow[:n].reshape(-1, 1)
    Y = dq[:n]
    from numpy.linalg import lstsq
    lam = lstsq(X, Y, rcond=None)[0][0]
    print(f"Kyle lambda: {lam:.6f} (price move per unit signed flow)")
    return lam

# Generate AR(1) price with bid-ask bounce
rng = np.random.default_rng(19)
n = 2000
spread = 0.02   # true half-spread
mid = 100 + np.cumsum(rng.normal(0, 0.1, n))  # random walk midprice
side = rng.choice([-1, 1], n)                   # trade direction
prices = mid + side * spread + rng.normal(0, 0.005, n)  # add noise
roll_spread(prices)`,
    explanation: "Roll's model decomposes observed transaction prices into a random-walk midprice plus a bid-ask spread bounce. The negative first-order autocovariance of price changes is the signature of the bounce: a buy at the ask is likely followed by a sell at the bid, creating a negative correlation. The implied spread estimate is model-free and computationally trivial, making it practical for estimating transaction costs across thousands of instruments.",
  },
  {
    id: "pyfin-20260618-b1-stress-test",
    language: "python",
    title: "Historical Scenario P&L Stress Testing",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def stress_test(positions, factor_shocks, factor_sensitivities, scenario_names):
    """
    Stress test: P&L = sum_i (position_i * sum_f sensitivity_i_f * shock_f)
    positions: dict {asset: notional}
    factor_shocks: dict {scenario: {factor: shock}}
    factor_sensitivities: dict {asset: {factor: sensitivity}}
    """
    assets    = list(positions.keys())
    scenarios = list(factor_shocks.keys())
    factors   = list(next(iter(factor_shocks.values())).keys())

    # Build matrices
    w = np.array([positions[a] for a in assets])
    # Sensitivity matrix: (n_assets x n_factors)
    S_mat = np.array([[factor_sensitivities.get(a, {}).get(f, 0.0)
                       for f in factors] for a in assets])
    # Shock matrix: (n_scenarios x n_factors)
    D_mat = np.array([[factor_shocks[sc].get(f, 0.0)
                       for f in factors] for sc in scenarios])

    # P&L matrix: (n_scenarios x n_assets)
    pnl_mat = (S_mat @ D_mat.T).T  # (n_scenarios x n_assets)
    port_pnl = pnl_mat @ w          # (n_scenarios,) — portfolio P&L

    df = pd.DataFrame({
        'Scenario'  : scenarios,
        'Portfolio PnL (\$M)' : port_pnl / 1e6,
    })
    for a in assets[:4]:  # show top-4 assets
        idx = assets.index(a)
        df[f'{a} PnL'] = pnl_mat[:, idx] * w[idx]
    print(df.sort_values('Portfolio PnL (\$M)').to_string(index=False))
    return port_pnl

positions = {'SPX': 5e6, 'TY': 3e6, 'EUR': 2e6, 'GLD': 1e6}
factor_sensitivities = {
    'SPX': {'equity': 1.0, 'rates': -0.01, 'usd': -0.1, 'credit': -0.5},
    'TY':  {'equity': 0.0, 'rates': -8.0,  'usd':  0.0, 'credit': -0.2},
    'EUR': {'equity': 0.1, 'rates':  0.5,  'usd': -1.0, 'credit': -0.1},
    'GLD': {'equity':-0.2, 'rates': -0.3,  'usd': -0.8, 'credit':  0.3},
}
factor_shocks = {
    '2008 GFC Peak'   : {'equity':-0.50, 'rates': 0.02, 'usd': 0.08, 'credit': 0.03},
    'COVID Mar 2020'  : {'equity':-0.34, 'rates':-0.01, 'usd': 0.04, 'credit': 0.015},
    'Taper Tantrum 13': {'equity':-0.05, 'rates': 0.01, 'usd': 0.02, 'credit': 0.005},
    'EUR Crisis 2011' : {'equity':-0.25, 'rates':-0.005,'usd': 0.06, 'credit': 0.02},
    '1987 Black Monday':{'equity':-0.23, 'rates': 0.005,'usd':-0.02, 'credit': 0.01},
}
stress_test(positions, factor_shocks, factor_sensitivities, list(factor_shocks.keys()))`,
    explanation: "Stress testing applies predefined historical scenarios (factor shocks observed during crises) to the current portfolio's factor sensitivities. The linear P&L approximation P&L ≈ Σᵢ wᵢ · (Σf βᵢf · Δf) is first-order accurate for small shocks; for large shocks (GFC -50% equity), second-order gamma/convexity corrections improve accuracy. Scenarios are more conservative than parametric VaR because they reflect actual cross-asset correlation during crises rather than in-sample correlation.",
  },
  {
    id: "pyfin-20260618-b1-ou-mle",
    language: "python",
    title: "Ornstein-Uhlenbeck Process MLE and Half-Life Estimation",
    tag: "stat-arb",
    code: `import numpy as np
from scipy.optimize import minimize_scalar, minimize

def ou_mle(x, dt=1.0):
    """
    OU process: dx = kappa*(mu - x)*dt + sigma*dW
    Exact discrete-time likelihood (not Euler approximation):
      x_{t+1} | x_t ~ N(x_t*e^{-kappa*dt} + mu*(1-e^{-kappa*dt}),
                         sigma^2*(1-e^{-2*kappa*dt})/(2*kappa))
    """
    n = len(x)
    def neg_ll(params):
        kappa, mu, sigma = params
        if kappa <= 0 or sigma <= 0:
            return 1e10
        emk = np.exp(-kappa * dt)
        var_step = sigma**2 * (1 - emk**2) / (2 * kappa)
        if var_step <= 0:
            return 1e10
        x_cond_mean = x[:-1] * emk + mu * (1 - emk)
        resid = x[1:] - x_cond_mean
        ll = -0.5 * (n-1) * np.log(2 * np.pi * var_step) - 0.5 * (resid**2 / var_step).sum()
        return -ll

    res = minimize(neg_ll, [0.5, x.mean(), x.std()], method='L-BFGS-B',
                   bounds=[(1e-4, 50), (None, None), (1e-6, None)])
    kappa, mu, sigma = res.x

    # Half-life of mean reversion
    half_life = np.log(2) / kappa  # in units of dt

    # OU stationary distribution: N(mu, sigma^2/(2*kappa))
    stat_std = sigma / np.sqrt(2 * kappa)

    print(f"kappa  = {kappa:.4f}  (half-life = {half_life:.1f} periods)")
    print(f"mu     = {mu:.4f}")
    print(f"sigma  = {sigma:.4f}")
    print(f"Stat. std = {stat_std:.4f}")

    # Z-score of current spread
    z_now = (x[-1] - mu) / stat_std
    print(f"Current z-score: {z_now:.2f}")
    return kappa, mu, sigma, half_life

# Generate OU process
rng = np.random.default_rng(23)
n, dt = 500, 1.0
kappa_true, mu_true, sigma_true = 0.3, 2.0, 0.5
x = np.zeros(n)
x[0] = mu_true
for t in range(1, n):
    emk = np.exp(-kappa_true * dt)
    var_step = sigma_true**2 * (1 - emk**2) / (2 * kappa_true)
    x[t] = x[t-1]*emk + mu_true*(1-emk) + np.sqrt(var_step)*rng.standard_normal()

kappa, mu, sigma, hl = ou_mle(x, dt=dt)`,
    explanation: "The OU process is the continuous-time model for mean-reverting spreads in pairs trading and fixed-income basis trades. The half-life — ln(2)/kappa — is the most interpretable parameter: it measures how long it takes for a deviation from equilibrium to halve. The exact discrete-time likelihood is more accurate than the Euler approximation (which misestimates kappa when kappa·dt is not small), especially important for daily or weekly data with slow mean reversion.",
  },
  {
    id: "pyfin-20260618-b1-zscore-pairs",
    language: "python",
    title: "Z-Score Pairs Trading with Entry/Exit/Stop Signals",
    tag: "stat-arb",
    code: `import numpy as np
import pandas as pd

def pairs_backtest(price_x, price_y, entry_z=2.0, exit_z=0.5, stop_z=3.5,
                   lookback=60, cost_bps=5):
    """
    Rolling OLS hedge ratio + z-score pairs strategy.
    Signal: z = spread / rolling_std
    Entry when |z| > entry_z, exit when |z| < exit_z, stop when |z| > stop_z.
    """
    n = len(price_x)
    px, py = np.array(price_x), np.array(price_y)

    hedge  = np.zeros(n)
    spread = np.zeros(n)
    z_score= np.zeros(n)

    for t in range(lookback, n):
        X = px[t-lookback:t]
        Y = py[t-lookback:t]
        # OLS: Y = hedge * X + alpha
        b = np.cov(X, Y)[0, 1] / np.var(X)
        a = Y.mean() - b * X.mean()
        hedge[t] = b
        spread[t] = py[t] - b * px[t] - a
        spread_hist = py[t-lookback:t] - b * px[t-lookback:t] - a
        z_score[t] = (spread[t] - spread_hist.mean()) / (spread_hist.std() + 1e-8)

    # Signal generation
    position = 0   # +1: long spread (long y, short x), -1: short spread
    trades, pnl = [], []
    cost = cost_bps / 10000

    for t in range(lookback + 1, n):
        z = z_score[t]
        if position == 0:
            if z >  entry_z: position = -1  # spread too high: short y, long x
            if z < -entry_z: position = +1  # spread too low:  long y, short x
        elif position != 0:
            # Exit
            if (position == -1 and z <  exit_z) or \
               (position == +1 and z > -exit_z):
                trades.append({'t': t, 'type': 'exit', 'pnl': position * (spread[t-1] - spread[t])})
                position = 0
            # Stop
            elif abs(z) > stop_z:
                trades.append({'t': t, 'type': 'stop', 'pnl': position * (spread[t-1] - spread[t])})
                position = 0
            else:
                pnl.append(position * (spread[t] - spread[t-1]))

    pnl = np.array(pnl)
    n_trades = len(trades)
    gross_pnl = pnl.sum()
    sharpe = pnl.mean() / (pnl.std() + 1e-8) * np.sqrt(252)
    print(f"Trades: {n_trades}  Gross PnL: {gross_pnl:.4f}")
    print(f"Daily Sharpe (annualised): {sharpe:.2f}")
    return z_score, pnl

# Simulate cointegrated pair with regime change
rng = np.random.default_rng(31)
n = 1000
px = np.cumsum(rng.normal(0, 1, n)) + 100
# Cointegrating relationship breaks around t=600
beta_true = np.where(np.arange(n) < 600, 2.0, 2.5)
spread_true = rng.normal(0, 0.5, n)
py = beta_true * px + 10 + spread_true
z, p = pairs_backtest(px, py)`,
    explanation: "The rolling OLS hedge ratio adapts to slowly changing cointegration relationships but introduces estimation error when the lookback is too short. The stop-loss at |z| > 3.5 is critical: without it, a permanent regime change (as modelled after t=600 where beta shifts from 2.0 to 2.5) would cause unbounded losses. The Sharpe ratio computed on daily P&L captures both mean reversion returns and the cost of false signals.",
  },
  {
    id: "pyfin-20260618-b1-student-t-copula",
    language: "python",
    title: "Student-t Copula for Tail-Dependent Portfolio Losses",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import t as t_dist, norm
from scipy.special import gammaln

def student_t_copula(n=125, rho=0.3, nu=5, pd=0.01, lgd=1.0,
                      n_sim=200_000, seed=42):
    """
    Student-t copula (one-factor): captures tail dependence (joint crashes).
    Latent: X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i, then normalised by chi2.
    M, Z_i ~ N(0,1); W ~ chi2(nu)/nu, so T_i = X_i / sqrt(W) ~ t(nu).
    Default: T_i < t_{nu}^{-1}(PD).
    """
    rng = np.random.default_rng(seed)
    threshold_t = t_dist.ppf(pd, df=nu)

    # Simulate t-distributed latent variables via normal mixture
    M = rng.standard_normal(n_sim)
    Z = rng.standard_normal((n_sim, n))
    X = np.sqrt(rho) * M[:, None] + np.sqrt(1 - rho) * Z

    # Chi-squared mixing: W ~ chi2(nu) / nu
    W = rng.chisquare(nu, n_sim) / nu
    T = X / np.sqrt(W[:, None])   # t-distributed latent

    defaults = (T < threshold_t).sum(axis=1)
    losses = defaults * lgd / n

    # Tail dependence coefficient (upper): lambda_U = 2 * t_{nu+1}(-sqrt((nu+1)*(1-rho)/(1+rho)))
    lambda_tail = 2 * t_dist.sf(np.sqrt((nu + 1) * (1 - rho) / (1 + rho)), df=nu + 1)

    el   = losses.mean()
    var99 = np.percentile(losses, 99)
    es99  = losses[losses >= var99].mean()

    # Compare with Gaussian copula (no tail dependence)
    threshold_n = norm.ppf(pd)
    X_gauss = np.sqrt(rho)*M[:, None] + np.sqrt(1-rho)*Z
    def_g = (X_gauss < threshold_n).sum(axis=1)
    loss_g = def_g * lgd / n
    var99_g = np.percentile(loss_g, 99)

    print(f"t-copula (nu={nu}):  EL={el:.4f}  99%VaR={var99:.4f}  99%ES={es99:.4f}")
    print(f"Gaussian copula:     99%VaR={var99_g:.4f}")
    print(f"Tail dependence lambda_U: {lambda_tail:.4f}")
    print(f"VaR uplift (t vs Gauss): {(var99-var99_g)/var99_g*100:.1f}%")
    return losses

_ = student_t_copula(nu=5)
_ = student_t_copula(nu=20)  # approaches Gaussian as nu -> inf`,
    explanation: "The Student-t copula introduces tail dependence — the probability that many names default simultaneously given that any name defaults is non-zero, unlike the Gaussian copula where this probability is zero. The tail dependence coefficient lambda_U quantifies this: for nu=5, rho=0.3, lambda ≈ 0.15 means there is a 15% chance a name is in the joint tail given another is. This explains why the Gaussian copula's CDO tranche pricing famously failed in 2008 — it systematically underpriced senior tranche risk.",
  },
];
