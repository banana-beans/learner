import { Snippet } from "./types";

export const pythonFinanceSnippets20260714B1: Snippet[] = [
  {
    id: "pyfin-20260714-b1-risk-parity",
    language: "python",
    title: "Risk Parity Portfolio via Iterative Reweighting",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_parity_weights(cov: np.ndarray, tol: float = 1e-10) -> np.ndarray:
    """
    Find weights w such that each asset contributes equally to portfolio risk.
    Risk contribution of asset i: RC_i = w_i * (Sigma @ w)_i / sigma_p
    Risk parity: RC_1 = RC_2 = ... = RC_n = sigma_p / n
    """
    n = cov.shape[0]

    def risk_contributions(w):
        sigma_p = np.sqrt(w @ cov @ w)
        mrc = cov @ w          # marginal risk contributions
        return w * mrc / sigma_p

    def objective(w):
        rc = risk_contributions(w)
        # Minimise sum of squared deviations from equal risk budget
        avg = rc.mean()
        return np.sum((rc - avg) ** 2)

    def jac(w):
        # Numerical gradient (closed-form possible but complex)
        eps = 1e-6
        g = np.zeros(n)
        f0 = objective(w)
        for i in range(n):
            dw = np.zeros(n); dw[i] = eps
            g[i] = (objective(w + dw) - f0) / eps
        return g

    w0 = np.ones(n) / n
    constraints = [{'type': 'eq', 'fun': lambda w: w.sum() - 1}]
    bounds = [(0.001, 1.0)] * n

    result = minimize(objective, w0, jac=jac, method='SLSQP',
                      bounds=bounds, constraints=constraints,
                      options={'ftol': tol, 'maxiter': 1000})
    return result.x / result.x.sum()

# Example with 4 assets
cov = np.array([
    [0.04, 0.01, 0.005, 0.002],
    [0.01, 0.09, 0.02,  0.01 ],
    [0.005,0.02, 0.01,  0.003],
    [0.002,0.01, 0.003, 0.0025],
])
w = risk_parity_weights(cov)
sigma_p = np.sqrt(w @ cov @ w)
rc = w * (cov @ w) / sigma_p
print("Weights:", np.round(w, 4))
print("Risk contributions:", np.round(rc / rc.sum(), 4))  # should be ~0.25 each`,
    explanation:
      "Risk parity equalises each asset's contribution to total portfolio volatility rather than equalising dollar weights. This tilts away from equities (which dominate mean-variance portfolios) toward bonds and low-vol assets, producing portfolios that historically maintain Sharpe ratio while cutting equity drawdowns by 30–40%.",
  },
  {
    id: "pyfin-20260714-b1-variance-swap",
    language: "python",
    title: "Variance Swap Fair Strike from Option Chain (Log-Contract Replication)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from scipy.integrate import quad

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

def variance_swap_strike(S0, r, T, strikes, implied_vols):
    """
    Carr-Madan (1998) replication: K_var = (2/T) * integral of option prices / K^2.
    Integral split at forward F = S0*exp(r*T):
      - puts for K < F, calls for K > F.
    strikes and implied_vols are parallel arrays sorted ascending.
    """
    F = S0 * np.exp(r * T)
    disc = np.exp(-r * T)

    # Build a dense interpolated vol surface
    from scipy.interpolate import interp1d
    vol_interp = interp1d(strikes, implied_vols, kind='linear',
                          bounds_error=False, fill_value=(implied_vols[0], implied_vols[-1]))

    def integrand_put(K):
        sigma = float(vol_interp(K))
        return bs_put(S0, K, r, sigma, T) / (K**2)

    def integrand_call(K):
        sigma = float(vol_interp(K))
        return bs_call(S0, K, r, sigma, T) / (K**2)

    k_min, k_max = strikes[0], strikes[-1]
    put_integral,  _ = quad(integrand_put,  k_min, F)
    call_integral, _ = quad(integrand_call, F,     k_max)

    K_var = (2.0 / T) * (1.0/disc) * (put_integral + call_integral)
    return np.sqrt(K_var) * 100  # return as vol points

# Example: flat vol surface at 20%
strikes = np.linspace(80, 120, 41)
vols    = np.full_like(strikes, 0.20)
kvol = variance_swap_strike(S0=100, r=0.05, T=1.0, strikes=strikes, implied_vols=vols)
print(f"Var swap fair strike: {kvol:.4f}%")  # ~20% (flat smile)`,
    explanation:
      "The Carr-Madan replication theorem prices a variance swap as a model-free integral of weighted out-of-the-money options — no model assumptions beyond no-arbitrage. The 1/K² weighting over-weights OTM puts relative to calls, capturing the asymmetric skew contribution to realised variance. VIX is computed using exactly this formula.",
  },
  {
    id: "pyfin-20260714-b1-kou-jump-diffusion",
    language: "python",
    title: "Kou Double-Exponential Jump-Diffusion Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np

def kou_mc(S0, K, r, sigma, T, lam, p, eta1, eta2, n_paths=200_000, n_steps=252):
    """
    Kou (2002) double-exponential jump-diffusion:
      dS/S = (r - lam*kappa)*dt + sigma*dW + J*dN
    J ~ exp(eta1) with prob p (upward), exp(-eta2) with prob 1-p (downward).
    kappa = E[J-1] = p*eta1/(eta1-1) + (1-p)*eta2/(eta2+1) - 1
    """
    dt = T / n_steps
    kappa = p * eta1 / (eta1 - 1) + (1 - p) * eta2 / (eta2 + 1) - 1
    drift = (r - 0.5 * sigma**2 - lam * kappa) * dt
    vol   = sigma * np.sqrt(dt)

    rng   = np.random.default_rng(42)
    S     = np.full(n_paths, S0)

    for _ in range(n_steps):
        Z     = rng.standard_normal(n_paths)
        n_jumps = rng.poisson(lam * dt, n_paths)   # Poisson arrivals

        log_jump = np.zeros(n_paths)
        for i in range(n_paths):
            for _ in range(n_jumps[i]):
                if rng.random() < p:
                    log_jump[i] += rng.exponential(1.0 / eta1)   # upward
                else:
                    log_jump[i] -= rng.exponential(1.0 / eta2)   # downward

        S *= np.exp(drift + vol * Z + log_jump)

    payoff = np.maximum(S - K, 0.0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = payoff.std() / np.sqrt(n_paths)
    return price, se

price, se = kou_mc(S0=100, K=100, r=0.05, sigma=0.15,
                   T=1.0, lam=5.0, p=0.4, eta1=10.0, eta2=5.0)
print(f"Kou call price: {price:.4f} +/- {1.96*se:.4f}")`,
    explanation:
      "Kou's double-exponential jump model produces leptokurtic return distributions and an asymmetric smile that fits equity option markets better than Merton's Gaussian jump model. The double-exponential distribution for jump sizes has a convenient closed-form characteristic function, enabling both MC and semi-analytic Laplace-inversion pricing.",
  },
  {
    id: "pyfin-20260714-b1-cds-bootstrap",
    language: "python",
    title: "CDS Hazard Rate Bootstrap from Par Spreads",
    tag: "credit",
    code: `import numpy as np
from scipy.interpolate import interp1d

def bootstrap_hazard_rates(maturities, par_spreads, r=0.05, recovery=0.40):
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    For each tenor T_i: spread_i * annuity(T_i) = (1-R) * risky_pv01(T_i)
    Solve for h_i such that the equation holds, given h_1,...,h_{i-1}.
    """
    dt      = 0.25           # quarterly premium payments
    disc    = lambda t: np.exp(-r * t)  # risk-free discount
    hazards = []             # piecewise-constant hazard rate per bucket

    def survival(t, hs, ts):
        """Survival probability at t given piecewise-constant hazard rates."""
        prob = 1.0
        prev = 0.0
        for h, bucket_t in zip(hs, ts):
            if t <= prev:
                break
            end = min(t, bucket_t)
            prob *= np.exp(-h * (end - prev))
            prev = end
            if prev >= t:
                break
        return prob

    for idx, (T, s) in enumerate(zip(maturities, par_spreads)):
        hs_prev = hazards        # hazard rates for earlier buckets
        ts_prev = maturities[:idx]

        from scipy.optimize import brentq
        def equation(h_new):
            hs = hs_prev + [h_new]
            ts = ts_prev + [T]
            times = np.arange(dt, T + 1e-9, dt)
            annuity = sum(dt * disc(t) * survival(t, hs, ts) for t in times)
            # Default leg: sum of (1-R)*P(tau in [t-dt, t])*disc(t)
            def_leg = sum(
                (1 - recovery) * (survival(t - dt, hs, ts) - survival(t, hs, ts)) * disc(t)
                for t in times
            )
            return s * annuity - def_leg

        h = brentq(equation, 1e-6, 10.0, xtol=1e-8)
        hazards.append(h)
        print(f"T={T}Y: h={h:.4f} ({h*1e4:.1f} bps/yr)")

    return hazards

maturities  = [1, 2, 3, 5, 7, 10]
par_spreads = [0.0050, 0.0075, 0.0100, 0.0130, 0.0150, 0.0175]  # in decimal
hs = bootstrap_hazard_rates(maturities, par_spreads)`,
    explanation:
      "Bootstrapping piecewise-constant hazard rates from par CDS spreads is the credit equivalent of stripping a yield curve. Each tenor's hazard rate h_i is solved numerically by pricing the corresponding CDS at par, given the already-calibrated rates for shorter maturities. The hazard curve can then price bespoke tenors or CDO tranches.",
  },
  {
    id: "pyfin-20260714-b1-kalman-beta",
    language: "python",
    title: "Time-Varying Beta via Kalman Filter (Dynamic Hedge Ratio)",
    tag: "risk",
    code: `import numpy as np

def kalman_beta(y: np.ndarray, x: np.ndarray,
                Q: float = 0.001, R: float = 0.01):
    """
    State-space model: y_t = beta_t * x_t + epsilon_t
    State: beta_t = beta_{t-1} + eta_t
    Q: process noise variance (beta drift speed)
    R: observation noise variance
    Returns filtered beta series and filtered estimates.
    """
    T = len(y)
    beta_filter = np.zeros(T)
    P_filter    = np.zeros(T)   # state variance

    # Initialise
    beta_filter[0] = np.cov(y[:10], x[:10])[0,1] / np.var(x[:10])
    P_filter[0]    = 1.0

    for t in range(1, T):
        # Predict
        beta_pred = beta_filter[t-1]
        P_pred    = P_filter[t-1] + Q

        # Update (Kalman gain)
        innovation = y[t] - beta_pred * x[t]
        S          = x[t]**2 * P_pred + R    # innovation variance
        K          = P_pred * x[t] / S       # Kalman gain

        beta_filter[t] = beta_pred + K * innovation
        P_filter[t]    = (1 - K * x[t]) * P_pred

    return beta_filter, P_filter

# Simulate: true beta shifts from 1.0 to 1.5 mid-sample
rng = np.random.default_rng(42)
T   = 500
x   = rng.standard_normal(T)
beta_true = np.concatenate([np.ones(250), 1.5 * np.ones(250)])
y   = beta_true * x + rng.normal(0, 0.1, T)

betas, _ = kalman_beta(y, x, Q=0.005, R=0.01)
print("Avg beta first half:", betas[:250].mean().round(3))   # ~1.0
print("Avg beta second half:", betas[250:].mean().round(3))  # ~1.5`,
    explanation:
      "The Kalman filter treats beta as a time-varying state, balancing two signals: the model's prediction (beta drifts slowly, controlled by Q) and the current observation. A high Q/R ratio tracks regime shifts quickly at the cost of noise; a low ratio produces smoother estimates. This dynamic hedge ratio is critical for statistical arbitrage pairs where correlation regimes shift.",
  },
  {
    id: "pyfin-20260714-b1-implementation-shortfall",
    language: "python",
    title: "Implementation Shortfall Decomposition",
    tag: "execution",
    code: `import numpy as np

def implementation_shortfall(decision_px, arrival_px, fills, fill_qty, final_px):
    """
    Decomposes IS = Slippage + Market Impact + Timing Cost + Opportunity Cost.
    decision_px : price when investment decision made (e.g., previous close)
    arrival_px  : price when order submitted to market
    fills       : list of (fill_price, fill_qty) tuples
    final_px    : price at end of measurement horizon
    """
    total_qty    = sum(q for _, q in fills)
    vwap_fill    = sum(p * q for p, q in fills) / total_qty if total_qty else 0.0

    # IS components (all relative to decision price)
    delay        = arrival_px - decision_px                  # pre-trade price drift
    market_impact= vwap_fill  - arrival_px                   # within-trade cost
    timing_cost  = decision_px - final_px                    # missed return (opportunity)
    # Opportunity cost: unexecuted portion misses the final price
    # (assume order for 1 unit; filled fraction = total_qty / 1)
    # Simplified: full IS = vwap_fill - decision_px for executed portion
    is_bps = (vwap_fill - decision_px) / decision_px * 10_000

    return {
        "vwap_fill":       round(vwap_fill, 4),
        "delay_bps":       round(delay / decision_px * 1e4, 2),
        "market_imp_bps":  round(market_impact / decision_px * 1e4, 2),
        "total_IS_bps":    round(is_bps, 2),
    }

# Simulated execution
fills = [(100.20, 200), (100.35, 300), (100.50, 100)]
result = implementation_shortfall(
    decision_px=100.00,
    arrival_px =100.15,
    fills      =fills,
    fill_qty   =600,
    final_px   =100.60,
)
print(result)`,
    explanation:
      "Implementation shortfall (Perold 1988) measures the total cost of trading by comparing the actual portfolio return to a paper portfolio that trades at the decision price. Decomposing IS into delay, market impact, and timing costs reveals whether losses stem from pre-trade price drift (delay), trading aggressiveness (impact), or slow execution (timing).",
  },
  {
    id: "pyfin-20260714-b1-filtered-hist-sim",
    language: "python",
    title: "Filtered Historical Simulation (FHS) VaR with GARCH Rescaling",
    tag: "risk",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_fit(returns):
    """MLE for GARCH(1,1): sigma_t^2 = omega + alpha*r_{t-1}^2 + beta*sigma_{t-1}^2"""
    T = len(returns)
    def neg_loglik(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        sigma2 = np.zeros(T)
        sigma2[0] = np.var(returns)
        for t in range(1, T):
            sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
        return 0.5 * np.sum(np.log(sigma2) + returns**2 / sigma2)

    res = minimize(neg_loglik, [1e-5, 0.05, 0.90], method='L-BFGS-B',
                   bounds=[(1e-8, None), (0, 1), (0, 1)])
    return res.x

def fhs_var(returns, horizon=1, confidence=0.99):
    """
    Filtered Historical Simulation:
    1. Fit GARCH, extract standardised residuals z_t = r_t / sigma_t
    2. Bootstrap z from the empirical distribution (captures fat tails/skew)
    3. Re-scale by the current conditional vol forecast for tomorrow
    """
    params = garch11_fit(returns)
    omega, alpha, beta = params
    T = len(returns)

    # Extract conditional vols
    sigma2 = np.zeros(T)
    sigma2[0] = np.var(returns)
    for t in range(1, T):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    z = returns / np.sqrt(sigma2)   # standardised residuals

    # Current vol forecast (for tomorrow)
    sigma2_fc = omega + alpha * returns[-1]**2 + beta * sigma2[-1]
    sigma_fc  = np.sqrt(sigma2_fc)

    # Bootstrap: draw N standardised residuals, rescale by forecast vol
    rng = np.random.default_rng(42)
    N   = 50_000
    z_boot = rng.choice(z, size=N, replace=True)
    sim_returns = sigma_fc * z_boot   # re-scale to current vol regime

    var = -np.percentile(sim_returns, (1 - confidence) * 100)
    es  = -sim_returns[sim_returns < -var].mean()
    return var, es

rng = np.random.default_rng(0)
r   = rng.standard_normal(1000) * 0.01
var, es = fhs_var(r)
print(f"1-day 99% FHS VaR: {var:.4f}  ES: {es:.4f}")`,
    explanation:
      "FHS combines GARCH conditional volatility (which adapts to volatility clustering) with bootstrap resampling of historical standardised residuals (which preserves fat tails and skewness). Unlike normal-distribution VaR, FHS captures the empirical tail shape; unlike pure historical simulation, it scales past shocks to today's volatility regime.",
  },
  {
    id: "pyfin-20260714-b1-lsm-american",
    language: "python",
    title: "Longstaff-Schwartz (LSM) American Option Pricer",
    tag: "derivatives",
    code: `import numpy as np

def lsm_american_put(S0, K, r, sigma, T, n_paths=50_000, n_steps=50):
    """
    Longstaff-Schwartz (2001) least-squares Monte Carlo for American puts.
    At each step, regress continuation value on polynomial basis of S
    to decide optimal early exercise.
    """
    dt   = T / n_steps
    disc = np.exp(-r * dt)
    rng  = np.random.default_rng(42)

    # Simulate stock paths (antithetic variates)
    Z = rng.standard_normal((n_steps, n_paths // 2))
    Z = np.concatenate([Z, -Z], axis=1)
    log_S = np.log(S0) + np.cumsum(
        (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z, axis=0)
    S = np.exp(log_S)

    # Terminal payoff
    cash_flow = np.maximum(K - S[-1], 0.0)

    # Backward induction
    for t in range(n_steps - 2, -1, -1):
        S_t   = S[t]
        itm   = K - S_t > 0               # in-the-money paths
        if not itm.any():
            cash_flow *= disc
            continue

        # Regression of discounted future cash flows on basis functions
        Y    = cash_flow[itm] * disc       # discounted continuation value
        X    = S_t[itm]
        # Basis: [1, S, S^2] (Laguerre polynomials in original paper)
        A    = np.column_stack([np.ones_like(X), X, X**2])
        coef, _, _, _ = np.linalg.lstsq(A, Y, rcond=None)
        cont = A @ coef                    # estimated continuation value

        exercise = K - X                   # immediate exercise value
        early_ex  = exercise > cont        # exercise if IV > CV

        indices  = np.where(itm)[0]
        ex_paths = indices[early_ex]
        cash_flow[ex_paths] = K - S_t[ex_paths]  # overwrite with exercise

        cash_flow *= disc

    return cash_flow.mean()

price = lsm_american_put(S0=100, K=100, r=0.05, sigma=0.2, T=1.0)
print(f"LSM American put: {price:.4f}")  # ~5.57`,
    explanation:
      "LSM avoids the curse of dimensionality of PDE grids by representing the continuation value as a regression on a polynomial basis of the current state. The key insight is that only in-the-money paths need regression at each step. LSM extends naturally to multi-factor models (e.g., stochastic vol or rates) simply by adding basis functions for each state variable.",
  },
  {
    id: "pyfin-20260714-b1-min-variance-hedge",
    language: "python",
    title: "Minimum-Variance Hedge Ratio via OLS (Cross-Asset Hedging)",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import t as tdist

def mv_hedge_ratio(asset_returns: np.ndarray,
                   hedge_returns:  np.ndarray):
    """
    Optimal hedge ratio h* = Cov(r_A, r_H) / Var(r_H) = slope of OLS
    Regress asset returns on hedge instrument returns:
      r_A = alpha + h * r_H + epsilon
    h* minimises variance of hedged portfolio P = r_A - h * r_H.
    """
    T  = len(asset_returns)
    X  = np.column_stack([np.ones(T), hedge_returns])
    # OLS
    XtX_inv = np.linalg.inv(X.T @ X)
    b       = XtX_inv @ X.T @ asset_returns
    alpha, h_star = b[0], b[1]

    resid    = asset_returns - X @ b
    sigma2   = resid.var(ddof=2)
    se_b     = np.sqrt(sigma2 * np.diag(XtX_inv))

    t_stat  = h_star / se_b[1]
    p_value = 2 * tdist.sf(abs(t_stat), df=T-2)

    # Effectiveness: R^2
    ss_tot = np.var(asset_returns) * T
    ss_res = (resid**2).sum()
    r2     = 1 - ss_res / ss_tot

    hedged_var   = np.var(asset_returns - h_star * hedge_returns)
    unhedged_var = np.var(asset_returns)
    var_reduction = 1 - hedged_var / unhedged_var

    return {
        "alpha":         round(alpha, 6),
        "h_star":        round(h_star, 4),
        "se_h":          round(se_b[1], 4),
        "t_stat":        round(t_stat, 3),
        "p_value":       round(p_value, 4),
        "R2":            round(r2, 4),
        "var_reduction": round(var_reduction, 4),
    }

rng     = np.random.default_rng(42)
T       = 252
r_hedge = rng.normal(0, 0.01, T)
r_asset = 0.8 * r_hedge + rng.normal(0, 0.005, T)   # 80% correlation
print(mv_hedge_ratio(r_asset, r_hedge))`,
    explanation:
      "The minimum-variance hedge ratio equals the OLS slope of the asset on the hedge instrument. The R² measures hedge effectiveness: 1 means perfect hedge; low values indicate basis risk. Standard error and t-statistic test whether h* is statistically different from zero — critical for deciding if hedging is worthwhile given transaction costs.",
  },
  {
    id: "pyfin-20260714-b1-cms-convexity",
    language: "python",
    title: "CMS Convexity Adjustment via Linear TSR Model",
    tag: "rates",
    code: `import numpy as np
from scipy.stats import norm

def black_swaption(F, K, sigma, T, tau, annuity, is_payer=True):
    """Black's formula for a European swaption."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if is_payer:
        return annuity * (F * norm.cdf(d1) - K * norm.cdf(d2))
    return annuity * (K * norm.cdf(-d2) - F * norm.cdf(-d1))

def cms_convexity_adjustment(F, sigma, T, tau, annuity, num_vol_bumps=50):
    """
    CMS rate = swap rate + convexity adjustment.
    Linear TSR (Terminal Swap Rate) approximation:
      CA = Var(swap_rate under Q^A) * d/dF [1/annuity(F)] * F
    Numerically: replicate CMS coupon as strip of swaptions across K.
    """
    # Build a discrete approximation: CMS coupon PV via Breeden-Litzenberger
    # d_payer/dK = -Q^annuity(swap_rate > K) * annuity (digital swaption)
    # CMS coupon = E_A[S_T] = F + integral_F^inf (1 - CDF(K)) dK  (call spread)
    # Numerically integrate using a grid of K values

    dK     = F * 0.005
    K_grid = np.arange(F * 0.5, F * 2.0 + dK, dK)
    cms_pv = 0.0

    for i in range(len(K_grid) - 1):
        K0, K1 = K_grid[i], K_grid[i+1]
        # digital payer ~ (payer(K0) - payer(K0+eps)) / eps
        p0 = black_swaption(F, K0,  sigma, T, tau, annuity)
        p1 = black_swaption(F, K1,  sigma, T, tau, annuity)
        digital = (p1 - p0) / (K1 - K0)   # negative for call spread dV/dK
        cms_pv += -digital * (K0 + K1) / 2 * dK

    cms_rate  = cms_pv / annuity
    adj       = cms_rate - F
    return cms_rate, adj

F       = 0.05   # forward swap rate
sigma   = 0.20   # swaption normal-ish vol (lognormal approx)
T       = 5.0    # option expiry (CMS reset)
tau     = 0.25   # payment frequency
annuity = sum(np.exp(-F * (T + tau * k)) * tau for k in range(1, 21))  # 5Y swap
cms, ca = cms_convexity_adjustment(F, sigma, T, tau, annuity)
print(f"Forward swap rate: {F*1e4:.0f} bps")
print(f"CMS convexity adj: {ca*1e4:.2f} bps")
print(f"CMS rate:          {cms*1e4:.2f} bps")`,
    explanation:
      "CMS (Constant Maturity Swap) coupons pay a swap rate observed in the future, not a Libor rate. The convexity adjustment arises because the CMS coupon is paid in the wrong measure: the expected swap rate under the annuity measure differs from the forward swap rate. The adjustment is positive and grows with volatility and maturity, and is priced by replicating with a strip of swaptions.",
  },
  {
    id: "pyfin-20260714-b1-risk-neutral-density",
    language: "python",
    title: "Risk-Neutral Density Extraction via Breeden-Litzenberger",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from scipy.interpolate import UnivariateSpline
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def risk_neutral_density(S0, r, T, strikes, implied_vols):
    """
    Breeden-Litzenberger (1978): q(K) = exp(rT) * d^2C/dK^2
    The RND is the second derivative of the call price curve w.r.t. K.
    """
    # Compute call prices
    calls = np.array([bs_call(S0, K, r, v, T) for K, v in zip(strikes, implied_vols)])

    # Fit smooth spline to call prices
    spline = UnivariateSpline(strikes, calls, k=4, s=0)
    d2C    = spline.derivative(n=2)

    K_dense = np.linspace(strikes[0] * 1.05, strikes[-1] * 0.95, 200)
    density  = np.exp(r * T) * d2C(K_dense)
    density  = np.maximum(density, 0.0)   # enforce non-negativity

    # Normalise (should already sum to ~1 if extrapolation is not too aggressive)
    dK = K_dense[1] - K_dense[0]
    density /= density.sum() * dK

    return K_dense, density

# Example: smile with slight negative skew
strikes = np.linspace(80, 120, 20)
skew    = -0.002 * (strikes - 100)      # add negative skew
vols    = 0.20 + skew
K_dense, rnd = risk_neutral_density(S0=100, r=0.05, T=0.25,
                                     strikes=strikes, implied_vols=vols)
print(f"Mode of RND: {K_dense[rnd.argmax()]:.1f}")
print(f"Integral check: {rnd.sum()*(K_dense[1]-K_dense[0]):.4f}")  # ~1`,
    explanation:
      "Breeden-Litzenberger (1978) shows the market-implied probability density of the terminal asset price equals the second derivative of call prices with respect to strike. Fitting a smooth spline to observed call prices (or a parametric vol surface) before differentiating avoids noise amplification. The resulting RND captures the market's skewness and kurtosis beliefs — not imposed by any model.",
  },
  {
    id: "pyfin-20260714-b1-bgm-caplet",
    language: "python",
    title: "LIBOR Market Model (BGM) Caplet Pricing via MC",
    tag: "rates",
    code: `import numpy as np

def bgm_caplets(F0: np.ndarray, sigmas: np.ndarray, rho: np.ndarray,
                tau: float, T_pay: np.ndarray, notional: float = 1e6,
                n_paths: int = 50_000):
    """
    Brace-Gatarek-Musiela (1997) LMM: simulate forward Libor rates under
    the terminal measure and price caplets.
    F0     : initial forward Libor rates for each period (shape [n])
    sigmas : per-period vol (flat term structure assumed here)
    rho    : correlation matrix (n x n)
    tau    : accrual period (0.25 for quarterly)
    T_pay  : payment dates array
    """
    n     = len(F0)
    dt    = tau
    rng   = np.random.default_rng(42)
    L     = np.linalg.cholesky(rho)           # Cholesky for correlated Brownians

    # Simulate forward rates to their reset date T_i
    prices = np.zeros(n)
    for i in range(n):
        T_i   = T_pay[i]
        steps = max(1, int(T_i / dt))
        dt_   = T_i / steps
        F     = np.full(n_paths, F0[i])

        for _ in range(steps):
            Z    = L @ rng.standard_normal((n, n_paths))
            dW_i = Z[i]
            # Drift under T_{n}-measure: mu_i = -sum_{j>i} tau*rho_ij*sigma_i*sigma_j*F_j / (1 + tau*F_j)
            drift = 0.0
            for j in range(i + 1, n):
                drift -= tau * rho[i, j] * sigmas[i] * sigmas[j] * F0[j] / (1 + tau * F0[j])
            F *= np.exp((drift - 0.5*sigmas[i]**2)*dt_ + sigmas[i]*np.sqrt(dt_)*dW_i)

        # Caplet payoff: max(F_i - K, 0) * tau * notional, discounted
        K        = F0[i]   # at-the-money caplet
        disc     = np.prod([1.0 / (1.0 + tau * F0[j]) for j in range(i + 1)])
        payoff   = np.maximum(F - K, 0.0) * tau * notional
        prices[i]= disc * payoff.mean()

    return prices

n      = 4
F0     = np.full(n, 0.05)
sigmas = np.full(n, 0.20)
rho    = 0.8 * np.ones((n, n)) + 0.2 * np.eye(n)  # high correlation
T_pay  = np.arange(1, n+1, dtype=float)

caplet_prices = bgm_caplets(F0, sigmas, rho, tau=0.25, T_pay=T_pay)
print("Caplet prices:", caplet_prices.round(2))`,
    explanation:
      "The BGM model is the industry standard for interest-rate derivatives because it models directly-observable forward Libor rates rather than abstract short rates. Under the terminal (or spot) measure, each forward rate has a drift that couples it to all longer-dated rates — this drift correction ensures no-arbitrage across the yield curve, which is the key difference from a collection of independent Black models.",
  },
  {
    id: "pyfin-20260714-b1-residual-momentum",
    language: "python",
    title: "Residual Momentum Factor (Industry-Adjusted Returns)",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd

def residual_momentum(returns: pd.DataFrame,
                      industry: pd.Series,
                      lookback: int = 252,
                      skip: int = 21) -> pd.Series:
    """
    Blitz et al. (2011) residual momentum:
    1. For each stock, regress returns on industry returns to get residuals.
    2. Use 12-1 month cumulative residuals as the signal.
    This is more robust than raw momentum because it strips out industry effects
    and avoids the winners/losers driven purely by industry rotation.
    """
    stocks    = returns.columns.tolist()
    industries = industry.unique()

    # Step 1: Compute industry average returns
    ind_rets = pd.DataFrame(index=returns.index, columns=industries)
    for ind in industries:
        members = [s for s in stocks if industry.get(s) == ind]
        if members:
            ind_rets[ind] = returns[members].mean(axis=1)

    # Step 2: Regress each stock on its industry, extract residuals
    resid = pd.DataFrame(index=returns.index, columns=stocks, dtype=float)
    for s in stocks:
        ind    = industry[s]
        X      = ind_rets[ind].fillna(0).values
        y      = returns[s].fillna(0).values
        # Simple OLS: beta = cov(y,X)/var(X)
        valid  = np.isfinite(X) & np.isfinite(y)
        beta   = np.cov(y[valid], X[valid])[0, 1] / np.var(X[valid])
        resid[s] = y - beta * X

    # Step 3: 12-1 month cumulative residual (skip last month to avoid reversal)
    T = len(returns)
    signal = pd.Series(index=stocks, dtype=float)
    for s in stocks:
        r = resid[s].iloc[-(lookback + skip) : -skip]
        signal[s] = (1 + r).prod() - 1

    # Long top quintile, short bottom quintile
    q80, q20 = signal.quantile(0.8), signal.quantile(0.2)
    positions = pd.Series(0.0, index=stocks)
    positions[signal >= q80] = 1.0 / (signal >= q80).sum()
    positions[signal <= q20] = -1.0 / (signal <= q20).sum()
    return positions

# Quick demo
rng = np.random.default_rng(42)
T, N = 300, 20
rets = pd.DataFrame(rng.normal(0, 0.01, (T, N)),
                    columns=[f"S{i}" for i in range(N)])
inds = pd.Series({f"S{i}": f"Ind{i//5}" for i in range(N)})
pos  = residual_momentum(rets, inds, lookback=250, skip=20)
print("Long:", pos[pos > 0].index.tolist())`,
    explanation:
      "Residual momentum removes the common industry component from return histories before computing momentum. Raw momentum portfolios can inadvertently bet on industry rotation; residual momentum bets only on stock-specific persistence. Blitz et al. show it has higher Sharpe than raw momentum with lower crash risk during momentum unwind events.",
  },
  {
    id: "pyfin-20260714-b1-futures-roll",
    language: "python",
    title: "Continuous Futures: Roll-Adjusted Price Series",
    tag: "data",
    code: `import numpy as np
import pandas as pd

def build_continuous_series(front: pd.Series, back: pd.Series,
                             roll_dates: list,
                             method: str = 'panama') -> pd.Series:
    """
    Build a roll-adjusted continuous futures price series.
    method='panama' : backward-adjust on roll (add constant roll gap to history).
    method='ratio'  : backward-multiply by roll ratio (preserves percentage returns).

    front, back: price series for front and back contract (same index).
    roll_dates: list of dates on which we switch from front to back.
    """
    # Combine into one series: front until roll, then back
    combined = front.copy()
    for rd in sorted(roll_dates):
        if rd in back.index:
            combined.loc[rd:] = back.loc[rd:]

    if method == 'panama':
        adj_series = combined.copy()
        for rd in sorted(roll_dates, reverse=True):
            if rd in front.index and rd in back.index:
                gap = front.loc[rd] - back.loc[rd]
                adj_series.loc[:rd] += gap     # shift all history up/down
    elif method == 'ratio':
        adj_series = combined.copy()
        for rd in sorted(roll_dates, reverse=True):
            if rd in front.index and rd in back.index:
                ratio = front.loc[rd] / back.loc[rd]
                adj_series.loc[:rd] *= ratio
    else:
        raise ValueError(f"Unknown method: {method}")

    return adj_series

# Synthetic: front contract ending, back contract starting
idx   = pd.date_range("2024-01-01", periods=60, freq='B')
front = pd.Series(100 + np.cumsum(np.random.randn(60) * 0.5), index=idx)
back  = front + 2.0   # back trades at 2pt premium (contango)
roll  = [idx[30]]

adj_panama = build_continuous_series(front, back, roll, method='panama')
adj_ratio  = build_continuous_series(front, back, roll, method='ratio')
print("Pre-roll adj (panama):", adj_panama.iloc[28:33].round(2).tolist())`,
    explanation:
      "Panama adjusts for roll gaps by adding/subtracting the constant price difference to all history before the roll — ensuring the chart has no discontinuities, but introducing artificial price levels. Ratio adjustment preserves percentage returns so compound returns on the continuous series are correct, but the price level is distorted. Always use ratio-adjusted prices when computing percentage returns or training ML models.",
  },
  {
    id: "pyfin-20260714-b1-bond-option-black",
    language: "python",
    title: "Bond Option Pricing via Black's Model",
    tag: "rates",
    code: `import numpy as np
from scipy.stats import norm

def black_bond_option(F_B: float, K: float, sigma_B: float,
                      T: float, P_T: float, is_call: bool = True) -> float:
    """
    Black's model for a European option on a zero-coupon bond.
    F_B   : forward bond price = B(0,T+tau) / P(0,T)
    K     : strike (e.g., 0.95 for a 5% yield cap equivalent)
    sigma_B: bond price vol (lognormal)
    T     : option expiry
    P_T   : discount factor to T (P(0,T))
    """
    d1 = (np.log(F_B / K) + 0.5 * sigma_B**2 * T) / (sigma_B * np.sqrt(T))
    d2 = d1 - sigma_B * np.sqrt(T)
    if is_call:
        return P_T * (F_B * norm.cdf(d1) - K * norm.cdf(d2))
    return P_T * (K * norm.cdf(-d2) - F_B * norm.cdf(-d1))

def bond_option_via_yield(y_fwd: float, K_yield: float, dur: float,
                          sigma_y: float, T: float, P_T: float,
                          is_cap: bool = True) -> float:
    """
    Price a yield-cap option: payoff = max(y_T - K_y, 0) * DV01.
    Convert yield vol to bond-price vol: sigma_B ≈ dur * sigma_y.
    Cap on yield = put on bond price.
    """
    F_B     = np.exp(-y_fwd * dur)              # approx bond fwd price
    K_B     = np.exp(-K_yield * dur)            # strike in price terms
    sigma_B = dur * sigma_y
    # Yield cap = bond price put
    return black_bond_option(F_B, K_B, sigma_B, T, P_T, is_call=not is_cap)

# Example: 5Y bond, 3M option, yield cap at 5%
P_T   = np.exp(-0.04 * 0.25)  # 3M discount
price = bond_option_via_yield(y_fwd=0.04, K_yield=0.05, dur=5.0,
                               sigma_y=0.01, T=0.25, P_T=P_T)
print(f"Yield cap (bond put): {price*1e4:.2f} bps")`,
    explanation:
      "Black's model for bond options uses lognormal bond-price dynamics rather than yield dynamics, enabling closed-form pricing. The approximation sigma_B ≈ duration × sigma_y converts yield vol to price vol under small-change assumptions. Bond options are important for swaption-to-cap normalization and for pricing embedded optionality in fixed-income securities.",
  },
  {
    id: "pyfin-20260714-b1-turnover-constrained-opt",
    language: "python",
    title: "Turnover-Constrained Portfolio Optimization (cvxpy)",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def turnover_constrained_optimization(mu: np.ndarray,
                                       Sigma: np.ndarray,
                                       w_prev: np.ndarray,
                                       lam: float = 2.0,
                                       max_turnover: float = 0.10,
                                       max_weight: float = 0.10) -> np.ndarray:
    """
    Mean-variance optimization subject to:
    - L1 turnover constraint: sum|w - w_prev| / 2 <= max_turnover
    - Long-only, weight bounds
    Turnover cost can alternatively be modelled as a linear cost in the objective.
    """
    n = len(mu)
    w = cp.Variable(n)

    # Objective: maximize expected return minus risk penalty
    ret  = mu @ w
    risk = cp.quad_form(w, Sigma)
    obj  = cp.Maximize(ret - lam * risk)

    # L1 turnover: sum(|w - w_prev|) / 2 <= max_turnover
    turnover = cp.sum(cp.abs(w - w_prev)) / 2

    constraints = [
        cp.sum(w) == 1,
        w >= 0,
        w <= max_weight,
        turnover <= max_turnover,
    ]

    prob = cp.Problem(obj, constraints)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ["optimal", "optimal_inaccurate"]:
        raise RuntimeError(f"Optimization failed: {prob.status}")

    return w.value

n     = 10
rng   = np.random.default_rng(42)
mu    = rng.normal(0.05, 0.02, n)
A     = rng.standard_normal((n, n))
Sigma = (A @ A.T) / n + 0.01 * np.eye(n)
w_prev= np.ones(n) / n   # equal-weight starting portfolio

w_opt = turnover_constrained_optimization(mu, Sigma, w_prev, max_turnover=0.05)
print("Optimal weights:", np.round(w_opt, 3))
print("Turnover:", round(np.abs(w_opt - w_prev).sum() / 2, 4))`,
    explanation:
      "Adding an L1 turnover constraint (total one-way trading ≤ T) to mean-variance optimization is a convex constraint because the absolute difference is a convex function. This directly limits transaction costs without the ad-hoc shrinkage of expected returns, and is equivalent to adding a proportional cost term in the objective when the bound is binding.",
  },
  {
    id: "pyfin-20260714-b1-regime-switching",
    language: "python",
    title: "Two-State Markov Regime-Switching Returns (Hamilton Filter)",
    tag: "risk",
    code: `import numpy as np
from scipy.optimize import minimize

def hamilton_filter(returns: np.ndarray, params: np.ndarray):
    """
    Hamilton (1989) regime-switching model:
    State s_t in {0=low-vol, 1=high-vol}
    r_t | s_t ~ N(mu_s, sigma_s^2)
    Transition matrix: P[i,j] = prob of going from state i to j.
    Returns log-likelihood and filtered state probabilities.
    """
    mu0, mu1, sig0, sig1, p00, p11 = params
    if sig0 <= 0 or sig1 <= 0 or p00 <= 0 or p00 >= 1 or p11 <= 0 or p11 >= 1:
        return np.inf, None
    sig0, sig1 = abs(sig0), abs(sig1)
    P = np.array([[p00, 1-p00], [1-p11, p11]])

    T    = len(returns)
    xi   = np.array([0.5, 0.5])   # initial state probs
    ll   = 0.0
    xis  = np.zeros((T, 2))

    from scipy.stats import norm
    for t in range(T):
        eta = np.array([norm.pdf(returns[t], mu0, sig0),
                        norm.pdf(returns[t], mu1, sig1)])
        joint   = xi * eta
        f_t     = joint.sum()
        if f_t == 0: return np.inf, None
        ll     += np.log(f_t)
        xi      = (P.T @ (joint / f_t))   # predict next period
        xis[t]  = joint / f_t

    return -ll, xis

def fit_regime_switching(returns):
    def obj(params): return hamilton_filter(returns, params)[0]
    x0  = [0.001, -0.005, 0.01, 0.03, 0.95, 0.85]
    res = minimize(obj, x0, method='Nelder-Mead',
                   options={'maxiter': 5000, 'xatol': 1e-6})
    return res.x

rng  = np.random.default_rng(42)
T    = 500
# Simulate 2 regimes
s    = np.zeros(T, int)
for t in range(1, T):
    s[t] = 1 if (rng.random() > (0.95 if s[t-1]==0 else 0.15)) else 0
r    = np.where(s == 0, rng.normal(0.001, 0.01, T), rng.normal(-0.002, 0.03, T))

params = fit_regime_switching(r)
print("Params: mu0={:.4f} mu1={:.4f} sig0={:.4f} sig1={:.4f} p00={:.3f} p11={:.3f}"
      .format(*params))`,
    explanation:
      "The Hamilton filter is a hidden Markov model for financial returns where the latent state (bull/bear, low-vol/high-vol) follows a Markov chain. The filtered probabilities P(s_t=1|r_1,...,r_t) update recursively via Bayes' rule, enabling real-time regime detection. Risk managers use this to condition VaR estimates on the current regime rather than averaging over both.",
  },
];
