import type { Snippet } from "./types";

export const pythonFinanceSnippets20260615B1: Snippet[] = [
  {
    id: "pyfin-20260615-b1-garch",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) MLE — volatility clustering model calibration",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_mle(returns: np.ndarray) -> dict:
    """
    GARCH(1,1): sigma^2_t = omega + alpha * eps^2_{t-1} + beta * sigma^2_{t-1}
    Stationarity: alpha + beta < 1.
    MLE via maximising the Gaussian log-likelihood of returns.
    Long-run variance = omega / (1 - alpha - beta).
    Half-life of vol shock = ln(0.5) / ln(alpha + beta).
    """
    r = returns - returns.mean()   # demeaned returns
    n = len(r)

    def neg_log_lik(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha <= 0 or beta <= 0 or alpha + beta >= 1:
            return 1e10
        # Initialise sigma^2 at the unconditional variance
        sigma2 = np.full(n, omega / (1 - alpha - beta))
        for t in range(1, n):
            sigma2[t] = omega + alpha * r[t-1]**2 + beta * sigma2[t-1]
        if np.any(sigma2 <= 0):
            return 1e10
        ll = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + r**2 / sigma2)
        return -float(ll)

    # Initial guess: omega from sample variance, alpha=0.1, beta=0.85
    var0   = float(np.var(r))
    x0     = [var0 * 0.05, 0.10, 0.85]
    bounds = [(1e-8, 1.0), (1e-6, 0.5), (1e-6, 0.999)]

    res = minimize(neg_log_lik, x0, method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-12, "maxiter": 5000})
    omega, alpha, beta = res.x

    # Reconstruct conditional variance series
    sigma2 = np.full(n, omega / (1 - alpha - beta))
    for t in range(1, n):
        sigma2[t] = omega + alpha * r[t-1]**2 + beta * sigma2[t-1]

    lr_var    = omega / (1 - alpha - beta)
    half_life = np.log(0.5) / np.log(alpha + beta)

    return {
        "omega":         round(float(omega),  8),
        "alpha":         round(float(alpha),  6),
        "beta":          round(float(beta),   6),
        "persistence":   round(float(alpha + beta), 6),
        "long_run_vol_annual": round(float(np.sqrt(lr_var * 252)), 4),
        "half_life_days":      round(float(half_life), 2),
        "current_vol_annual":  round(float(np.sqrt(sigma2[-1] * 252)), 4),
        "sigma2_series":       sigma2.round(8).tolist(),
        "converged":           bool(res.success),
    }`,
    explanation:
      "GARCH(1,1) captures two stylised facts simultaneously: volatility clustering (today's high vol predicts tomorrow's high vol via the beta term) and fat tails (the conditional distribution is normal, but the unconditional distribution is leptokurtic because the mixing over time-varying variances creates heavy tails). The persistence parameter α + β determines the vol autocorrelation: near 1 (e.g., 0.95) means vol shocks decay slowly, typical for equity indices; lower values (0.7-0.8) appear in short-maturity FX pairs with faster mean reversion.",
  },
  {
    id: "pyfin-20260615-b1-kalman-pairs",
    language: "python",
    tag: "finance",
    title: "Kalman filter pairs trading — dynamic hedge ratio estimation",
    code: `import numpy as np

def kalman_pairs_filter(
    y: np.ndarray,     # series to hedge (e.g., GOOG log price)
    x: np.ndarray,     # hedging instrument (e.g., META log price)
    delta: float = 1e-5,  # state noise variance (controls how fast beta evolves)
    R: float = 1e-3,      # observation noise variance
) -> dict:
    """
    Dynamic linear regression: y_t = beta_t * x_t + alpha_t + eps_t
    State: theta_t = [beta_t, alpha_t]^T evolves as random walk: theta_t = theta_{t-1} + w_t
    Kalman filter estimates theta_t recursively — no look-ahead bias.
    delta controls responsiveness: large delta -> fast but noisy; small -> stable but lagged.
    """
    n = len(y)
    # Process noise covariance: Q = delta / (1-delta) * I — Kolanovic parameterisation
    Vw  = delta / (1.0 - delta) * np.eye(2)

    # State estimate and covariance (uninformative prior)
    theta = np.zeros(2)         # [beta, alpha]
    P     = np.eye(2) * 1.0    # state covariance (large initial uncertainty)

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spreads = np.zeros(n)

    for t in range(n):
        F = np.array([x[t], 1.0])   # observation matrix row

        # Prediction step: state propagates as random walk (A=I)
        P = P + Vw

        # Innovation (measurement residual)
        y_hat = float(F @ theta)
        innov = y[t] - y_hat
        S     = float(F @ P @ F) + R   # innovation variance

        # Kalman gain
        K = P @ F / S                  # (2,) vector

        # Update
        theta = theta + K * innov
        P     = P - np.outer(K, F) @ P

        betas[t]   = theta[0]
        alphas[t]  = theta[1]
        spreads[t] = y[t] - theta[0] * x[t] - theta[1]

    z_score = (spreads - spreads.mean()) / (spreads.std() + 1e-8)

    return {
        "betas":    betas.round(6).tolist(),
        "alphas":   alphas.round(6).tolist(),
        "spreads":  spreads.round(6).tolist(),
        "z_scores": z_score.round(4).tolist(),
        "final_beta":  round(float(betas[-1]),  4),
        "final_alpha": round(float(alphas[-1]), 4),
        "spread_vol":  round(float(spreads.std()), 6),
    }`,
    explanation:
      "The Kalman filter is superior to rolling OLS for pairs trading because it updates the hedge ratio in O(1) per observation without storing a window of data, and it naturally handles non-stationary regimes where the cointegrating relationship drifts over time. The delta parameter controls the signal-to-noise ratio in the state equation: setting delta = 1e-5 means the state can change by about 0.1% of its initial uncertainty per step, which for daily data corresponds to a hedge ratio that adjusts smoothly over months rather than reacting to daily noise.",
  },
  {
    id: "pyfin-20260615-b1-hmm-regime",
    language: "python",
    tag: "finance",
    title: "Hidden Markov Model regime detection — EM algorithm for bull/bear states",
    code: `import numpy as np
from scipy.stats import norm

def hmm_baum_welch(
    obs: np.ndarray,    # daily log returns
    n_states: int = 2,  # bull + bear
    n_iter: int = 100,
    tol: float = 1e-6,
) -> dict:
    """
    Gaussian HMM with Baum-Welch EM:
    - Emission: r_t | state=k ~ N(mu_k, sigma_k^2)
    - Transition: A[i,j] = P(state_t=j | state_{t-1}=i)
    Identifies regimes: high-vol/negative-drift bear vs low-vol/positive-drift bull.
    """
    n = len(obs)
    K = n_states

    # Initialise: sort observations into K clusters by sign
    mu    = np.array([obs[obs < 0].mean() if (obs < 0).any() else -0.001,
                      obs[obs >= 0].mean() if (obs >= 0).any() else 0.001])
    sigma = np.array([obs[obs < 0].std()  if (obs < 0).any() else 0.02,
                      obs[obs >= 0].std() if (obs >= 0).any() else 0.01])
    A     = np.full((K, K), 1.0 / K)       # transition matrix
    pi    = np.full(K, 1.0 / K)            # initial state distribution

    def emission(k, t):
        return max(norm.pdf(obs[t], mu[k], sigma[k]), 1e-300)

    prev_ll = -np.inf
    for _ in range(n_iter):
        # ----- E-step: Forward-Backward -----
        # Forward pass: alpha[t,k] = P(o_1..o_t, state_t=k)
        alpha = np.zeros((n, K))
        for k in range(K): alpha[0, k] = pi[k] * emission(k, 0)
        alpha[0] /= alpha[0].sum() + 1e-300
        scales = [alpha[0].sum() + 1e-300]
        for t in range(1, n):
            for j in range(K):
                alpha[t, j] = emission(j, t) * sum(alpha[t-1, i]*A[i,j] for i in range(K))
            sc = alpha[t].sum() + 1e-300
            alpha[t] /= sc
            scales.append(sc)

        # Backward pass: beta[t,k] = P(o_{t+1}..o_T | state_t=k)
        beta = np.ones((n, K))
        for t in range(n-2, -1, -1):
            for i in range(K):
                beta[t, i] = sum(A[i,j]*emission(j,t+1)*beta[t+1,j] for j in range(K))
            beta[t] /= beta[t].sum() + 1e-300

        # State posteriors (gamma) and joint (xi)
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True) + 1e-300

        ll = sum(np.log(s) for s in scales)
        if abs(ll - prev_ll) < tol: break
        prev_ll = ll

        # ----- M-step: update parameters -----
        A_new = np.zeros((K, K))
        for i in range(K):
            for j in range(K):
                numer = sum(alpha[t,i]*A[i,j]*emission(j,t+1)*beta[t+1,j]
                            for t in range(n-1))
                A_new[i, j] = numer
            A_new[i] /= A_new[i].sum() + 1e-300

        for k in range(K):
            wk     = gamma[:, k]
            mu[k]  = float(np.dot(wk, obs) / (wk.sum() + 1e-300))
            sigma[k] = float(np.sqrt(np.dot(wk, (obs - mu[k])**2) / (wk.sum() + 1e-300) + 1e-8))

        A = A_new
        pi = gamma[0]

    regime = np.argmax(gamma, axis=1)   # most likely state per day

    # Label: state 0 = low-mu/high-vol (bear), state 1 = high-mu/low-vol (bull)
    bear = np.argmin(mu)
    bull = 1 - bear

    return {
        "mu_bear":       round(float(mu[bear]), 6),
        "sigma_bear":    round(float(sigma[bear]), 6),
        "mu_bull":       round(float(mu[bull]), 6),
        "sigma_bull":    round(float(sigma[bull]), 6),
        "transition_A":  A.round(4).tolist(),
        "state_sequence": regime.tolist(),
        "log_likelihood": round(float(prev_ll), 4),
    }`,
    explanation:
      "The Baum-Welch algorithm is an EM algorithm specialised to HMMs: the E-step computes forward-backward probabilities (state posteriors) and the M-step analytically maximises expected log-likelihood for Gaussian emissions — unlike generic EM, no inner optimisation loop is needed. Scaling the alpha and beta vectors prevents numerical underflow (each alpha[t] is scaled by its sum, keeping it in [0,1]), and the log-likelihood is computed from the product of scales rather than directly from the raw forward probabilities.",
  },
  {
    id: "pyfin-20260615-b1-student-copula",
    language: "python",
    tag: "finance",
    title: "Student-t copula — tail dependence for joint default / crash simulation",
    code: `import numpy as np
from scipy.stats import t as t_dist
from scipy.stats import norm
from scipy.optimize import minimize_scalar

def fit_t_copula(
    returns: np.ndarray,  # (T, N) asset returns
    nu_grid: np.ndarray = None,   # degrees of freedom to search over
) -> dict:
    """
    Student-t copula: C(u_1,..,u_N; R, nu) = t_nu_R(t_nu^{-1}(u_1),..,t_nu^{-1}(u_N))
    where R is the correlation matrix and nu the degrees of freedom.
    Tail dependence lambda_L = 2*t_{nu+1}(-sqrt((nu+1)*(1-rho)/(1+rho))).
    Higher tail dependence than Gaussian copula — better for joint crash simulation.
    """
    T, N = returns.shape
    if nu_grid is None:
        nu_grid = np.arange(3, 30, 1, dtype=float)

    # 1. Convert marginals to uniform via empirical CDF (ranks)
    U = np.zeros((T, N))
    for j in range(N):
        rank = np.argsort(np.argsort(returns[:, j]))
        U[:, j] = (rank + 1) / (T + 1)   # avoid 0 and 1

    # 2. Grid search over nu: maximise t-copula log-likelihood
    def t_copula_ll(nu):
        # Transform uniform margins to t margins
        X = t_dist.ppf(U, df=nu)   # (T, N) — t-distributed
        # Estimate correlation from these t-scores (ML for t copula with fixed nu)
        R_hat = np.corrcoef(X.T)
        np.fill_diagonal(R_hat, 1.0)
        try:
            L = np.linalg.cholesky(R_hat)
        except np.linalg.LinAlgError:
            return -np.inf
        Z = np.linalg.solve(L.T, X.T).T  # decorrelated
        # Log-likelihood contribution from copula density
        ll = T * (np.log(np.linalg.det(R_hat)) * (-0.5))
        ll += sum(
            (nu/2 + N/2) * np.log(1 + Z[t] @ np.linalg.solve(R_hat, Z[t]) / nu)
            - N * (nu/2 + 0.5) * np.log(1 + Z[t, i]**2 / nu)
            for t in range(T)
            for i in range(1)   # simplified: 1-term demo
        )
        return float(ll)

    best_nu, best_ll = nu_grid[0], -np.inf
    for nu in nu_grid:
        ll = t_copula_ll(nu)
        if ll > best_ll:
            best_ll, best_nu = ll, nu

    # Estimate correlation at best nu
    X     = t_dist.ppf(U, df=best_nu)
    R_hat = np.corrcoef(X.T)
    np.fill_diagonal(R_hat, 1.0)

    # Lower tail dependence (bivariate) between asset 0 and 1
    if N >= 2:
        rho12 = R_hat[0, 1]
        td_arg = -np.sqrt((best_nu + 1) * (1 - rho12) / (1 + rho12))
        tail_dep_01 = float(2 * t_dist.cdf(td_arg, df=best_nu + 1))
    else:
        tail_dep_01 = 0.0

    return {
        "nu":            round(float(best_nu), 1),
        "correlation":   R_hat.round(4).tolist(),
        "tail_dep_01":   round(tail_dep_01, 4),  # lower tail dependence (0,1)
        "log_lik":       round(float(best_ll), 4),
    }`,
    explanation:
      "The Student-t copula's tail dependence lambda_L is positive for any ν < ∞ and any positive correlation — this is the key difference from the Gaussian copula (lambda_L = 0 always), which underestimates the probability of simultaneous extreme negative returns during market crashes. The tail dependence formula 2×t_{ν+1}(−√((ν+1)(1−ρ)/(1+ρ))) increases as ν decreases (heavier tails) and as ρ increases; for ν = 5 and ρ = 0.7, lambda_L ≈ 0.37, meaning that conditional on asset A having a 1% return, asset B has a 37% chance of also having a 1% return — far higher than the Gaussian copula's ~2%.",
  },
  {
    id: "pyfin-20260615-b1-fama-french",
    language: "python",
    tag: "finance",
    title: "Fama-French 3-factor regression — alpha, beta, SMB, HML attribution",
    code: `import numpy as np
import pandas as pd
from scipy import stats

def fama_french_regression(
    portfolio_returns: pd.Series,  # daily excess returns (over Rf)
    mkt_rf: pd.Series,             # market excess return (Mkt-Rf)
    smb: pd.Series,                # Small Minus Big factor
    hml: pd.Series,                # High Minus Low (value) factor
    freq: str = "daily",
) -> dict:
    """
    Fama-French (1993) 3-factor model:
    R_i - Rf = alpha + beta_mkt*(Mkt-Rf) + beta_smb*SMB + beta_hml*HML + eps
    OLS via numpy for efficiency; t-stats and p-values from t(T-4) distribution.
    alpha > 0: portfolio earns excess returns beyond factor compensation.
    """
    # Align all series
    df = pd.concat([portfolio_returns, mkt_rf, smb, hml], axis=1).dropna()
    df.columns = ["R", "MKT", "SMB", "HML"]
    T  = len(df)

    y = df["R"].values                       # (T,) portfolio excess return
    X = np.column_stack([                    # (T, 4) design matrix
        np.ones(T),
        df["MKT"].values,
        df["SMB"].values,
        df["HML"].values,
    ])

    # OLS: beta = (X'X)^{-1} X'y
    XtX    = X.T @ X
    Xty    = X.T @ y
    coeffs = np.linalg.solve(XtX, Xty)      # [alpha, b_mkt, b_smb, b_hml]

    residuals = y - X @ coeffs
    sse       = float(residuals @ residuals)
    s2        = sse / (T - 4)               # unbiased variance estimate

    # Covariance matrix of coefficients
    cov_coef  = s2 * np.linalg.inv(XtX)
    se_coef   = np.sqrt(np.diag(cov_coef))

    t_stats   = coeffs / se_coef
    p_values  = 2 * (1 - stats.t.cdf(np.abs(t_stats), df=T-4))

    r2        = 1.0 - sse / (float(np.var(y, ddof=1)) * (T - 1))

    ann = {"daily": 252, "monthly": 12, "annual": 1}[freq]
    alpha_annual = float(coeffs[0]) * ann

    return {
        "alpha":        round(float(coeffs[0]), 8),
        "alpha_annual": round(alpha_annual, 4),
        "beta_mkt":     round(float(coeffs[1]), 4),
        "beta_smb":     round(float(coeffs[2]), 4),
        "beta_hml":     round(float(coeffs[3]), 4),
        "t_alpha":      round(float(t_stats[0]), 4),
        "t_mkt":        round(float(t_stats[1]), 4),
        "p_alpha":      round(float(p_values[0]), 6),
        "r_squared":    round(float(r2), 4),
        "residual_std": round(float(np.sqrt(s2 * ann)), 4),  # annualised tracking error
        "n_obs":        T,
    }`,
    explanation:
      "A positive and statistically significant alpha (t-stat > 2) is the acid test for manager skill: it measures returns unexplained by exposure to the three systematic risk factors (market, size, value). The SMB beta measures small-cap tilt (positive = long small-cap) and HML beta measures value tilt (positive = long cheap stocks); a pure factor investor would have alpha ≈ 0 and positive beta on the desired factor. Importantly, the standard errors must use T−4 degrees of freedom (not T−1) because estimating 4 coefficients reduces the effective sample size.",
  },
  {
    id: "pyfin-20260615-b1-kelly",
    language: "python",
    tag: "finance",
    title: "Kelly criterion — optimal position size with fractional Kelly and drawdown",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_sizing(
    win_prob: float = None,          # P(win) — for binary bets
    win_loss_ratio: float = None,    # avg win / avg loss — binary bets
    returns: np.ndarray = None,      # historical returns for continuous Kelly
    fraction: float = 0.5,           # half-Kelly reduces drawdown significantly
) -> dict:
    """
    Kelly criterion: maximise E[log(wealth)] -> bet a fraction f* of capital.
    Binary Kelly: f* = p/a - q/b  where p=P(win), q=P(lose), a=loss%, b=win%.
    Continuous Kelly: f* = mu / sigma^2  (for normally distributed returns).
    Fractional Kelly (recommended): bet fraction * f* to reduce vol and drawdown.
    """
    kelly_f = None

    if win_prob is not None and win_loss_ratio is not None:
        # Binary Kelly formula: f* = p*b - q*a / (a*b)
        p = win_prob
        q = 1.0 - p
        b = win_loss_ratio    # gain per unit risked if win
        a = 1.0               # loss per unit risked if lose
        kelly_f = (p * b - q * a) / (a * b)

    elif returns is not None:
        # Continuous Kelly from empirical moments (log returns preferred)
        mu    = float(np.mean(returns))
        sigma2 = float(np.var(returns, ddof=1))
        kelly_f = mu / sigma2 if sigma2 > 1e-14 else 0.0

        # Numerical maximisation for verification
        def neg_eg_log(f):
            if f <= -1.0: return 1e10
            return -float(np.mean(np.log(1 + f * returns)))

        res = minimize_scalar(neg_eg_log, bounds=(-1, 10), method="bounded")
        kelly_f_empirical = float(res.x)
    else:
        raise ValueError("Provide either (win_prob, win_loss_ratio) or returns")

    f_actual = float(kelly_f) * fraction

    # Expected growth rate and drawdown statistics for fractional Kelly
    if returns is not None:
        log_growths = np.log(1 + f_actual * returns)
        exp_log_ret = float(log_growths.mean())
        nav = np.exp(np.cumsum(log_growths))
        peak = np.maximum.accumulate(nav)
        dd   = (nav / peak - 1)
        max_dd = float(dd.min())
    else:
        # Approximate for binary bets
        p, q = win_prob, 1 - win_prob
        b, a = win_loss_ratio, 1.0
        exp_log_ret = p * np.log(1 + f_actual*b) + q * np.log(1 - f_actual*a)
        max_dd = -np.inf

    return {
        "kelly_fraction":    round(float(kelly_f), 4),
        "applied_fraction":  round(float(f_actual), 4),
        "kelly_multiplier":  round(float(fraction), 2),
        "exp_log_return":    round(float(exp_log_ret), 6),
        "max_drawdown":      round(float(max_dd), 4) if max_dd > -np.inf else None,
        "kelly_empirical":   round(float(kelly_f_empirical), 4) if returns is not None else None,
    }`,
    explanation:
      "Full Kelly maximises long-run expected log-wealth (geometric growth rate) but results in enormous short-term drawdowns — for a strategy with 60% win probability and 1:1 payoff, full Kelly bets 20% of capital per trade and can see drawdowns of 50% before recovering. Half-Kelly (fraction=0.5) gives 75% of the full-Kelly growth rate while cutting the variance of log-wealth in half and reducing typical drawdowns by roughly 2/3 — this is the standard recommendation for practitioners who are sensitive to the career risk of a large drawdown.",
  },
  {
    id: "pyfin-20260615-b1-hull-white",
    language: "python",
    tag: "finance",
    title: "Hull-White one-factor model — calibration to term structure and swaption vols",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def hull_white_bond_price(
    t: float, T: float,
    theta_func,    # callable: theta(t) from exact fit to term structure
    a: float,      # mean reversion speed
    sigma: float,  # short rate volatility
    r_t: float,    # current short rate
) -> float:
    """
    Hull-White: dr = (theta(t) - a*r) dt + sigma * dW
    Exact analytic bond price P(t,T) = A(t,T) * exp(-B(t,T) * r_t)
    B(t,T) = (1 - exp(-a*(T-t))) / a
    ln A(t,T) from calibration to initial term structure.
    """
    tau = T - t
    B   = (1 - np.exp(-a * tau)) / a
    # For exact fit to initial yield curve:
    # ln A = ln(P(0,T)/P(0,t)) + B*f(0,t) - sigma^2/(4a) * B^2*(1-exp(-2*a*t))
    # Here we use a simple flat term structure illustration
    r0 = 0.05   # placeholder: initial short rate
    lnP0T = -r0 * T
    lnP0t = -r0 * t
    B_0t  = (1 - np.exp(-a * t)) / a if a > 1e-8 else t
    lnA   = lnP0T - lnP0t + B * r0 - (sigma**2 / (4*a)) * B**2 * (1 - np.exp(-2*a*t))
    return np.exp(lnA - B * r_t)

def hw_swaption_vol(
    a: float, sigma: float, T_exp: float,
    swap_tenor: float, n_periods: int,
    r0: float = 0.05,
) -> float:
    """
    Black's lognormal swaption vol implied by Hull-White model.
    Approximation: sigma_swaption ≈ sigma_HW * B(T_exp, T_exp+tenor) * sqrt(1/(2*a)...)
    Full formula uses a sum over coupon dates weighted by forward discount factors.
    """
    coupon_dates = np.linspace(T_exp + swap_tenor/n_periods,
                                T_exp + swap_tenor, n_periods)

    B_i = (1 - np.exp(-a * (coupon_dates - T_exp))) / a
    # P(0, T_i) under flat curve
    P_i = np.exp(-r0 * coupon_dates)
    P_T = np.exp(-r0 * T_exp)

    # Annuity factor of swaption
    annuity = float(np.sum(P_i * swap_tenor / n_periods))

    # HW variance of annuity-weighted short rate integral
    hw_var = 0.0
    for i, (t_i, B_i_val) in enumerate(zip(coupon_dates, B_i)):
        hw_var += (P_i[i] * swap_tenor / n_periods * B_i_val)**2

    hw_var *= sigma**2 / (2 * a) * (1 - np.exp(-2 * a * T_exp))
    return float(np.sqrt(hw_var) / annuity)

def calibrate_hull_white(
    swaption_expiries: list, swaption_vols: list,
    swap_tenor: float = 5.0, r0: float = 0.05,
) -> dict:
    """
    Calibrate (a, sigma) to market swaption implied vols via least squares.
    """
    def objective(params):
        a, sigma = params
        if a <= 0 or sigma <= 0: return 1e10
        model_vols = [hw_swaption_vol(a, sigma, T_e, swap_tenor, 20, r0)
                      for T_e in swaption_expiries]
        return float(np.sum((np.array(model_vols) - np.array(swaption_vols))**2))

    res = minimize(objective, [0.10, 0.01], method="Nelder-Mead",
                   options={"xatol": 1e-8, "fatol": 1e-10, "maxiter": 5000})
    a, sigma = res.x
    fitted   = [hw_swaption_vol(a, sigma, T_e, swap_tenor, 20, r0)
                for T_e in swaption_expiries]
    return {
        "a":           round(float(a), 6),
        "sigma":       round(float(sigma), 6),
        "half_life":   round(float(np.log(2) / a), 2),
        "fitted_vols": [round(v, 6) for v in fitted],
        "market_vols": swaption_vols,
        "converged":   bool(res.success),
    }`,
    explanation:
      "The Hull-White model is uniquely tractable: the exact fit to the initial yield curve is achieved analytically through the theta(t) function (not a calibrated parameter), so all calibration effort goes into the two parameters (a, σ) that control the dynamic behavior. Mean reversion speed a determines the vol term structure: low a (≈0.01) produces a nearly constant vol across expiries (vol of long rates ≈ vol of short rates), while high a (≈0.5) generates a strong vol hump — short-dated swaptions become cheap while long-dated ones remain rich.",
  },
  {
    id: "pyfin-20260615-b1-cholesky-sim",
    language: "python",
    tag: "finance",
    title: "Cholesky correlated simulation — multi-asset GBM for portfolio pricing",
    code: `import numpy as np

def simulate_correlated_gbm(
    S0: np.ndarray,       # initial prices, shape (N,)
    mu: np.ndarray,       # drift per asset per year
    sigma: np.ndarray,    # vol per asset per year
    corr: np.ndarray,     # (N, N) correlation matrix
    T: float, n_steps: int, n_paths: int,
    seed: int = 42,
) -> dict:
    """
    Multi-asset GBM with correlated Brownian motions via Cholesky.
    cov[i,j] = sigma_i * sigma_j * corr[i,j]
    L = cholesky(cov)
    dS_i/S_i = mu_i*dt + sum_j L[i,j]*dZ_j (correlated Brownian increments)
    """
    rng = np.random.default_rng(seed)
    N   = len(S0)
    dt  = T / n_steps

    # Build covariance matrix and decompose
    cov   = sigma[:, None] * sigma[None, :] * corr
    L     = np.linalg.cholesky(cov)           # (N, N) lower triangular

    # Simulate using log-Euler
    # Shape: (n_paths, N)
    S = np.tile(S0[None, :], (n_paths, 1)).astype(float)

    # Pre-allocate path storage for summary stats only
    terminal = np.zeros((n_paths, N))

    for _ in range(n_steps):
        Z  = rng.standard_normal((n_paths, N))   # iid N(0,1)
        dW = Z @ L.T                              # (n_paths, N) correlated N(0, cov*dt)
        # Log-Euler: S *= exp((mu - 0.5*sigma^2)*dt + sqrt(dt)*dW)
        drift = (mu - 0.5 * sigma**2) * dt
        S    *= np.exp(drift[None, :] + np.sqrt(dt) * dW)

    terminal = S

    # Portfolio statistics at terminal date
    port_vals = terminal.sum(axis=1)   # equal-weight sum (unit notional each)

    return {
        "terminal_mean":   terminal.mean(axis=0).round(4).tolist(),
        "terminal_std":    terminal.std(axis=0).round(4).tolist(),
        "corr_realized":   np.corrcoef(np.log(terminal).T).round(4).tolist(),
        "portfolio_mean":  round(float(port_vals.mean()), 4),
        "portfolio_std":   round(float(port_vals.std()), 4),
        "portfolio_var_99": round(float(np.percentile(-port_vals, 1)), 4),
        "n_paths":         n_paths,
        "n_assets":        N,
    }`,
    explanation:
      "The key line is `dW = Z @ L.T` where Z is (n_paths × N) iid standard normal — this computes all n_paths correlated increments simultaneously with a single BLAS DGEMM call rather than a Python loop, making it ~100× faster for large path counts. The Cholesky lower triangular L satisfies L @ L.T = cov, so each row of Z @ L.T is a sample from N(0, cov), producing the exact correlation structure at each time step. Using log-Euler (multiply by exp of the drift+diffusion) ensures S stays positive for all paths without floor constraints.",
  },
  {
    id: "pyfin-20260615-b1-stratified-mc",
    language: "python",
    tag: "finance",
    title: "Stratified sampling Monte Carlo — variance reduction via uniform partition",
    code: `import numpy as np
from scipy.stats import norm

def stratified_call_mc(
    S0: float, K: float, r: float, sigma: float, T: float,
    n_paths: int = 50_000, n_strata: int = 50, seed: int = 42,
) -> dict:
    """
    Stratified sampling: partition [0,1] into n_strata equal intervals.
    Draw uniform U_j ~ Uniform((j-1)/n, j/n) for j=1..n for each stratum.
    Convert to standard normals via norm.ppf(U_j).
    Guarantees uniform coverage of the probability space — eliminates empty regions.
    Variance reduction ~ n_strata^2 relative to naive Monte Carlo for smooth payoffs.
    """
    rng = np.random.default_rng(seed)
    n   = n_paths
    K_s = n_strata  # number of strata

    # --- Naive MC ---
    Z_naive = rng.standard_normal(n)
    S_naive = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_naive)
    pay_naive = np.exp(-r*T) * np.maximum(S_naive - K, 0.0)
    price_naive = float(pay_naive.mean())
    se_naive    = float(pay_naive.std(ddof=1) / np.sqrt(n))

    # --- Stratified MC ---
    paths_per_stratum = max(n // K_s, 1)
    strat_prices = np.zeros(K_s)

    for j in range(K_s):
        lo = j / K_s
        hi = (j + 1) / K_s
        # Draw uniform samples within stratum j
        U = rng.uniform(lo, hi, paths_per_stratum)
        Z = norm.ppf(U)          # inverse CDF transform
        S = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
        payoffs = np.exp(-r*T) * np.maximum(S - K, 0.0)
        strat_prices[j] = payoffs.mean()

    price_strat = float(strat_prices.mean())  # average over strata (equal weights)
    # SE of stratified estimator: std of stratum means / sqrt(n_strata)
    se_strat    = float(strat_prices.std(ddof=1) / np.sqrt(K_s))

    # Black-Scholes exact for comparison
    sqT = np.sqrt(T)
    d1  = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    bs_price = float(S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2))

    return {
        "bs_price":    round(bs_price, 6),
        "naive_price": round(price_naive, 6),
        "strat_price": round(price_strat, 6),
        "se_naive":    round(se_naive, 6),
        "se_strat":    round(se_strat, 6),
        "var_reduction": round((1 - (se_strat/se_naive)**2) * 100, 2),
        "n_strata":    K_s,
    }`,
    explanation:
      "Stratified sampling achieves variance reduction without any analytical correction formula: by guaranteeing at least one sample in each [j/n, (j+1)/n] probability interval, it eliminates the sampling variance from the inter-stratum component of the payoff. For a smooth payoff like a European call, the variance reduction is approximately proportional to n_strata² — with 50 strata, the variance is reduced by roughly 50² = 2500× relative to naive MC, though the actual improvement depends on the payoff's regularity within each stratum. Stratification is most powerful when combined with antithetic variates (negate Z within each stratum).",
  },
  {
    id: "pyfin-20260615-b1-bdt-tree",
    language: "python",
    tag: "finance",
    title: "Black-Derman-Toy binomial tree — short rate calibration to caps",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_calibrate(
    target_prices: list,   # zero-bond prices P(0,1), P(0,2), ..., P(0,N)
    sigma_vec: list,       # vol term structure [sigma_1, sigma_2, ..., sigma_N]
    n_periods: int = None,
) -> dict:
    """
    Black-Derman-Toy (1990): log-normal short rate tree.
    At each node (i, j): r(i,j) = u(i) * exp(2*sigma_i*j*sqrt(dt))
    where u(i) = median short rate at time i, calibrated to match target prices.
    Binomial tree: up/down branching with equal risk-neutral probability 0.5.
    """
    N  = len(target_prices)
    dt = 1.0               # 1-year time steps for simplicity

    # Tree of short rates: tree[i][j] = rate at time i, state j
    u  = np.zeros(N)       # median rates to calibrate
    sig = np.array(sigma_vec[:N])

    def tree_bond_price(u_vals, period, target_P):
        """Price a zero bond maturing at 'period' given u_vals up to period-1."""
        # Build short rate tree
        r_tree = [[0.0] * (i + 1) for i in range(period)]
        for i in range(period):
            for j in range(i + 1):
                r_tree[i][j] = u_vals[i] * np.exp(2 * sig[i] * j * np.sqrt(dt))
        # Backward induction for bond price
        V = [np.exp(-r_tree[period-1][j] * dt) for j in range(period)]
        for i in range(period-2, -1, -1):
            V = [np.exp(-r_tree[i][j] * dt) * 0.5 * (V[j] + V[j+1])
                 for j in range(i + 1)]
        return V[0]

    # Calibrate u[i] sequentially to match target bond prices
    for i in range(N):
        target = target_prices[i]
        def objective(u_i):
            u_test = u.copy()
            u_test[i] = u_i
            return tree_bond_price(u_test, i + 1, target) - target

        u[i] = brentq(objective, 1e-6, 0.5, xtol=1e-10, maxiter=500)

    # Build the calibrated rate tree
    rate_tree = []
    for i in range(N):
        row = [float(u[i] * np.exp(2 * sig[i] * j * np.sqrt(dt)))
               for j in range(i + 1)]
        rate_tree.append(row)

    return {
        "median_rates": u.round(6).tolist(),
        "rate_tree":    [[round(r, 6) for r in row] for row in rate_tree],
        "implied_zero_yields": [-np.log(p) / (i+1) for i, p in enumerate(target_prices)],
    }`,
    explanation:
      "The BDT tree is calibrated sequentially (bootstrapped): u[i] is the only free parameter at maturity i because all prior rates are already fixed, and Brent's method finds the unique u[i] that prices a zero bond maturing at i+1 to match the market price. The log-normal rate structure (r = u × exp(2σ√dt × j)) ensures rates are always positive and that the vol at each node matches the input term structure — unlike the Ho-Lee model which has normally distributed rates and can go negative, a critical advantage in the current rate environment.",
  },
  {
    id: "pyfin-20260615-b1-rf-alpha",
    language: "python",
    tag: "finance",
    title: "Random forest alpha signal — feature importance and walk-forward validation",
    code: `import numpy as np
from typing import Optional

def simple_random_forest_alpha(
    X: np.ndarray,         # (T, F) feature matrix
    y: np.ndarray,         # (T,) next-period returns
    n_trees: int = 100,
    max_depth: int = 5,
    min_samples_leaf: int = 20,
    train_frac: float = 0.7,
) -> dict:
    """
    Minimal random forest regressor for alpha signal via bagging + feature subsampling.
    Walk-forward: train on first 70% of data, test on last 30% — NO LOOKAHEAD.
    Feature importance via OOB permutation (approximate).
    """
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.metrics import r2_score
        from sklearn.inspection import permutation_importance
    except ImportError:
        return {"error": "sklearn not installed"}

    T, F = X.shape
    split = int(T * train_frac)

    X_train, y_train = X[:split], y[:split]
    X_test,  y_test  = X[split:], y[split:]

    model = RandomForestRegressor(
        n_estimators=n_trees,
        max_depth=max_depth,
        min_samples_leaf=min_samples_leaf,
        max_features="sqrt",      # sqrt(F) features per split — reduces correlation
        oob_score=True,
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred_train = model.predict(X_train)
    y_pred_test  = model.predict(X_test)

    # Information coefficient (IC) = rank correlation of predicted vs actual returns
    from scipy.stats import spearmanr
    ic_test  = float(spearmanr(y_pred_test,  y_test).statistic)
    ic_train = float(spearmanr(y_pred_train, y_train).statistic)

    # Walk-forward IC stability: rolling 60-day IC
    preds_series = np.concatenate([y_pred_train, y_pred_test])
    actual_series = np.concatenate([y_train, y_test])
    window = 60
    rolling_ic = []
    for t in range(window, len(preds_series)):
        ic, _ = spearmanr(preds_series[t-window:t], actual_series[t-window:t])
        rolling_ic.append(float(ic))

    return {
        "ic_train":       round(ic_train, 4),
        "ic_test":        round(ic_test, 4),
        "oob_r2":         round(float(model.oob_score_), 4),
        "r2_test":        round(float(r2_score(y_test, y_pred_test)), 4),
        "feat_importance": model.feature_importances_.round(4).tolist(),
        "rolling_ic_mean": round(float(np.mean(rolling_ic)), 4),
        "rolling_ic_std":  round(float(np.std(rolling_ic)), 4),
        "n_train":         split,
        "n_test":          T - split,
    }`,
    explanation:
      "The random forest's two randomisation mechanisms (bagging: random sample of rows; feature subsampling: sqrt(F) features per split) make individual trees decorrelated — averaging uncorrelated errors reduces variance at the ensemble level. The information coefficient (Spearman rank correlation of predictions vs actual returns) is the standard quant metric for alpha quality: IC > 0.05 daily on out-of-sample data is considered significant, and IC stability (low rolling IC volatility) indicates the signal is regime-robust rather than overfitting a specific period.",
  },
  {
    id: "pyfin-20260615-b1-backtest-costs",
    language: "python",
    tag: "finance",
    title: "Backtesting with slippage and market impact — realistic transaction cost model",
    code: `import numpy as np
import pandas as pd

def backtest_with_costs(
    signals: pd.Series,     # desired position (-1 to 1, daily)
    prices: pd.Series,      # daily close prices
    bid_ask_spread: float = 0.001,   # 10 bps half-spread
    perm_impact_bps: float = 5.0,   # permanent impact per unit of ADV
    adv_fraction: float = 0.01,     # max ADV fraction traded per day
    adv: float = 1e6,                # average daily volume in shares
    capital: float = 1e6,            # portfolio capital
) -> dict:
    """
    Realistic backtest with three cost components:
    1. Bid-ask spread: paid on every trade (half-spread per side).
    2. Permanent market impact: sqrt(size/ADV) * impact_coef (Almgren-Chriss style).
    3. Timing slippage: simulated as execution at next-day open vs signal close.
    Position sizing: target_shares = signal * capital / price.
    """
    prices   = prices.values
    signals  = signals.values
    T        = len(prices)

    target_shares = signals * capital / prices
    gross_ret  = np.zeros(T)
    net_ret    = np.zeros(T)
    positions  = np.zeros(T)
    trade_cost = np.zeros(T)

    prev_pos = 0.0
    for t in range(1, T):
        # Gross return from holding
        if prices[t-1] > 0:
            gross_r = (prices[t] - prices[t-1]) / prices[t-1]
        else:
            gross_r = 0.0

        # Trade (rebalance to target at t-1's close)
        trade = target_shares[t] - prev_pos   # shares traded at t
        notional = abs(trade) * prices[t-1]

        # Bid-ask spread cost
        spread_cost = notional * bid_ask_spread

        # Permanent market impact: square-root model
        if adv > 0 and notional > 0:
            impact_frac = perm_impact_bps * 1e-4 * np.sqrt(notional / (adv * prices[t-1]))
        else:
            impact_frac = 0.0
        impact_cost = notional * impact_frac

        tc = spread_cost + impact_cost
        trade_cost[t] = tc

        # Net P&L: gross P&L on prior position minus transaction costs
        gross_ret[t] = prev_pos * prices[t-1] * gross_r / capital
        net_ret[t]   = gross_ret[t] - tc / capital

        positions[t] = target_shares[t]
        prev_pos     = target_shares[t]

    nav_gross = np.exp(np.cumsum(gross_ret))
    nav_net   = np.exp(np.cumsum(net_ret))

    def sharpe(r):
        m, s = r.mean(), r.std(ddof=1)
        return float(m / s * np.sqrt(252)) if s > 1e-10 else 0.0

    return {
        "sharpe_gross":      round(sharpe(gross_ret), 4),
        "sharpe_net":        round(sharpe(net_ret), 4),
        "total_cost_bps":    round(float(trade_cost.sum() / capital * 10_000), 2),
        "annual_turnover":   round(float(np.abs(np.diff(positions, prepend=0)).sum()
                                        * prices.mean() / capital), 2),
        "max_dd_net":        round(float((nav_net / np.maximum.accumulate(nav_net) - 1).min()), 4),
        "ann_ret_gross":     round(float(gross_ret.mean() * 252), 4),
        "ann_ret_net":       round(float(net_ret.mean() * 252), 4),
    }`,
    explanation:
      "The square-root market impact model (cost ∝ √(size/ADV)) is empirically well-supported: the price impact of trading is concave in order size because large orders are more likely to find liquidity at multiple price levels rather than being absorbed by a single market maker. Turnover drives transaction costs quadratically: doubling signal turnover doubles the number of trades and roughly doubles the cost, while the square-root impact means that a 4× larger position size only incurs 2× the permanent impact per trade. Most realistic backtesters fail to model the lead-lag between signal and execution (next-day open), which can add 10-50 bps per trade in practice.",
  },
  {
    id: "pyfin-20260615-b1-pairs-zscore",
    language: "python",
    tag: "finance",
    title: "Pairs trading z-score signal — cointegration test and signal generation",
    code: `import numpy as np
import pandas as pd
from scipy import stats

def pairs_trading_signal(
    price_a: pd.Series,
    price_b: pd.Series,
    lookback: int = 60,        # rolling window for spread statistics
    entry_z: float = 2.0,      # enter when |z| > entry_z
    exit_z:  float = 0.5,      # exit when |z| < exit_z
) -> dict:
    """
    Pairs trading: go long A / short B when spread is statistically cheap.
    Step 1: OLS hedge ratio beta = Cov(A,B) / Var(B) (regress A on B).
    Step 2: spread = A - beta * B.
    Step 3: z-score = (spread - rolling_mean) / rolling_std.
    Step 4: generate signals: +1 when z < -entry_z; -1 when z > entry_z.
    Test for cointegration using Engle-Granger (ADF on residuals).
    """
    log_a = np.log(price_a.values)
    log_b = np.log(price_b.values)
    T     = len(log_a)

    # OLS hedge ratio (static, full-sample for cointegration test)
    X_full = np.column_stack([np.ones(T), log_b])
    coef   = np.linalg.lstsq(X_full, log_a, rcond=None)[0]
    alpha, beta = float(coef[0]), float(coef[1])
    spread_static = log_a - beta * log_b - alpha

    # ADF test on residuals (approximate via statsmodels pattern)
    # Simplified: compute ADF statistic via OLS
    ds = np.diff(spread_static)
    s_lag = spread_static[:-1]
    adf_X = np.column_stack([np.ones(len(ds)), s_lag])
    adf_c = np.linalg.lstsq(adf_X, ds, rcond=None)[0]
    adf_t = float(adf_c[1])   # coefficient on lagged level ~ ADF statistic

    # Rolling z-score using expanding beta
    signals = np.zeros(T)
    zscores = np.zeros(T)
    spread  = np.zeros(T)

    position = 0
    for t in range(lookback, T):
        # Rolling hedge ratio
        window_a = log_a[t-lookback:t]
        window_b = log_b[t-lookback:t]
        b_hat    = float(np.cov(window_a, window_b)[0,1] / (np.var(window_b) + 1e-10))
        spread[t] = log_a[t] - b_hat * log_b[t]

        mu_s  = float(spread[t-lookback:t].mean())
        std_s = float(spread[t-lookback:t].std() + 1e-10)
        z     = (spread[t] - mu_s) / std_s
        zscores[t] = z

        # Signal logic
        if position == 0:
            if z < -entry_z: position = +1   # spread cheap: long A, short B
            if z > +entry_z: position = -1   # spread rich: short A, long B
        else:
            if abs(z) < exit_z: position = 0  # close when spread converges
        signals[t] = position

    return {
        "beta_static":  round(beta, 4),
        "alpha_static": round(alpha, 4),
        "adf_stat":     round(adf_t, 4),        # more negative = more stationary
        "signals":      signals[lookback:].tolist(),
        "zscores":      zscores[lookback:].round(4).tolist(),
        "spread":       spread[lookback:].round(6).tolist(),
        "spread_vol":   round(float(spread[lookback:].std()), 6),
        "n_trades":     int(np.sum(np.abs(np.diff(signals[lookback:], prepend=0)) > 0)),
    }`,
    explanation:
      "The ADF (Augmented Dickey-Fuller) test on the residuals is the Engle-Granger cointegration test: if the spread is I(0) (stationary), the ADF t-statistic is more negative than critical values (−2.9 at 5% for 1000 observations). The rolling z-score uses only past data in the lookback window for both the hedge ratio and spread mean/std, ensuring no look-ahead bias — a common mistake is estimating the hedge ratio from the full sample and then generating signals, which leaks future information into the signal and produces unrealistically high backtest Sharpe ratios.",
  },
  {
    id: "pyfin-20260615-b1-rolling-beta",
    language: "python",
    tag: "finance",
    title: "Rolling OLS beta — market exposure estimation with Newey-West standard errors",
    code: `import numpy as np
import pandas as pd

def rolling_beta(
    returns: pd.Series,       # portfolio excess returns
    market:  pd.Series,       # market excess returns (Mkt-Rf)
    window: int = 60,         # rolling window (days)
    lag: int = 5,             # Newey-West lags for HAC SE
) -> dict:
    """
    Rolling OLS beta with Newey-West heteroscedasticity and autocorrelation
    consistent (HAC) standard errors.
    beta_t = Cov(R_t, Mkt_t) / Var(Mkt_t)  over rolling window.
    Alpha_t = mean(R - beta*Mkt) over the same window.
    NW SE corrects for serial correlation in daily returns (momentum / mean rev).
    """
    r   = returns.values
    m   = market.values
    T   = len(r)

    betas  = np.full(T, np.nan)
    alphas = np.full(T, np.nan)
    se_b   = np.full(T, np.nan)
    t_beta = np.full(T, np.nan)

    def newey_west_var(X, resid, n_lags):
        """HAC variance of OLS estimator via Newey-West."""
        T_w, k = X.shape
        XtX_inv = np.linalg.inv(X.T @ X)
        Xe = X * resid[:, None]     # (T, k) outer products
        S  = Xe.T @ Xe              # variance: lag 0
        for lag_j in range(1, n_lags + 1):
            w   = 1 - lag_j / (n_lags + 1)   # Bartlett kernel
            G   = Xe[lag_j:].T @ Xe[:-lag_j]
            S  += w * (G + G.T)
        return XtX_inv @ S @ XtX_inv

    for t in range(window, T + 1):
        r_w = r[t-window:t]
        m_w = m[t-window:t]
        X_w = np.column_stack([np.ones(window), m_w])

        coef = np.linalg.lstsq(X_w, r_w, rcond=None)[0]
        alpha_t, beta_t = float(coef[0]), float(coef[1])

        resid_w = r_w - X_w @ coef
        V = newey_west_var(X_w, resid_w, lag)
        se_beta_t = float(np.sqrt(V[1, 1]))

        betas[t-1]  = beta_t
        alphas[t-1] = alpha_t
        se_b[t-1]   = se_beta_t
        t_beta[t-1] = beta_t / (se_beta_t + 1e-10)

    valid = ~np.isnan(betas)

    return {
        "betas":       betas[valid].round(4).tolist(),
        "alphas":      alphas[valid].round(6).tolist(),
        "se_beta":     se_b[valid].round(4).tolist(),
        "t_beta":      t_beta[valid].round(4).tolist(),
        "mean_beta":   round(float(np.nanmean(betas)), 4),
        "beta_range":  [round(float(np.nanmin(betas)), 4), round(float(np.nanmax(betas)), 4)],
        "window":      window,
        "nw_lags":     lag,
    }`,
    explanation:
      "Newey-West standard errors are essential for daily financial return regressions because OLS assumes iid residuals, but daily returns exhibit serial correlation (momentum at short horizons, mean reversion at longer horizons) and heteroscedasticity (GARCH effects). The Bartlett kernel weight 1 − l/(q+1) for lag l upweights nearby lags and downweights distant lags, ensuring the HAC covariance estimator is positive semi-definite — unlike a rectangular window (equal weights) which can produce negative eigenvalues when q is large relative to the sample size.",
  },
  {
    id: "pyfin-20260615-b1-vol-target",
    language: "python",
    tag: "finance",
    title: "Volatility targeting — daily rebalancing to constant risk exposure",
    code: `import numpy as np
import pandas as pd

def volatility_targeting(
    returns: pd.Series,          # daily strategy/asset returns
    target_vol: float = 0.10,    # target annual volatility (10%)
    vol_window: int = 21,        # EWMA vol estimation window (days)
    vol_halflife: int = 10,      # EWMA half-life for vol estimation
    max_leverage: float = 3.0,   # maximum allowable leverage
    min_leverage: float = 0.0,   # minimum (no shorting if 0)
) -> dict:
    """
    Volatility targeting: scale position to maintain constant risk exposure.
    w_t = min(target_vol / sigma_t, max_lev) where sigma_t is estimated vol.
    EWMA vol: sigma_t^2 = lambda*sigma_{t-1}^2 + (1-lambda)*r_{t-1}^2
    Daily target vol = annual_vol / sqrt(252).
    """
    r  = returns.values
    T  = len(r)
    daily_target = target_vol / np.sqrt(252)

    # EWMA decay factor from half-life
    lam = 0.5 ** (1.0 / vol_halflife)

    # EWMA volatility estimate
    sigma_sq = np.zeros(T)
    sigma_sq[0] = float(np.var(r[:vol_window]))  # initialise from first window

    for t in range(1, T):
        sigma_sq[t] = lam * sigma_sq[t-1] + (1 - lam) * r[t-1]**2

    sigma_daily = np.sqrt(np.maximum(sigma_sq, 1e-10))

    # Leverage: target daily vol / estimated daily vol, capped
    leverage = np.clip(daily_target / sigma_daily, min_leverage, max_leverage)

    # Vol-targeted returns
    vt_returns = leverage * r

    # Performance statistics
    cum_ret  = np.exp(np.cumsum(vt_returns))
    raw_cum  = np.exp(np.cumsum(r))

    def sharpe_ann(x):
        return float(x.mean() / (x.std(ddof=1) + 1e-10) * np.sqrt(252))

    def max_dd(nav):
        dd = nav / np.maximum.accumulate(nav) - 1
        return float(dd.min())

    realised_vol_annual = float(vt_returns.std(ddof=1) * np.sqrt(252))

    return {
        "sharpe_raw":          round(sharpe_ann(r), 4),
        "sharpe_vol_targeted": round(sharpe_ann(vt_returns), 4),
        "realised_vol_annual": round(realised_vol_annual, 4),
        "target_vol":          round(target_vol, 4),
        "vol_error_pct":       round(abs(realised_vol_annual - target_vol) / target_vol * 100, 2),
        "mean_leverage":       round(float(leverage.mean()), 4),
        "max_leverage_used":   round(float(leverage.max()), 4),
        "max_dd_raw":          round(max_dd(raw_cum), 4),
        "max_dd_targeted":     round(max_dd(cum_ret), 4),
        "sigma_series":        (sigma_daily * np.sqrt(252)).round(4).tolist(),
        "leverage_series":     leverage.round(4).tolist(),
    }`,
    explanation:
      "Volatility targeting is the simplest form of risk parity: by scaling down exposure when volatility is high (crisis periods) and scaling up when it is low (calm markets), the strategy mechanically reduces the position size after large drawdowns — which typically follow periods of elevated vol — thereby reducing the depth and duration of drawdowns. The Sharpe ratio improvement comes from reducing the left-tail: the untargeted strategy bears full position during vol spikes while the targeted strategy is already de-leveraged before the worst days occur, improving the risk-adjusted return without changing the underlying signal.",
  },
  {
    id: "pyfin-20260615-b1-min-var-hedge",
    language: "python",
    tag: "finance",
    title: "Minimum variance hedge ratio — OLS, duration, and cross-hedge calculation",
    code: `import numpy as np
from scipy.stats import pearsonr

def min_var_hedge(
    spot_returns: np.ndarray,     # returns of position to hedge (e.g., fuel cost)
    futures_returns: np.ndarray,  # returns of hedging instrument (e.g., oil futures)
    n_contracts: int = None,      # contracts available (if None, return fractional hedge)
    contract_size: float = 1.0,   # contract notional per futures unit
    exposure: float = 1.0,        # size of position to hedge
) -> dict:
    """
    OLS hedge ratio: h* = Cov(spot, futures) / Var(futures)
    Effectiveness E = R^2 of the OLS regression.
    Number of contracts = h* * exposure / contract_size.
    Cross-hedge: when the available futures don't perfectly correlate with exposure.
    """
    rho, _     = pearsonr(spot_returns, futures_returns)
    sigma_s    = float(np.std(spot_returns, ddof=1))
    sigma_f    = float(np.std(futures_returns, ddof=1))

    # OLS hedge ratio
    h_star     = rho * sigma_s / sigma_f
    h_ols      = float(np.cov(spot_returns, futures_returns)[0, 1]
                        / (np.var(futures_returns, ddof=1) + 1e-14))

    # Residual variance of hedged portfolio
    hedged_rets = spot_returns - h_star * futures_returns
    var_hedged  = float(np.var(hedged_rets, ddof=1))
    var_unhedged = float(np.var(spot_returns, ddof=1))

    effectiveness = 1.0 - var_hedged / (var_unhedged + 1e-14)   # = R^2

    # Number of contracts to trade
    if n_contracts is not None:
        h_rounded = round(h_star * exposure / contract_size)
        h_frac    = h_rounded * contract_size / exposure
    else:
        h_frac    = h_star
        h_rounded = None

    # Tail-adjusted hedge: scale by correlation to reduce basis risk contribution
    basis_risk_vol = float(sigma_s * np.sqrt(1 - rho**2))

    return {
        "h_star":          round(float(h_star), 4),
        "h_ols":           round(float(h_ols), 4),
        "rho":             round(float(rho), 4),
        "sigma_spot":      round(sigma_s, 6),
        "sigma_futures":   round(sigma_f, 6),
        "effectiveness":   round(effectiveness, 4),  # R^2; 1 = perfect hedge
        "var_reduction":   round(effectiveness * 100, 2),
        "basis_risk_vol":  round(basis_risk_vol, 6),
        "n_contracts":     h_rounded,
        "effective_h":     round(h_frac, 4),
    }`,
    explanation:
      "The OLS hedge ratio h* = ρσ_s/σ_f minimises the variance of the hedged position — it is the regression coefficient from regressing spot changes on futures changes, not the ratio of volatilities. Hedge effectiveness R² measures what fraction of spot variance is eliminated: a cross-hedge (e.g., using crude oil futures to hedge jet fuel) may have R² ≈ 0.85, meaning 85% of variance is eliminated but 15% remains as unhedgeable basis risk with volatility σ_s√(1−ρ²). When h* > 1, more futures contracts than the face value of the exposure are needed — common when hedging duration-sensitive instruments like bonds.",
  },
  {
    id: "pyfin-20260615-b1-barrier-mc",
    language: "python",
    tag: "finance",
    title: "Barrier option MC — discrete monitoring with bridge correction",
    code: `import numpy as np
from scipy.stats import norm

def barrier_call_mc(
    S0: float, K: float, B: float,   # barrier B < S0 for down-and-out
    r: float, sigma: float, T: float,
    n_steps: int = 252, n_paths: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    Down-and-out European call via Monte Carlo with discrete monitoring.
    Brownian bridge probability: probability of crossing barrier between two
    observed non-crossing prices is used to correct discrete monitoring bias.
    Without bridge correction, discrete-monitoring MC underestimates knockout probability.
    """
    rng = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)
    mu   = (r - 0.5 * sigma**2) * dt
    vol  = sigma * np.sqrt(dt)

    # --- Naive discrete MC ---
    Z    = rng.standard_normal((n_paths, n_steps))
    logS = np.log(S0) + np.cumsum(mu + vol * Z, axis=1)
    S    = np.exp(logS)

    alive_naive = (S.min(axis=1) > B)
    S_T         = S[:, -1]
    pay_naive   = disc * np.maximum(S_T - K, 0.0) * alive_naive
    price_naive = float(pay_naive.mean())
    se_naive    = float(pay_naive.std(ddof=1) / np.sqrt(n_paths))

    # --- Bridge-corrected MC ---
    # For each consecutive pair (S_t, S_{t+1}) both above B,
    # the bridge crossing probability is exp(-2*(S_t - B)*(S_{t+1} - B) / (sigma^2 * dt * S_t^2))
    # (in log-price space, barrier = ln(B))
    log_B    = np.log(B)
    log_S    = np.log(np.column_stack([np.full(n_paths, np.log(S0)), logS]))

    alive_bridge = np.ones(n_paths, dtype=bool)
    for t in range(n_steps):
        x0 = log_S[:, t]
        x1 = log_S[:, t + 1]
        above = (x0 > log_B) & (x1 > log_B)
        # Crossing probability via Brownian bridge
        p_cross = np.exp(-2.0 * np.maximum(x0 - log_B, 0.0)
                            * np.maximum(x1 - log_B, 0.0)
                            / (sigma**2 * dt))
        # Knock out with probability p_cross (even if both endpoints are above barrier)
        knock   = rng.random(n_paths) < p_cross
        alive_bridge[above & knock] = False
        alive_bridge[~above]        = False

    pay_bridge   = disc * np.maximum(S_T - K, 0.0) * alive_bridge
    price_bridge = float(pay_bridge.mean())
    se_bridge    = float(pay_bridge.std(ddof=1) / np.sqrt(n_paths))

    return {
        "price_naive":  round(price_naive,  6),
        "se_naive":     round(se_naive,     6),
        "price_bridge": round(price_bridge, 6),
        "se_bridge":    round(se_bridge,    6),
        "pct_alive_naive":  round(float(alive_naive.mean()), 4),
        "pct_alive_bridge": round(float(alive_bridge.mean()), 4),
        "n_steps":      n_steps,
    }`,
    explanation:
      "The Brownian bridge correction accounts for the probability that the path crossed the barrier between two monitored time points — even when both S_t and S_{t+1} are observed above the barrier, there is a positive probability that the continuous path dipped below B in between. The crossing probability exp(−2(x_0−ln B)(x_1−ln B)/(σ²dt)) comes from the explicit formula for the probability that a Brownian bridge between x_0 and x_1 crosses a level B, and dramatically improves accuracy when n_steps is small (weekly or monthly monitoring).",
  },
  {
    id: "pyfin-20260615-b1-cds-hazard",
    language: "python",
    tag: "finance",
    title: "CDS hazard rate bootstrap — term structure from par spread quotes",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(
    par_spreads: dict,    # {tenor_years: spread_bps}, e.g. {1: 50, 3: 80, 5: 120}
    recovery: float = 0.40,
    r: float = 0.03,      # risk-free rate (flat)
    n_steps_per_year: int = 4,  # quarterly
) -> dict:
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    Par spread: s such that PV(premium leg) = PV(protection leg).
    Protection leg integral approximated via hazard rates and survival probabilities.
    Sequential bootstrap: each tenor's hazard rate determined given prior rates.
    """
    lgd      = 1.0 - recovery
    tenors   = sorted(par_spreads.keys())
    hazards  = {}       # {tenor: hazard_rate} on each segment
    h_breaks = [0.0] + tenors

    def survival_prob(t: float, h_segments: list) -> float:
        integral = 0.0
        for i, h in enumerate(h_segments):
            t_lo = h_breaks[i]
            t_hi = min(h_breaks[i + 1], t)
            if t_lo >= t: break
            integral += h * (t_hi - t_lo)
        return np.exp(-integral)

    def cds_pv(spread_bps: float, tenor: float, h_segments: list):
        spread = spread_bps * 1e-4
        dt     = 1.0 / n_steps_per_year
        coupon_dates = np.arange(dt, tenor + 1e-9, dt)

        # Premium leg
        pv_prem = 0.0
        for T_i in coupon_dates:
            df = np.exp(-r * T_i)
            sp = survival_prob(T_i, h_segments)
            pv_prem += spread * dt * df * sp

        # Protection leg (midpoint integration)
        pv_prot = 0.0
        n_int   = int(tenor * n_steps_per_year * 4)
        dt_int  = tenor / n_int
        for k in range(n_int):
            t_mid = (k + 0.5) * dt_int
            # Hazard rate at t_mid
            h_mid = h_segments[0]
            for i, (lo, hi) in enumerate(zip(h_breaks[:-1], h_breaks[1:])):
                if lo <= t_mid < hi:
                    h_mid = h_segments[i]
                    break
            pv_prot += lgd * np.exp(-r*t_mid) * survival_prob(t_mid, h_segments) * h_mid * dt_int

        return pv_prem - pv_prot   # = 0 at par spread

    h_list = []
    for tenor in tenors:
        spread_bps = par_spreads[tenor]

        def eq(h_new):
            h_test = h_list + [h_new]
            return cds_pv(spread_bps, tenor, h_test)

        h_val = brentq(eq, 1e-6, 1.0, xtol=1e-10)
        h_list.append(float(h_val))
        hazards[tenor] = round(float(h_val), 6)

    # Compute survival probabilities at each tenor
    surv_probs = {
        t: round(float(survival_prob(t, h_list)), 6) for t in tenors
    }

    return {
        "hazard_rates": hazards,              # bp/year
        "survival_probs": surv_probs,
        "implied_prob_default_5y": round(1 - surv_probs.get(max(tenors), 1.0), 4),
    }`,
    explanation:
      "The sequential (bootstrap) calibration is exact: at each new tenor, all prior hazard rates are fixed and the single new rate is solved via Brent's method. The CDS par spread satisfies PV(premium) = PV(protection) which is a linear equation in the hazard rate for a given survival probability function — the nonlinearity comes from the survival probability itself depending on all prior hazard rates. Dividing the protection leg into many small time steps for numerical integration is critical because the hazard-rate × survival-probability integrand has a convex shape that midpoint quadrature captures accurately.",
  },
  {
    id: "pyfin-20260615-b1-pca-factor",
    language: "python",
    tag: "finance",
    title: "Statistical factor model — PCA-based risk decomposition of equity returns",
    code: `import numpy as np
import pandas as pd

def pca_factor_model(
    returns: np.ndarray,   # (T, N) demeaned asset returns
    n_factors: int = 5,    # number of statistical factors
) -> dict:
    """
    Statistical factor model via PCA:
    R_t = B * F_t + eps_t
    B: (N, K) factor loadings (from eigenvectors)
    F_t: (K,) factor returns (from principal components)
    eps_t: (N,) idiosyncratic returns
    Risk decomposition: Var(R) = B*Var(F)*B' + Diag(Var(eps))
    Residual covariance is diagonal (idiosyncratic risk).
    """
    T, N = returns.shape

    # Sample covariance
    C    = (returns.T @ returns) / (T - 1)   # (N, N)

    # PCA via eigendecomposition
    eigvals, eigvecs = np.linalg.eigh(C)
    # Sort descending
    idx     = np.argsort(eigvals)[::-1]
    eigvals = eigvals[idx]
    eigvecs = eigvecs[:, idx]                # columns are eigenvectors

    # Factor loadings: B = eigvecs[:, :K] * sqrt(eigenvalues)
    K = n_factors
    B = eigvecs[:, :K] * np.sqrt(eigvals[:K])    # (N, K)

    # Factor returns (time series): F = returns @ B / eigenvalues
    F = (returns @ eigvecs[:, :K]) / np.sqrt(eigvals[:K])  # (T, K)

    # Idiosyncratic covariance: diagonal of C - B*B'
    systematic_cov  = B @ B.T
    idio_var        = np.maximum(np.diag(C - systematic_cov), 1e-10)
    total_var       = np.diag(C)

    explained_var   = eigvals[:K] / eigvals.sum()
    cum_explained   = np.cumsum(explained_var)

    # Factor return statistics
    factor_vols = F.std(axis=0) * np.sqrt(252)    # annualised

    # Predicted vs idiosyncratic R^2 per asset
    r2_per_asset = 1 - idio_var / total_var

    return {
        "factor_loadings":    B.round(4).tolist(),         # (N, K)
        "factor_vols_annual": factor_vols.round(4).tolist(),
        "explained_var":      explained_var.round(4).tolist(),
        "cumulative_var":     cum_explained.round(4).tolist(),
        "idio_vol_annual":    (np.sqrt(idio_var * 252)).round(4).tolist(),
        "r2_per_asset":       r2_per_asset.round(4).tolist(),
        "n_factors":          K,
        "n_assets":           N,
        "n_obs":              T,
    }`,
    explanation:
      "The statistical factor model is the foundation of risk systems at quant funds: the K-factor covariance model B·Var(F)·B' + Diag(σ²_ε) compresses the full N×N covariance matrix (which needs T >> N for stable estimation) into 2KN + K(K+1)/2 parameters. The diagonal idiosyncratic covariance assumption (assets' residuals are uncorrelated after removing common factors) is a simplification that holds reasonably well for equity markets where most cross-asset correlation is driven by 3-5 macro factors — computing the residual covariance without diagonal restriction would defeat the purpose of the factor model.",
  },
  {
    id: "pyfin-20260615-b1-momentum-xsection",
    language: "python",
    tag: "finance",
    title: "Cross-sectional momentum — ranking, signal construction, and turnover",
    code: `import numpy as np
import pandas as pd

def cross_sectional_momentum(
    prices: pd.DataFrame,       # (T, N) price DataFrame, rows=dates, cols=assets
    lookback: int = 252,        # momentum lookback window (1 year)
    skip_last: int = 21,        # skip last month to avoid short-term reversal
    n_long: int = 20,           # number of top performers to go long
    n_short: int = 20,          # number of bottom performers to go short
    rebal_freq: int = 21,       # rebalance every 21 trading days
) -> dict:
    """
    Cross-sectional momentum: long top-N performers over [t-lookback, t-skip],
    short bottom-N performers, equal-weighted, rebalanced monthly.
    Universe: all assets with full price history.
    Signal: 12-1 month return (skip last month = skip_last days).
    """
    log_prices = np.log(prices.values)
    T, N = log_prices.shape
    dates = prices.index

    returns_daily = np.diff(log_prices, axis=0)     # (T-1, N) daily log returns

    port_rets = []
    rebal_dates = []

    for t in range(lookback + skip_last, T, rebal_freq):
        # Signal: return from t-lookback to t-skip_last (12-1 momentum)
        signal = log_prices[t - skip_last] - log_prices[t - lookback]  # (N,)

        # Rank assets: NaN handling via replacement
        valid    = np.isfinite(signal)
        sig_rank = np.full(N, np.nan)
        sig_rank[valid] = signal[valid].argsort().argsort()   # rank 0..n_valid-1

        n_valid = int(valid.sum())
        if n_valid < n_long + n_short:
            continue

        # Weights: equal long / equal short
        long_thresh  = n_valid - n_long
        short_thresh = n_short
        w = np.zeros(N)
        for i in range(N):
            if valid[i]:
                rank = sig_rank[i]
                if rank >= long_thresh:
                    w[i] = 1.0 / n_long    # long top performers
                elif rank < short_thresh:
                    w[i] = -1.0 / n_short  # short bottom performers

        # Holding period: next rebal_freq days
        hold_end = min(t + rebal_freq, T - 1)
        period_rets = returns_daily[t:hold_end] @ w   # (hold_period,)
        port_rets.extend(period_rets.tolist())
        rebal_dates.extend(dates[t+1:hold_end+1].tolist())

    port_rets = np.array(port_rets)
    ann = np.sqrt(252)

    return {
        "sharpe":          round(float(port_rets.mean() / (port_rets.std(ddof=1) + 1e-10) * ann), 4),
        "annual_return":   round(float(port_rets.mean() * 252), 4),
        "annual_vol":      round(float(port_rets.std(ddof=1) * ann), 4),
        "skewness":        round(float(pd.Series(port_rets).skew()), 4),
        "max_drawdown":    round(float((np.exp(np.cumsum(port_rets))
                                       / np.maximum.accumulate(np.exp(np.cumsum(port_rets))) - 1).min()), 4),
        "n_obs":           len(port_rets),
        "n_rebal":         len(port_rets) // rebal_freq,
        "turnover_est":    round(float(n_long + n_short) / N, 4),
    }`,
    explanation:
      "The 12-1 momentum specification (12-month return, skip last month) is the empirical standard from Jegadeesh and Titman (1993): the skip avoids the short-term reversal phenomenon where winners over the past 1 month tend to reverse in the next month due to bid-ask bounce and microstructure effects. Cross-sectional momentum has a theoretical Sharpe ratio around 0.5-0.8 annually in equities but exhibits significant crash risk: momentum crashes occur when prior losers quickly reverse (e.g., 2009 when beaten-down financial stocks rebounded 200%+), causing the long portfolio to underperform the short portfolio catastrophically.",
  },
  {
    id: "pyfin-20260615-b1-mean-variance",
    language: "python",
    tag: "finance",
    title: "Mean-variance efficient frontier — Markowitz optimisation with scipy",
    code: `import numpy as np
from scipy.optimize import minimize

def efficient_frontier(
    mu: np.ndarray,           # (N,) expected returns (annual)
    cov: np.ndarray,          # (N, N) covariance matrix (annual)
    n_points: int = 50,
    max_weight: float = 0.30, # maximum weight per asset
    min_weight: float = 0.0,  # long-only by default
) -> dict:
    """
    Trace the efficient frontier by minimising portfolio variance for each
    target return level between the minimum-variance and maximum-return portfolios.
    Uses sequential quadratic programming via scipy.optimize.minimize.
    """
    N = len(mu)

    def port_vol(w):
        return float(np.sqrt(w @ cov @ w))

    def port_ret(w):
        return float(mu @ w)

    # Constraints: weights sum to 1, return >= target
    base_constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]
    bounds = [(min_weight, max_weight)] * N

    # Minimum variance portfolio (no return constraint)
    res_mv = minimize(port_vol, np.full(N, 1.0/N), method="SLSQP",
                      bounds=bounds, constraints=base_constraints,
                      options={"ftol": 1e-12, "maxiter": 1000})
    w_mv   = res_mv.x
    ret_mv = port_ret(w_mv)

    # Maximum return portfolio (just maximise mu' w with weight constraints)
    ret_max = float((mu * max_weight).sum() + mu[mu < 0].sum() * (1 - N*max_weight))
    ret_max = port_ret(
        minimize(lambda w: -port_ret(w), np.full(N,1.0/N),
                 bounds=bounds, constraints=base_constraints,
                 method="SLSQP").x
    )

    # Trace frontier
    target_rets = np.linspace(ret_mv, ret_max * 0.999, n_points)
    frontier_vols = []
    frontier_rets = []
    frontier_weights = []

    for target in target_rets:
        cons = base_constraints + [
            {"type": "ineq", "fun": lambda w, t=target: port_ret(w) - t}
        ]
        res = minimize(port_vol, w_mv, method="SLSQP",
                       bounds=bounds, constraints=cons,
                       options={"ftol": 1e-12, "maxiter": 1000})
        if res.success:
            frontier_vols.append(port_vol(res.x))
            frontier_rets.append(port_ret(res.x))
            frontier_weights.append(res.x.round(4).tolist())

    # Maximum Sharpe ratio portfolio (tangency portfolio)
    rf = 0.03
    def neg_sharpe(w):
        r, v = port_ret(w), port_vol(w)
        return -(r - rf) / (v + 1e-10)

    res_tang = minimize(neg_sharpe, np.full(N, 1.0/N), method="SLSQP",
                        bounds=bounds, constraints=base_constraints,
                        options={"ftol": 1e-12, "maxiter": 1000})
    w_tang = res_tang.x

    return {
        "frontier_vols":     [round(v, 4) for v in frontier_vols],
        "frontier_rets":     [round(r, 4) for r in frontier_rets],
        "frontier_sharpes":  [round((r-rf)/v, 4) for r,v in zip(frontier_rets, frontier_vols)],
        "min_var_weights":   w_mv.round(4).tolist(),
        "min_var_vol":       round(port_vol(w_mv), 4),
        "min_var_ret":       round(ret_mv, 4),
        "tangency_weights":  w_tang.round(4).tolist(),
        "tangency_sharpe":   round(-float(res_tang.fun), 4),
        "tangency_vol":      round(port_vol(w_tang), 4),
    }`,
    explanation:
      "The efficient frontier is parameterised by the target return: for each target, the portfolio with minimum variance subject to achieving at least that return is found via quadratic programming. The tangency portfolio (maximum Sharpe) is the single portfolio on the frontier that lies on the capital market line — in theory, all rational mean-variance investors should hold the tangency portfolio plus the risk-free asset. In practice, the tangency portfolio is notoriously unstable: small changes in expected returns cause large weight changes because the optimisation amplifies estimation errors in μ, which is why robust alternatives (Ledoit-Wolf covariance + Black-Litterman returns) are preferred operationally.",
  },
];
