import type { Snippet } from "./types";

export const pythonFinanceSnippets20260614B1: Snippet[] = [
  {
    id: "pyfin-20260614-b1-svensson",
    language: "python",
    tag: "finance",
    title: "Svensson term structure — 6-parameter yield curve with two humps",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_yield(tau: np.ndarray, params: np.ndarray) -> np.ndarray:
    """
    Svensson (1994) extension of Nelson-Siegel:
    y(tau) = beta0
           + beta1 * f1(tau, lambda1)
           + beta2 * f2(tau, lambda1)
           + beta3 * f2(tau, lambda2)
    f1(tau, lam) = (1 - exp(-tau/lam)) / (tau/lam)     # slope loading
    f2(tau, lam) = f1 - exp(-tau/lam)                   # curvature loading
    beta0: long-run level; beta1: slope; beta2,beta3: two curvature humps.
    lambda1 < lambda2 allows two separate humps in the curve.
    """
    b0, b1, b2, b3, lam1, lam2 = params
    tau = np.maximum(tau, 1e-8)

    lt1, lt2 = tau / lam1, tau / lam2
    e1,  e2  = np.exp(-lt1), np.exp(-lt2)
    f1   = (1 - e1) / lt1
    f2_1 = f1 - e1
    f1_2 = (1 - e2) / lt2
    f2_2 = f1_2 - e2

    return b0 + b1*f1 + b2*f2_1 + b3*f2_2

def fit_svensson(tenors: np.ndarray, yields: np.ndarray) -> dict:
    """
    Fit Svensson via nonlinear least squares.
    6 free parameters; use multiple starting points to avoid local minima.
    """
    best_sse, best_params = np.inf, None

    for b0_init in [0.03, 0.05, 0.07]:
        for lam1_init in [1.0, 2.0]:
            for lam2_init in [3.0, 7.0]:
                x0 = np.array([b0_init, -0.02, 0.01, 0.005, lam1_init, lam2_init])
                bounds = [
                    (0.001, 0.20),   # beta0: long-run rate
                    (-0.15, 0.15),   # beta1: slope
                    (-0.15, 0.15),   # beta2: curvature 1
                    (-0.15, 0.15),   # beta3: curvature 2
                    (0.1, 5.0),      # lambda1
                    (0.5, 15.0),     # lambda2
                ]
                res = minimize(
                    lambda p: np.sum((svensson_yield(tenors, p) - yields)**2),
                    x0, method="L-BFGS-B", bounds=bounds,
                    options={"ftol": 1e-14, "maxiter": 5000}
                )
                if res.fun < best_sse:
                    best_sse   = res.fun
                    best_params = res.x

    fitted  = svensson_yield(tenors, best_params)
    rmse    = np.sqrt(best_sse / len(tenors))

    return {
        "beta0":  round(float(best_params[0]), 6),
        "beta1":  round(float(best_params[1]), 6),
        "beta2":  round(float(best_params[2]), 6),
        "beta3":  round(float(best_params[3]), 6),
        "lambda1": round(float(best_params[4]), 4),
        "lambda2": round(float(best_params[5]), 4),
        "rmse_bps": round(float(rmse * 10_000), 4),
        "fitted_yields": fitted.round(6).tolist(),
    }`,
    explanation:
      "Svensson adds a fourth term (beta3 × f2(tau, lambda2)) to Nelson-Siegel to capture the second hump that often appears in G10 sovereign curves — common in the EUR and GBP curves where ECB/BoE forward guidance creates a distinct short-end kink separate from the mid-curve hump. Multiple starting points are essential because the likelihood surface has many local minima when lambda1 and lambda2 are close, causing the two curvature factors to be nearly collinear.",
  },
  {
    id: "pyfin-20260614-b1-ou-calibration",
    language: "python",
    tag: "finance",
    title: "Ornstein-Uhlenbeck MLE calibration — mean reversion speed for pairs trading",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def fit_ou_mle(spread: np.ndarray, dt: float = 1/252) -> dict:
    """
    Ornstein-Uhlenbeck (OU) process: dX = kappa*(mu - X)*dt + sigma*dW
    Discrete exact transition: X_{t+1} | X_t ~ N(mu + (X_t - mu)*e^{-kappa*dt},
                                                   sigma^2*(1-e^{-2*kappa*dt})/(2*kappa))
    MLE via regression on the exact Gaussian transition density.
    Key output: kappa (mean reversion speed), half-life = ln(2)/kappa.
    """
    n   = len(spread) - 1
    x   = spread[:-1]    # X_t
    y   = spread[1:]     # X_{t+1}

    # For fixed kappa, closed-form MLE of mu and sigma^2
    def neg_log_likelihood(kappa):
        if kappa <= 0:
            return 1e10
        ek    = np.exp(-kappa * dt)
        ek2   = np.exp(-2 * kappa * dt)
        var_c = (1 - ek2) / (2 * kappa)   # conditional variance factor

        # OLS for mu: regress y on (1-ek) and ek*x
        # E[y | x] = mu*(1-ek) + ek*x
        A = np.column_stack([np.ones(n) * (1 - ek), ek * x])
        b_hat, _, _, _ = np.linalg.lstsq(A, y, rcond=None)
        mu_hat = b_hat[0]

        y_pred = mu_hat * (1 - ek) + ek * x
        resid  = y - y_pred
        sig2_c = float(np.mean(resid**2)) / var_c

        if sig2_c <= 0:
            return 1e10

        ll = -0.5 * n * (np.log(2 * np.pi) + np.log(sig2_c * var_c)
                         + np.mean(resid**2) / (sig2_c * var_c))
        return -float(ll)

    # Grid + local optimisation
    result = minimize_scalar(neg_log_likelihood, bounds=(0.001, 500.0), method="bounded")
    kappa  = float(result.x)
    ek     = np.exp(-kappa * dt)
    ek2    = np.exp(-2 * kappa * dt)
    var_c  = (1 - ek2) / (2 * kappa)

    A      = np.column_stack([np.ones(n) * (1 - ek), ek * x])
    b_hat, _, _, _ = np.linalg.lstsq(A, y, rcond=None)
    mu_hat = float(b_hat[0])
    y_pred = mu_hat * (1 - ek) + ek * x
    sig2_c = float(np.mean((y - y_pred)**2)) / var_c
    sigma  = np.sqrt(max(sig2_c, 0))

    return {
        "kappa":     round(kappa, 6),
        "mu":        round(mu_hat, 6),
        "sigma":     round(sigma, 6),
        "half_life_days": round(np.log(2) / kappa / dt, 2),
        "eq_vol":    round(sigma / np.sqrt(2 * kappa), 6),  # stationary std
        "converged": bool(result.success),
    }`,
    explanation:
      "The OU MLE uses the exact Gaussian transition density (not Euler approximation), so the parameter estimates are unbiased even for large dt — important for daily spreads where dt = 1/252 is not small. The half-life in calendar days (ln(2)/κ ÷ dt) is the primary signal quality metric for pairs trading: a 10-day half-life means the spread reverts halfway to equilibrium in 10 days, giving a viable mean-reversion signal; a 60+ day half-life indicates near-unit-root behaviour where reversion is too slow to be exploited.",
  },
  {
    id: "pyfin-20260614-b1-ledoit-wolf",
    language: "python",
    tag: "finance",
    title: "Ledoit-Wolf covariance shrinkage — analytical Oracle-approximating estimator",
    code: `import numpy as np

def ledoit_wolf_shrinkage(returns: np.ndarray) -> dict:
    """
    Ledoit-Wolf (2004) analytical shrinkage estimator:
    C_shrunk = (1 - alpha) * S + alpha * mu * I
    where S = sample covariance, mu = trace(S)/N (scaled identity target),
    and alpha is chosen to minimise expected Frobenius loss.
    Oracle-approximating: asymptotically optimal shrinkage intensity.
    Avoids the ill-conditioning of S when N > T (more assets than observations).
    """
    T, N = returns.shape
    mean_r = returns.mean(axis=0)
    R = returns - mean_r    # demeaned

    # Sample covariance
    S = (R.T @ R) / T

    # Ledoit-Wolf oracle: compute the analytical shrinkage intensity alpha*
    # (Ledoit-Wolf 2004 "A well-conditioned estimator for large-dimensional covariance matrices")
    tr_S  = np.trace(S)
    tr_S2 = np.trace(S @ S)

    # Frobenius norm squared of S
    frob_S2 = tr_S2

    # Estimate mu (target: scaled identity)
    mu_tgt = tr_S / N

    # Numerator and denominator of optimal alpha
    # delta = ||S - mu*I||_F^2 = tr(S^2) - 2*mu*tr(S) + N*mu^2
    delta = tr_S2 - 2 * mu_tgt * tr_S + N * mu_tgt**2

    # Beta: average squared Frobenius norm of each sample covariance observation
    beta_bar = 0.0
    for t in range(T):
        r = R[t:t+1]         # (1, N) row vector
        S_t = r.T @ r        # rank-1 outer product
        diff = S_t - S
        beta_bar += np.sum(diff**2)
    beta_bar /= T * T

    beta  = min(beta_bar, delta)      # clamp: alpha in [0, 1]
    alpha = beta / max(delta, 1e-14)  # optimal shrinkage intensity

    # Shrunk covariance
    C_shrunk = (1 - alpha) * S + alpha * mu_tgt * np.eye(N)

    # Effective condition number improvement
    eigvals_s  = np.linalg.eigvalsh(S)
    eigvals_sh = np.linalg.eigvalsh(C_shrunk)
    cond_sample   = float(eigvals_s[-1] / max(eigvals_s[0], 1e-10))
    cond_shrunk   = float(eigvals_sh[-1] / max(eigvals_sh[0], 1e-10))

    return {
        "alpha":          round(float(alpha), 6),
        "mu_target":      round(float(mu_tgt), 8),
        "cov_shrunk":     C_shrunk,
        "cov_sample":     S,
        "cond_sample":    round(float(cond_sample), 2),
        "cond_shrunk":    round(float(cond_shrunk), 2),
        "min_eigval_shrunk": round(float(eigvals_sh[0]), 8),
        "T": T, "N": N,
    }`,
    explanation:
      "Sample covariance matrices are ill-conditioned when T/N is small (fewer observations than assets): eigenvalues near zero cause portfolio weights to blow up in mean-variance optimisation, concentrating risk in statistical noise rather than true factor exposures. Ledoit-Wolf shrinkage pulls all eigenvalues toward their average (the scaled identity target), reducing the condition number from potentially 10⁶ to ~10² — the oracle-approximating formula computes the optimal shrinkage intensity from the data without any user-specified tuning parameter.",
  },
  {
    id: "pyfin-20260614-b1-heston-mc",
    language: "python",
    tag: "finance",
    title: "Heston MC — correlated variance and price paths with full-truncation",
    code: `import numpy as np
from scipy.stats import norm

def heston_mc(
    S0: float, K: float, r: float, T: float,
    kappa: float,   # mean reversion speed for variance
    theta: float,   # long-run variance
    xi: float,      # vol of vol
    rho: float,     # correlation S-V Brownians
    V0: float,      # initial variance
    n_steps: int = 200, n_paths: int = 50_000, seed: int = 42,
) -> dict:
    """
    Heston (1993): dS/S = r dt + sqrt(V) dW_S
                   dV   = kappa*(theta-V) dt + xi*sqrt(V) dW_V
    Full-truncation Euler: V_t = max(V_{t-1}, 0) inside sqrt and drift.
    Antithetic variates: negate both Z1, Z2 for the paired path.
    Feller condition: 2*kappa*theta > xi^2 (V never hits 0 a.s.).
    """
    rng = np.random.default_rng(seed)
    dt   = T / n_steps
    sdt  = np.sqrt(dt)
    disc = np.exp(-r * T)
    rho2 = np.sqrt(1 - rho**2)      # orthogonal Cholesky component

    paths = n_paths // 2             # antithetic pairs
    S = np.full(paths, S0)
    V = np.full(paths, V0)

    # Antithetic copies
    Sa = np.full(paths, S0)
    Va = np.full(paths, V0)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(paths)
        Z2 = rng.standard_normal(paths)
        dWs = Z1
        dWv = rho * Z1 + rho2 * Z2   # correlated

        Vt  = np.maximum(V,  0.0)    # full truncation: clamp before sqrt
        Vat = np.maximum(Va, 0.0)
        sV  = np.sqrt(Vt)
        sVa = np.sqrt(Vat)

        S  *= np.exp((r - 0.5*Vt)*dt  + sV  * sdt * dWs)
        Sa *= np.exp((r - 0.5*Vat)*dt + sVa * sdt * (-dWs))   # antithetic

        V   = np.maximum(V  + kappa*(theta - Vt) *dt + xi*sV *sdt* dWv,  0.0)
        Va  = np.maximum(Va + kappa*(theta - Vat)*dt + xi*sVa*sdt*(-dWv), 0.0)

    payoffs    = disc * np.maximum(S  - K, 0.0)
    payoffs_a  = disc * np.maximum(Sa - K, 0.0)
    all_pv     = np.concatenate([payoffs, payoffs_a])

    price = float(all_pv.mean())
    se    = float(all_pv.std(ddof=1) / np.sqrt(len(all_pv)))

    feller = 2 * kappa * theta > xi**2

    return {
        "price":        round(price, 6),
        "std_error":    round(se, 6),
        "ci_95_lo":     round(price - 1.96*se, 6),
        "ci_95_hi":     round(price + 1.96*se, 6),
        "feller_ok":    bool(feller),
        "n_paths":      n_paths,
    }`,
    explanation:
      "The full-truncation scheme (V+ = max(V, 0)) is preferred over reflection (|V|) for Heston because it more accurately preserves the stationary distribution of the variance process near zero — the reflection scheme overestimates the time the process spends near zero, inflating the short-dated vol surface. The Feller condition 2κθ > ξ² ensures V never reaches zero in continuous time, but even when satisfied, the Euler discretisation can produce negative values which must be handled by truncation or reflection.",
  },
  {
    id: "pyfin-20260614-b1-sabr-calibration",
    language: "python",
    tag: "finance",
    title: "SABR calibration — fit alpha, rho, nu to market vol smile (beta fixed)",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def sabr_black_vol(F: float, K: float, T: float,
                   alpha: float, beta: float, rho: float, nu: float) -> float:
    """Hagan (2002) SABR lognormal implied vol approximation."""
    if abs(F - K) < 1e-7:   # ATM
        Fb   = F ** (1 - beta)
        A    = alpha / Fb
        corr = 1 + T * (
            (1-beta)**2 * alpha**2 / (24 * Fb**2)
            + 0.25 * rho * beta * nu * alpha / Fb
            + (2 - 3*rho**2) * nu**2 / 24
        )
        return float(A * corr)
    log_fk = np.log(F / K)
    FKb2   = (F * K) ** ((1 - beta) / 2)
    z      = (nu / alpha) * FKb2 * log_fk
    sq     = np.sqrt(1 - 2*rho*z + z**2)
    xz     = np.log((sq + z - rho) / max(1 - rho, 1e-10))
    z_xz   = z / xz if abs(xz) > 1e-10 else 1.0
    b2     = (1 - beta)**2
    log2   = log_fk**2
    denom  = FKb2 * (1 + b2*log2/24 + b2**2*log2**2/1920)
    corr   = 1 + T * (
        b2 * alpha**2 / (24 * (F*K)**(1-beta))
        + 0.25 * rho * beta * nu * alpha / FKb2
        + (2 - 3*rho**2) * nu**2 / 24
    )
    return float((alpha / denom) * z_xz * corr)

def calibrate_sabr(
    F: float, T: float, beta: float,
    strikes: np.ndarray, market_vols: np.ndarray,  # market implied vols
) -> dict:
    """
    Fix beta (e.g., 0.5 for FX, 0.0 for rates, 1.0 for equity).
    Calibrate alpha, rho, nu via RMSE minimisation.
    alpha controls the ATM vol level; rho the skew; nu the smile curvature.
    """
    def objective(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        model_vols = np.array([
            sabr_black_vol(F, K, T, alpha, beta, rho, nu) for K in strikes
        ])
        return float(np.sum((model_vols - market_vols)**2))

    # Initial guess: alpha from ATM vol
    atm_idx = np.argmin(np.abs(strikes - F))
    atm_vol = market_vols[atm_idx]
    Fb = F ** (1 - beta)
    alpha0 = atm_vol * Fb

    x0 = [alpha0, -0.3, 0.5]
    bounds = [(1e-4, 2.0), (-0.999, 0.999), (1e-4, 3.0)]
    res = minimize(objective, x0, method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-14, "maxiter": 5000})

    alpha, rho, nu = res.x
    fitted_vols = np.array([
        sabr_black_vol(F, K, T, alpha, beta, rho, nu) for K in strikes
    ])
    rmse = np.sqrt(float(res.fun) / len(strikes))

    return {
        "alpha": round(float(alpha), 6),
        "beta":  round(float(beta),  4),
        "rho":   round(float(rho),   6),
        "nu":    round(float(nu),    6),
        "atm_vol":     round(float(sabr_black_vol(F, F, T, alpha, beta, rho, nu)), 6),
        "rmse_bps":    round(float(rmse * 10_000), 4),
        "fitted_vols": fitted_vols.round(6).tolist(),
        "converged":   bool(res.success),
    }`,
    explanation:
      "Beta is typically fixed based on the asset class convention before calibration because alpha and beta are nearly unidentifiable from market vol smiles — both control the ATM vol level, making the joint optimisation ill-conditioned. For FX options (beta=0.5, log-normal at ATM), rho controls the skew direction (negative rho → higher vols for lower strikes) and nu controls the smile curvature (higher nu → wider wings); these two parameters are identified from the ratio of OTM to ATM vol and the asymmetry of the smile respectively.",
  },
  {
    id: "pyfin-20260614-b1-pca-yield-curve",
    language: "python",
    tag: "finance",
    title: "PCA on yield curve — level, slope, curvature factor interpretation",
    code: `import numpy as np
import pandas as pd

def yield_curve_pca(
    yields_df: pd.DataFrame,   # rows=dates, columns=tenors (e.g., [0.25, 0.5, 1, 2, 5, 10, 30])
    n_factors: int = 3,
) -> dict:
    """
    PCA on daily yield curve changes (not levels, to ensure stationarity).
    Factor 1 (~90% variance): level — parallel shift across all maturities.
    Factor 2 (~7%): slope — short rates move opposite to long rates.
    Factor 3 (~2%): curvature — belly moves opposite to wings.
    DV01 of each factor: dollar change per unit factor shift.
    """
    # Use daily changes (first differences) for stationarity
    dY = yields_df.diff().dropna().values    # (T-1, N_tenors)
    T, N = dY.shape

    # Demean (changes already approximately centred at zero for rates)
    dY_centred = dY - dY.mean(axis=0)

    # PCA via SVD of the (T x N) matrix of changes
    U, s, Vt = np.linalg.svd(dY_centred, full_matrices=False)
    explained_var = s**2 / np.sum(s**2)

    # Loadings: rows of Vt (shape N_factors x N_tenors)
    loadings = Vt[:n_factors]   # (n_factors, N_tenors)

    # Sign convention: factor 1 should have positive loadings (level = rates up)
    for k in range(n_factors):
        if loadings[k].mean() < 0:
            loadings[k] *= -1
            U[:, k]     *= -1

    # Factor scores (T-1, n_factors): how much each factor moved each day
    factor_scores = U[:, :n_factors] * s[:n_factors]

    # Factor volatility (annualised, assuming 252 trading days)
    factor_vols = factor_scores.std(axis=0) * np.sqrt(252)

    # DV01 interpretation: loadings tell how much each tenor yield moves
    # per 1-std move in the factor score
    factor_std = factor_scores.std(axis=0)
    dv01_factors = loadings * factor_std[:, None]  # (n_factors, N_tenors)

    tenors = list(yields_df.columns)

    return {
        "loadings":           loadings.round(6).tolist(),
        "explained_var":      explained_var[:n_factors].round(4).tolist(),
        "cumulative_var":     np.cumsum(explained_var)[:n_factors].round(4).tolist(),
        "factor_vols_annual": factor_vols.round(4).tolist(),
        "factor_scores":      factor_scores.round(6).tolist(),
        "dv01_factors_bps":   (dv01_factors * 10_000).round(4).tolist(),
        "tenors":             tenors,
        "n_obs":              T,
        "factor_names":       ["Level", "Slope", "Curvature"][:n_factors],
    }`,
    explanation:
      "The three PCA factors of yield curves explain ~99% of all historical variation and correspond almost exactly to the Nelson-Siegel basis functions (level, slope, curvature) — this is not a coincidence but reflects the fact that yield curves are constrained by no-arbitrage to have smooth dynamics. The first factor (level shift, all tenors move the same direction) is driven by monetary policy expectations; the second (slope, steepening/flattening) by the term premium and recession expectations; the third (curvature, butterfly) by the shape of the forward rate curve between the short and long ends.",
  },
  {
    id: "pyfin-20260614-b1-almgren-chriss",
    language: "python",
    tag: "finance",
    title: "Almgren-Chriss optimal execution — VWAP-beating trajectory minimizing IS",
    code: `import numpy as np
from scipy.linalg import expm

def almgren_chriss(
    X0: float,         # total shares to execute
    T: float,          # execution horizon (days)
    N: int,            # number of time intervals
    sigma: float,      # daily vol of stock
    eta: float,        # temporary impact coefficient (linear)
    gamma: float,      # permanent impact coefficient
    risk_aversion: float = 1e-6,  # lambda: trade-off between risk and cost
) -> dict:
    """
    Almgren-Chriss (2001) optimal execution:
    min E[IS] + lambda * Var[IS]  subject to liquidating X0 shares in [0,T].
    IS = implementation shortfall = execution cost vs VWAP benchmark.
    Result: hyperbolic sine trajectory — front-loads execution when lambda is large.
    Closed-form trajectory for linear permanent + linear temporary impact.
    """
    tau = T / N             # length of each interval
    kappa2 = risk_aversion * sigma**2 / eta   # kappa^2 in Almgren notation

    kappa  = np.sqrt(kappa2)

    # Optimal trading trajectory x(t): shares remaining at time j*tau
    # x(j) = X0 * sinh(kappa*(T - j*tau)) / sinh(kappa*T)
    times   = np.linspace(0, T, N + 1)
    sinh_kT = np.sinh(kappa * T)

    remaining = X0 * np.sinh(kappa * (T - times)) / max(sinh_kT, 1e-10)
    remaining = np.maximum(remaining, 0.0)

    # Trade schedule: shares to sell in each interval
    trades = np.diff(-remaining)   # positive = shares sold

    # Expected cost (permanent impact + temporary impact per interval)
    # Expected IS = 0.5*gamma*X0^2 + eta/tau * sum(trades^2)
    perm_cost = 0.5 * gamma * X0**2
    temp_cost = float(np.sum(trades**2)) * eta / tau

    # Variance of IS = sigma^2 * sum(x(j)^2 * tau) — midpoint approximation
    variance  = sigma**2 * float(np.sum(remaining[:-1]**2)) * tau

    # Certainty equivalent cost = E[IS] + lambda * Var[IS]
    ce_cost   = perm_cost + temp_cost + risk_aversion * variance

    # VWAP comparison: equally-spaced trajectory
    vwap_trades = np.full(N, X0 / N)
    vwap_temp   = float(np.sum(vwap_trades**2)) * eta / tau
    vwap_var    = sigma**2 * float(np.sum(
        np.linspace(X0, 0, N)**2)) * tau

    return {
        "kappa":          round(float(kappa), 6),
        "remaining":      remaining.round(2).tolist(),
        "trades_schedule": trades.round(4).tolist(),
        "expected_IS_bp": round((perm_cost + temp_cost) / X0 * 10_000, 4),
        "variance_IS":    round(float(variance), 6),
        "ce_cost":        round(float(ce_cost), 4),
        "vwap_temp_cost": round(float(vwap_temp), 4),
        "is_vs_vwap":     round((temp_cost - vwap_temp) / vwap_temp * 100, 2),
    }`,
    explanation:
      "The Almgren-Chriss trajectory has a hyperbolic sine shape because the optimal control balances two opposing forces: the risk penalty (lambda × sigma² × integral(x²)) that pushes toward faster execution and the temporary impact penalty (eta × integral(trade²/tau)) that pushes toward slower execution. For risk-neutral investors (lambda → 0), the solution becomes VWAP (equal trading rate), while for risk-averse investors, the trajectory front-loads execution to reduce the variance of the unexecuted position.",
  },
  {
    id: "pyfin-20260614-b1-cvar-opt",
    language: "python",
    tag: "finance",
    title: "CVaR portfolio optimisation — linear programming formulation (Rockafellar-Uryasev)",
    code: `import numpy as np
from scipy.optimize import linprog

def cvar_portfolio(
    returns: np.ndarray,   # (T, N) historical return scenarios
    alpha: float = 0.95,   # confidence level
    max_weight: float = 0.30,  # maximum weight per asset
    min_return: float = None,  # optional minimum expected return constraint
) -> dict:
    """
    Rockafellar-Uryasev (2000): CVaR minimisation is a linear program.
    min_w,z,VaR  VaR + 1/(T*(1-alpha)) * sum_t max(loss_t - VaR, 0)
    where loss_t = -r_t' * w.
    LP formulation: introduce auxiliary variables z_t >= 0.
    Variables: [w_1..w_N, VaR, z_1..z_T]
    """
    T, N = returns.shape
    alpha_level = alpha

    # Portfolio loss for scenario t: L_t = -returns[t] @ w
    # z_t >= L_t - VaR, z_t >= 0
    # Minimise: VaR + 1/(T*(1-alpha)) * sum(z)

    # Variables: x = [w (N), var_val (1), z (T)]
    n_vars = N + 1 + T

    # Objective: min VaR + 1/(T*(1-alpha)) * sum(z)
    c = np.zeros(n_vars)
    c[N] = 1.0                              # coefficient on VaR
    c[N+1:] = 1.0 / (T * (1 - alpha_level))  # coefficients on z_t

    # Constraint: z_t >= -returns[t] @ w - VaR (i.e., -returns[t]@w - VaR - z_t <= 0)
    # Rewritten: -returns[t] @ w  - VaR - z_t <= 0
    A_ub = np.zeros((T, n_vars))
    A_ub[:, :N]     = -returns           # -r_t * w coefficient
    A_ub[:, N]      = -1.0              # -VaR
    A_ub[np.arange(T), N+1:] = -1.0    # -z_t
    b_ub = np.zeros(T)                   # RHS = 0

    # Budget constraint: sum(w) = 1
    A_eq = np.zeros((1, n_vars))
    A_eq[0, :N] = 1.0
    b_eq = np.array([1.0])

    # Bounds: 0 <= w <= max_weight; VaR free; z >= 0
    bounds = ([(0, max_weight)] * N +
              [(None, None)] +           # VaR: unbounded
              [(0, None)] * T)           # z_t >= 0

    # Optional minimum return constraint: returns.mean(0) @ w >= min_return
    if min_return is not None:
        ret_row = np.zeros(n_vars)
        ret_row[:N] = -returns.mean(axis=0)   # negate for <= form
        A_ub = np.vstack([A_ub, ret_row])
        b_ub = np.append(b_ub, -min_return)

    res = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                  bounds=bounds, method="highs")

    w     = res.x[:N]
    VaR   = float(res.x[N])
    CVaR  = float(res.fun)
    port_ret = float(returns.mean(axis=0) @ w)

    return {
        "weights":     w.round(6).tolist(),
        "VaR_pct":     round(-VaR * 100, 4),
        "CVaR_pct":    round(CVaR * 100, 4),
        "exp_return":  round(port_ret * 100, 4),
        "converged":   res.success,
    }`,
    explanation:
      "The key insight of Rockafellar-Uryasev (2000) is that CVaR minimisation, despite involving an expectation over the worst (1−α) tail scenarios, reduces to a linear program when the auxiliary variable z_t captures the exceedance above VaR — the max() function is linearised via z_t ≥ 0, z_t ≥ loss_t − VaR. This makes CVaR optimisation computationally equivalent to mean-variance, but with better tail-risk properties: CVaR is a coherent risk measure (satisfies sub-additivity) while VaR is not, so CVaR-optimal portfolios cannot exhibit the paradox where combining two risky positions increases measured risk.",
  },
  {
    id: "pyfin-20260614-b1-gaussian-copula",
    language: "python",
    tag: "finance",
    title: "Gaussian copula — joint default simulation for CDO pricing",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_defaults(
    n_obligors: int,
    default_probs: np.ndarray,   # (N,) marginal default probabilities
    correlation: float,           # single-factor correlation (rho)
    n_scenarios: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    Li (2000) Gaussian copula: the default time of obligor i is
    T_i = Q_i^{-1}(N(Y_i)), where Y_i = sqrt(rho)*M + sqrt(1-rho)*Z_i.
    M ~ N(0,1) is the common market factor; Z_i are idiosyncratic.
    Default occurs if Y_i < N^{-1}(PD_i) within the horizon.
    Used to price tranches of CDOs (Synthetic CDO, CLO).
    """
    rng = np.random.default_rng(seed)
    rho2 = np.sqrt(1 - correlation**2)

    # Default thresholds: N^{-1}(PD_i)
    thresholds = norm.ppf(default_probs)   # (N,)

    # Simulate common + idiosyncratic factors
    M  = rng.standard_normal(n_scenarios)   # (n_scenarios,) market factor
    Z  = rng.standard_normal((n_scenarios, n_obligors))  # idiosyncratic

    # Latent variable for each obligor in each scenario
    Y  = np.sqrt(correlation) * M[:, None] + rho2 * Z  # (n_scenarios, N)

    # Default indicator: 1 if Y_i < threshold_i
    defaults = (Y < thresholds[None, :]).astype(float)  # (n_scenarios, N)

    # Portfolio loss (assuming equal notional = 1, zero recovery)
    losses = defaults.sum(axis=1) / n_obligors   # (n_scenarios,) fractional loss

    # Tranche pricing: [0%, 3%] equity, [3%, 7%] mezzanine, [7%, 100%] senior
    tranches = [(0.00, 0.03), (0.03, 0.07), (0.07, 1.00)]
    tranche_losses = []
    for lo, hi in tranches:
        # Tranche loss = max(min(portfolio_loss, hi) - lo, 0)
        tl = np.maximum(np.minimum(losses, hi) - lo, 0) / (hi - lo)
        tranche_losses.append(round(float(tl.mean()), 6))

    # Portfolio loss distribution statistics
    cvar_99 = float(-np.percentile(-losses, 1))   # 99% CVaR
    var_99  = float(np.percentile(losses, 99))

    return {
        "expected_loss":    round(float(losses.mean()), 6),
        "loss_std":         round(float(losses.std()), 6),
        "var_99":           round(var_99, 6),
        "cvar_99":          round(cvar_99, 6),
        "equity_el":        tranche_losses[0],    # 0–3% tranche expected loss
        "mezz_el":          tranche_losses[1],    # 3–7%
        "senior_el":        tranche_losses[2],    # 7–100%
        "n_scenarios":      n_scenarios,
        "correlation":      correlation,
    }`,
    explanation:
      "The Gaussian copula became infamous after its widespread use in CDO pricing before 2008 underestimated the probability of simultaneous defaults — when correlation ρ is low, the copula implies defaults are nearly independent, but empirical data shows default correlations surge toward 1 during crises (correlation breakdown). The single-factor structure (one common market factor M) means all obligors share the same systematic risk driver; the tranche loss distribution is bimodal for high correlation (either very few defaults or almost all default), which concentrates tail risk in senior tranches that appeared safe under low-correlation assumptions.",
  },
  {
    id: "pyfin-20260614-b1-duration-convexity",
    language: "python",
    tag: "finance",
    title: "Bond duration and convexity — DV01, modified duration, and convexity hedge",
    code: `import numpy as np
from typing import Optional

def bond_analytics(
    face: float,
    coupon_rate: float,     # annual coupon rate (e.g., 0.05 for 5%)
    ytm: float,             # yield to maturity (annual, decimal)
    maturity: float,        # years to maturity
    freq: int = 2,          # coupon frequency per year (2 = semi-annual)
    settlement_days: float = 0.0,
) -> dict:
    """
    Compute bond price, duration, convexity, and DV01 from YTM.
    Modified duration: -dP/dy / P (interest rate sensitivity).
    Convexity: d^2P/dy^2 / P (curvature of price-yield curve).
    DV01: dollar value of 1 basis point move in yield.
    Convexity adjustment: dP/P ≈ -D_mod * dy + 0.5 * C * dy^2.
    """
    dt     = 1.0 / freq                  # period length in years
    n_per  = int(maturity * freq)        # total number of periods
    coupon = face * coupon_rate * dt     # payment per period

    # Periodic yield
    y_per  = ytm / freq

    # Cash flow times and amounts
    times  = np.arange(1, n_per + 1) * dt
    cfs    = np.full(n_per, coupon)
    cfs[-1] += face                      # add principal at maturity

    # Discount factors
    dfs    = 1 / (1 + y_per) ** (np.arange(1, n_per + 1))

    # Bond price
    price  = float(np.sum(cfs * dfs))

    # Macaulay duration: sum(t * PV(CF_t)) / P
    pvs    = cfs * dfs
    mac_dur = float(np.sum(times * pvs)) / price

    # Modified duration
    mod_dur = mac_dur / (1 + y_per)

    # Convexity: sum(t*(t+dt) * PV(CF_t)) / (P * (1+y_per)^2)
    convexity = float(np.sum(times * (times + dt) * pvs)) / (price * (1 + y_per)**2)

    # DV01: $ change per 1bp parallel shift
    dv01   = mod_dur * price * 1e-4

    # Price change approximation via duration + convexity
    def price_change_approx(dy: float) -> float:
        return -mod_dur * price * dy + 0.5 * convexity * price * dy**2

    return {
        "price":          round(price, 6),
        "ytm":            round(ytm, 6),
        "mac_duration":   round(mac_dur, 6),
        "mod_duration":   round(mod_dur, 6),
        "convexity":      round(convexity, 6),
        "dv01":           round(dv01, 6),
        "n_periods":      n_per,
        "dp_up_100bps":   round(price_change_approx(0.01), 4),   # +100bp
        "dp_dn_100bps":   round(price_change_approx(-0.01), 4),  # -100bp
    }`,
    explanation:
      "The difference between Macaulay and modified duration is exactly the compounding adjustment: Mac = Mod × (1 + y/freq), because Mac measures the weighted average time to receipt of cash flows while Mod measures the price sensitivity per unit yield change. Convexity is always positive for option-free bonds, meaning the price-yield relationship is concave — a 100bp rate rise causes less price loss than a 100bp rate fall causes price gain. This asymmetry is valuable: long-duration bonds benefit from convexity in both directions, which is why bond traders buy convexity (pay up for it via lower yields) in uncertain rate environments.",
  },
  {
    id: "pyfin-20260614-b1-dupire-local-vol",
    language: "python",
    tag: "finance",
    title: "Dupire local vol extraction — numerically stable finite differences on call grid",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, q, sigma, T):
    if T <= 0 or sigma <= 0:
        return max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return float(S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2))

def dupire_local_vol_surface(
    S: float, r: float, q: float,
    strikes: np.ndarray,    # (N_K,)
    expiries: np.ndarray,   # (N_T,)
    iv_surface: np.ndarray, # (N_T, N_K) implied vol surface
) -> np.ndarray:
    """
    Dupire (1994): sigma_loc^2(K,T) = (dC/dT + (r-q)*K*dC/dK + q*C)
                                      / (0.5 * K^2 * d^2C/dK^2)
    Compute call prices from IV surface, then apply centred FD.
    Returns local vol surface of shape (N_T-2, N_K-2) on interior grid.
    """
    NT, NK = iv_surface.shape
    # Compute call prices
    C = np.zeros((NT, NK))
    for i in range(NT):
        for j in range(NK):
            C[i, j] = bs_call(S, strikes[j], r, q, iv_surface[i, j], expiries[i])

    lv = np.zeros((NT - 2, NK - 2))

    for i in range(1, NT - 1):
        T   = expiries[i]
        dT  = 0.5 * (expiries[i+1] - expiries[i-1])
        for j in range(1, NK - 1):
            K  = strikes[j]
            dK = 0.5 * (strikes[j+1] - strikes[j-1])

            dC_dT   = (C[i+1, j] - C[i-1, j]) / (2 * dT)
            dC_dK   = (C[i, j+1] - C[i, j-1]) / (2 * dK)
            d2C_dK2 = (C[i, j+1] - 2*C[i, j] + C[i, j-1]) / dK**2

            numer = dC_dT + (r - q) * K * dC_dK + q * C[i, j]
            denom = 0.5 * K**2 * d2C_dK2

            lv_sq = numer / denom if abs(denom) > 1e-10 else 0.0
            lv[i-1, j-1] = np.sqrt(max(lv_sq, 0.0))

    return lv`,
    explanation:
      "The local vol surface is the unique Markovian diffusion model consistent with all market call prices, making it the standard tool for exotic option pricing when the skew must be matched exactly. However, Dupire's formula amplifies noise in the call price surface: the second derivative d²C/dK² in the denominator magnifies small pricing errors and interpolation artefacts, which is why the call price surface must be smoothed (via parametric IV models like SABR or splines) before applying the Dupire formula numerically.",
  },
  {
    id: "pyfin-20260614-b1-dual-autodiff",
    language: "python",
    tag: "finance",
    title: "Dual number automatic differentiation — exact Greeks without finite differences",
    code: `import math

class Dual:
    """
    Dual number: x + eps*dx where eps^2 = 0.
    Forward-mode automatic differentiation: compute f(x) and f'(x) simultaneously.
    No finite difference approximation errors, no step-size tuning.
    Extends to higher-order by nesting Dual objects.
    """
    __slots__ = ("val", "dot")

    def __init__(self, val: float, dot: float = 0.0):
        self.val = float(val)
        self.dot = float(dot)

    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.dot + o.dot)
    __radd__ = __add__

    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val,
                    self.dot * o.val + self.val * o.dot)
    __rmul__ = __mul__

    def __sub__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val - o.val, self.dot - o.dot)

    def __rsub__(self, o):
        return Dual(o) - self

    def __truediv__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val / o.val,
                    (self.dot*o.val - self.val*o.dot) / (o.val**2))

    def __neg__(self):
        return Dual(-self.val, -self.dot)


# Overloaded math functions for Dual
def d_exp(x): return Dual(math.exp(x.val), x.dot * math.exp(x.val))
def d_log(x): return Dual(math.log(x.val), x.dot / x.val)
def d_sqrt(x): s = math.sqrt(x.val); return Dual(s, x.dot / (2*s))
def d_erfc(x): # erfc'(x) = -2/sqrt(pi) * exp(-x^2)
    return Dual(math.erfc(x.val),
                x.dot * (-2 / math.sqrt(math.pi)) * math.exp(-x.val**2))


def bs_call_dual(S_d, K: float, r: float, q: float, sigma: float, T: float) -> Dual:
    """BS call with Dual spot — returns (price, dPrice/dS = delta)."""
    sqT  = Dual(math.sqrt(T))
    sig  = Dual(sigma)
    rT   = math.exp(-r * T)
    qT   = math.exp(-q * T)
    logSK = d_log(S_d / K)
    d1   = (logSK + Dual((r - q + 0.5*sigma**2)*T)) / Dual(sigma * math.sqrt(T))
    d2   = d1 - Dual(sigma * math.sqrt(T))
    phi1 = Dual(0.5) * (Dual(1.0) - d_erfc(d1 * Dual(1/math.sqrt(2))))
    phi2 = Dual(0.5) * (Dual(1.0) - d_erfc(d2 * Dual(1/math.sqrt(2))))
    return S_d * Dual(qT) * phi1 - Dual(K * rT) * phi2


# Usage: exact delta and gamma via one pass
S_dual = Dual(100.0, 1.0)   # dS/dS = 1 (seed the derivative)
result = bs_call_dual(S_dual, K=100.0, r=0.05, q=0.0, sigma=0.20, T=1.0)
print(f"Price: {result.val:.6f}, Delta: {result.dot:.6f}")`,
    explanation:
      "Forward-mode automatic differentiation propagates exact derivatives by augmenting each real number with an infinitesimal component (the dual part), exploiting the chain rule mechanically without numerical approximation. For Black-Scholes, delta via dual numbers is computed in exactly one extra operation per arithmetic instruction, versus three BS evaluations for a centred finite difference — more importantly, the result is exact (no truncation error), which matters when computing gamma (the second derivative) where finite differences have O(h) error and can fail for deep OTM options with near-zero vega.",
  },
  {
    id: "pyfin-20260614-b1-vpin",
    language: "python",
    tag: "finance",
    title: "VPIN — volume-synchronized probability of informed trading",
    code: `import numpy as np
import pandas as pd

def classify_trades_bulk(
    price: np.ndarray,
    volume: np.ndarray,
    method: str = "tick",   # "tick" = Lee-Ready tick test; "quote" requires quote data
) -> np.ndarray:
    """
    Classify each trade as buyer- or seller-initiated.
    Tick test: buy if price_t > price_{t-1}, sell if price_t < price_{t-1}.
    Returns +1 for buys, -1 for sells.
    """
    signs = np.sign(np.diff(price, prepend=price[0]))
    # Fill zeros (same-price trades) by carrying forward last sign
    for i in range(len(signs)):
        if signs[i] == 0 and i > 0:
            signs[i] = signs[i-1]
    signs[signs == 0] = 1   # default to buy if no prior trade
    return signs.astype(float)

def compute_vpin(
    price: np.ndarray,
    volume: np.ndarray,
    bucket_size: float = None,   # volume per bucket (default: mean hourly vol)
    n_buckets: int = 50,         # number of buckets in rolling window
) -> dict:
    """
    VPIN (Easley et al. 2012): volume-synchronized probability of informed trading.
    1. Divide trade flow into equal-volume buckets.
    2. In each bucket: V_B = buy volume, V_S = sell volume.
    3. VPIN = mean |V_B - V_S| / V_bucket  over last n_buckets.
    High VPIN > 0.5 signals elevated toxic order flow (informed trading).
    """
    total_vol = float(np.sum(volume))
    if bucket_size is None:
        bucket_size = total_vol / max(len(volume) / 10, 1.0)

    signs = classify_trades_bulk(price, volume)
    buy_vol  = volume * (signs > 0)
    sell_vol = volume * (signs < 0)

    # Divide into equal-volume buckets
    vb_list, vs_list = [], []
    cum_vol = np.cumsum(volume)
    bucket_idx = 0
    vb = vs = 0.0
    for i in range(len(volume)):
        vb += buy_vol[i]
        vs += sell_vol[i]
        while (vb + vs) >= bucket_size and bucket_idx < int(total_vol / bucket_size):
            # Assign fractional last trade to complete the bucket
            excess = (vb + vs) - bucket_size
            vb_list.append(vb - max(buy_vol[i], 0) * excess / max(volume[i], 1e-8))
            vs_list.append(vs - max(sell_vol[i], 0) * excess / max(volume[i], 1e-8))
            vb = max(buy_vol[i], 0) * excess / max(volume[i], 1e-8)
            vs = max(sell_vol[i], 0) * excess / max(volume[i], 1e-8)
            bucket_idx += 1

    if len(vb_list) < n_buckets:
        return {"vpin": float("nan"), "n_buckets": len(vb_list)}

    vb_arr = np.array(vb_list)
    vs_arr = np.array(vs_list)
    oi     = np.abs(vb_arr - vs_arr) / bucket_size
    vpin   = float(oi[-n_buckets:].mean())

    return {
        "vpin":        round(vpin, 6),
        "n_buckets":   len(vb_list),
        "mean_oi":     round(float(oi.mean()), 6),
        "max_oi":      round(float(oi.max()), 6),
        "bucket_size": round(bucket_size, 0),
    }`,
    explanation:
      "VPIN uses volume time (equal-volume buckets) rather than clock time because informed traders execute in proportion to total market activity — normalising by bucket volume makes the order imbalance measure comparable across different market regimes. A VPIN above 0.5 suggests more than half the order flow is directional (informed), which historically precedes large price moves and flash crashes — it spiked to 0.69 one hour before the 2010 Flash Crash (Easley et al. 2012). Exchanges use VPIN-like measures to trigger circuit breakers before market disruption occurs.",
  },
  {
    id: "pyfin-20260614-b1-black-model",
    language: "python",
    tag: "finance",
    title: "Black model — caps, floors, and swaption pricing in rate markets",
    code: `import numpy as np
from scipy.stats import norm

def black76_call(F: float, K: float, r: float, T: float, sigma: float) -> float:
    """
    Black (1976) model: option on futures/forward.
    C = e^{-rT} [F*N(d1) - K*N(d2)]
    d1 = (ln(F/K) + 0.5*sigma^2*T) / (sigma*sqrt(T))
    """
    if T <= 0 or sigma <= 0:
        return max(F - K, 0.0) * np.exp(-r*T)
    sqT = np.sqrt(T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return float(np.exp(-r*T) * (F*norm.cdf(d1) - K*norm.cdf(d2)))

def black76_put(F: float, K: float, r: float, T: float, sigma: float) -> float:
    if T <= 0 or sigma <= 0:
        return max(K - F, 0.0) * np.exp(-r*T)
    sqT = np.sqrt(T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return float(np.exp(-r*T) * (K*norm.cdf(-d2) - F*norm.cdf(-d1)))

def price_cap(
    notional: float,
    strike_rate: float,      # cap strike (e.g., 0.05 = 5%)
    forward_rates: list,     # LIBOR/SOFR forwards per period
    discount_factors: list,  # discount factors per payment date
    vol: float,              # flat cap vol (or per-caplet vol)
    tenors: list,            # period lengths (years)
    option_expiries: list,   # time to each caplet fixing
) -> dict:
    """
    Interest rate cap = sum of caplets.
    Caplet payoff: notional * max(L_i - K, 0) * delta_i, paid at end of period.
    Black model for each caplet: discount factor * Black76_call(F=forward, K=strike).
    """
    caplet_pvs = []
    for F, df, delta, T_fix in zip(forward_rates, discount_factors,
                                    tenors, option_expiries):
        caplet_notional = notional * delta
        caplet_pv = caplet_notional * df * black76_call(F, strike_rate, 0.0, T_fix, vol)
        caplet_pvs.append(caplet_pv)

    cap_pv  = sum(caplet_pvs)
    floor_pv = sum(
        notional * delta * df * max(strike_rate - F, 0.0)
        for F, df, delta in zip(forward_rates, discount_factors, tenors)
    )  # simplified floor (approximate)

    return {
        "cap_pv":       round(cap_pv, 4),
        "caplet_pvs":   [round(v, 4) for v in caplet_pvs],
        "n_caplets":    len(caplet_pvs),
        "atm_fwd":      round(float(np.mean(forward_rates)), 4),
        "total_tenor":  round(sum(tenors), 2),
    }`,
    explanation:
      "The Black (1976) model is to interest rate options what Black-Scholes is to equity options, but the underlying is the LIBOR forward rate (which is lognormal under Black's assumption) rather than the stock price. A cap is decomposed into a sum of independent caplets because each caplet pays on a specific LIBOR fixing — this decomposition is exact only under Black's flat vol assumption; in reality, cap vol surfaces exhibit humps and smiles that require the SABR or HW model per caplet. The put-call parity for rate options is the cap-floor parity: Cap − Floor = Swap NPV (the fixed-rate payer swap).",
  },
  {
    id: "pyfin-20260614-b1-swap-bootstrap",
    language: "python",
    tag: "finance",
    title: "Swap curve bootstrap — discount factors from par swap rates",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_swap_curve(
    par_rates: dict,   # {tenor_years: par_swap_rate}, e.g. {1: 0.04, 2: 0.042, ...}
    freq: int = 2,     # coupon frequency (2 = semi-annual)
    day_count: float = 365.25,
) -> dict:
    """
    Bootstrap discount factor curve from par swap rates.
    Par swap: NPV = 0 when fixed rate = par rate.
    P(0, T_n) = (1 - par * sum_{i<n} delta_i * P(0, T_i))
                / (1 + par * delta_n)
    Sequential: solve for P(0, T_n) given all prior discount factors.
    Output: discount factors, zero rates, and forward rates.
    """
    dt      = 1.0 / freq    # coupon period
    dfs     = {}             # {tenor: discount_factor}
    dfs[0.0] = 1.0

    # Sort tenors
    tenors_sorted = sorted(par_rates.keys())

    for T in tenors_sorted:
        par = par_rates[T]
        coupon_dates = np.arange(dt, T + 1e-9, dt)

        # Sum of already-known discount factors times coupon
        annuity_known = sum(
            dt * dfs[t] for t in coupon_dates[:-1] if t in dfs
        )

        # Solve for P(0, T) where the full annuity satisfies par-swap = 0
        # par * (annuity_known + dt * df_T) + df_T = 1
        # => df_T * (1 + par * dt) = 1 - par * annuity_known
        df_T = (1.0 - par * annuity_known) / (1.0 + par * dt)

        # Handle missing intermediate tenors via linear interpolation in log space
        prev_T = max((t for t in dfs if t < T), default=0.0)
        if len(coupon_dates) > 1:
            # Fill intermediate coupon dates by log-linear interpolation
            for t in coupon_dates[:-1]:
                if t not in dfs:
                    frac = (t - prev_T) / (T - prev_T)
                    dfs[t] = dfs[prev_T] ** (1 - frac) * df_T ** frac

        dfs[T] = max(df_T, 1e-10)

    # Compute zero rates and forward rates
    tenor_grid  = sorted(t for t in dfs if t > 0)
    zero_rates  = {t: -np.log(dfs[t]) / t for t in tenor_grid}
    fwd_rates   = {}
    for i in range(1, len(tenor_grid)):
        t0, t1  = tenor_grid[i-1], tenor_grid[i]
        fwd_rates[(t0, t1)] = -np.log(dfs[t1] / dfs[t0]) / (t1 - t0)

    return {
        "discount_factors": {round(t, 4): round(v, 8) for t, v in sorted(dfs.items()) if t > 0},
        "zero_rates":       {round(t, 4): round(v, 6) for t, v in zero_rates.items()},
        "fwd_rates":        {str((round(t0,2), round(t1,2))): round(v, 6)
                             for (t0, t1), v in fwd_rates.items()},
    }`,
    explanation:
      "Swap curve bootstrapping is the foundational calculation in rates desks: the resulting discount factors are used to price all interest rate derivatives, from vanilla swaps to complex structured products. The sequential formula (P(0,Tn) = (1 − par × annuity) / (1 + par × dt)) is an exact closed form only when all coupon dates up to Tn have known discount factors — missing intermediate tenors (e.g., quarterly coupons between semi-annual market quotes) must be interpolated, and the choice of interpolation method (log-linear in discount factors = linear in forward rates) affects the smoothness of the implied forward rate curve.",
  },
  {
    id: "pyfin-20260614-b1-control-variate",
    language: "python",
    tag: "finance",
    title: "Control variate MC — geometric Asian as CV for arithmetic Asian option",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_call_exact(S: float, K: float, r: float, sigma: float,
                                T: float, N: int) -> float:
    """
    Closed-form price of discrete geometric-average Asian call.
    Geometric average of GBM is log-normal with adjusted drift and vol.
    """
    dt       = T / N
    sigma_g  = sigma * np.sqrt((N+1)*(2*N+1)/(6*N*N))
    mu_g     = (r - 0.5*sigma**2)*(N+1)/(2*N) + 0.5*sigma_g**2
    F_g      = S * np.exp(mu_g * T)      # geometric forward
    sqT      = np.sqrt(T)
    d1       = (np.log(F_g / K) + 0.5*sigma_g**2*T) / (sigma_g*sqT)
    d2       = d1 - sigma_g * sqT
    return float(np.exp(-r*T) * (F_g*norm.cdf(d1) - K*norm.cdf(d2)))

def asian_call_mc_cv(
    S0: float, K: float, r: float, sigma: float, T: float,
    N: int = 50, n_paths: int = 50_000, seed: int = 42,
) -> dict:
    """
    Control variate MC for arithmetic Asian call using geometric Asian as CV.
    Payoff: max(arithmetic_average - K, 0)
    CV payoff: max(geometric_average - K, 0)  [closed-form known]
    Estimator: C_arith ≈ C_arith_MC - beta*(C_geom_MC - C_geom_exact)
    beta ≈ 1 (high correlation between arithmetic and geometric payoffs).
    Variance reduction: typically 90-99% for near-ATM options.
    """
    rng    = np.random.default_rng(seed)
    dt     = T / N
    disc   = np.exp(-r * T)
    drift  = (r - 0.5*sigma**2) * dt
    vol    = sigma * np.sqrt(dt)

    # Simulate paths
    Z   = rng.standard_normal((n_paths, N))
    log_S = np.log(S0) + np.cumsum(drift + vol*Z, axis=1)
    S_paths = np.exp(log_S)   # (n_paths, N) — prices at each step

    # Payoffs
    arith_avg = S_paths.mean(axis=1)
    geom_avg  = np.exp(np.log(S_paths).mean(axis=1))

    C_arith_raw = disc * np.maximum(arith_avg - K, 0)
    C_geom_mc   = disc * np.maximum(geom_avg  - K, 0)

    # Control variate: known closed form
    C_geom_exact = geometric_asian_call_exact(S0, K, r, sigma, T, N)

    # Optimal beta: Cov(arith, geom) / Var(geom)
    cov  = np.cov(C_arith_raw, C_geom_mc)
    beta = cov[0, 1] / max(cov[1, 1], 1e-14)

    # CV-adjusted estimator
    C_cv = C_arith_raw - beta * (C_geom_mc - C_geom_exact)

    price_raw = float(C_arith_raw.mean())
    price_cv  = float(C_cv.mean())
    se_raw    = float(C_arith_raw.std(ddof=1) / np.sqrt(n_paths))
    se_cv     = float(C_cv.std(ddof=1) / np.sqrt(n_paths))

    return {
        "price_cv":      round(price_cv, 6),
        "price_raw":     round(price_raw, 6),
        "se_raw":        round(se_raw, 6),
        "se_cv":         round(se_cv, 6),
        "variance_reduction": round((1 - (se_cv/se_raw)**2) * 100, 2),
        "beta":          round(float(beta), 4),
        "geom_exact":    round(C_geom_exact, 6),
    }`,
    explanation:
      "The geometric Asian is the ideal control variate for the arithmetic Asian because the two payoffs are nearly perfectly correlated (typically ρ > 0.99 for N ≥ 10), so the CV adjustment removes ~99% of the Monte Carlo variance while leaving the expected payoff unchanged. The optimal beta (Cov/Var) turns out to be close to 1 because the arithmetic average always exceeds the geometric average by a small convexity correction — both averages respond almost identically to each simulated path's direction of drift.",
  },
  {
    id: "pyfin-20260614-b1-importance-sampling",
    language: "python",
    tag: "finance",
    title: "Importance sampling — efficient MC for deep OTM options via drift shifting",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_price(S, K, r, sigma, T):
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return float(S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2))

def is_call_mc(
    S0: float, K: float, r: float, sigma: float, T: float,
    n_paths: int = 100_000, seed: int = 42,
) -> dict:
    """
    Importance sampling for deep OTM European call via optimal drift shift.
    Standard MC: most paths produce zero payoff — high variance estimator.
    IS: shift the drift so the terminal distribution is centred at K (the barrier).
    Optimal shift: mu* = ln(K/S0) / (sigma*sqrt(T)) - 0.5*sigma*sqrt(T)
    Likelihood ratio (Radon-Nikodym): e^{-theta*Z - 0.5*theta^2}
    where theta = optimal shift in Z-space.
    """
    rng  = np.random.default_rng(seed)
    disc = np.exp(-r * T)

    # Target: drift so that E[S_T] under IS measure is centred at K
    log_ratio = np.log(K / S0)
    mu_is     = log_ratio / (sigma * np.sqrt(T))   # IS drift for the standard normal

    # Optimal theta (shift in standard normal space)
    # Under IS: Z ~ N(theta, 1) instead of N(0,1)
    theta = mu_is - (r - 0.5*sigma**2)*np.sqrt(T) / sigma

    # --- Standard MC ---
    Z_std    = rng.standard_normal(n_paths)
    S_std    = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_std)
    pay_std  = disc * np.maximum(S_std - K, 0.0)
    price_mc = float(pay_std.mean())
    se_mc    = float(pay_std.std(ddof=1) / np.sqrt(n_paths))

    # --- Importance Sampling MC ---
    Z_is     = rng.standard_normal(n_paths) + theta  # shift distribution
    S_is     = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_is)
    payoff   = np.maximum(S_is - K, 0.0)
    # Likelihood ratio: dP/dQ = e^{-theta*Z_is + 0.5*theta^2}
    lr       = np.exp(-theta * Z_is + 0.5 * theta**2)
    pay_is   = disc * payoff * lr
    price_is = float(pay_is.mean())
    se_is    = float(pay_is.std(ddof=1) / np.sqrt(n_paths))

    exact    = bs_call_price(S0, K, r, sigma, T)

    return {
        "exact":             round(exact, 8),
        "price_mc":          round(price_mc, 8),
        "se_mc":             round(se_mc, 8),
        "price_is":          round(price_is, 8),
        "se_is":             round(se_is, 8),
        "variance_reduction": round((1 - (se_is / max(se_mc, 1e-15))**2)*100, 2),
        "theta":             round(float(theta), 4),
    }`,
    explanation:
      "For a 3-standard-deviation OTM call option (S=100, K=130, T=1, σ=20%), the standard MC with 100k paths might have only 1-5 in-the-money paths, giving a relative standard error of 90%+. Importance sampling shifts the simulation measure so that terminal stock prices cluster near the strike, then corrects for the distributional shift via the likelihood ratio — this reduces the relative standard error by 10-100× for deep OTM options without any bias. The optimal theta is exactly the drift required to centre the distribution at ln(K), which is the saddle-point of the payoff's exponential family.",
  },
  {
    id: "pyfin-20260614-b1-evt-gpd",
    language: "python",
    tag: "finance",
    title: "Extreme value theory — GPD tail fitting for portfolio tail risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(
    losses: np.ndarray,    # daily portfolio losses (positive = loss)
    threshold_pct: float = 0.90,  # fit GPD to losses above this percentile
) -> dict:
    """
    Peaks-over-threshold (POT) method: fit a Generalised Pareto Distribution (GPD)
    to losses exceeding a threshold u.
    GPD: F(x; xi, sigma) = 1 - (1 + xi*(x-u)/sigma)^{-1/xi}   for xi != 0
    xi > 0: heavy tail (Frechet); xi = 0: exponential; xi < 0: bounded tail.
    For financial returns: xi typically 0.2-0.4 (fat Pareto tail).
    VaR and CVaR at extreme levels (99.9%+) via GPD extrapolation.
    """
    u       = np.percentile(losses, threshold_pct * 100)
    excesses = losses[losses > u] - u   # losses above threshold

    n_u = len(excesses)
    n   = len(losses)

    if n_u < 20:
        return {"error": "Insufficient tail observations", "threshold": u}

    # MLE for GPD parameters via scipy
    xi_hat, _, sigma_hat = genpareto.fit(excesses, floc=0)

    # EVT-based VaR and CVaR
    def var_gpd(alpha: float) -> float:
        """VaR at confidence level alpha via GPD extrapolation."""
        # P(loss > x) = (n_u/n) * (1 + xi*(x-u)/sigma)^{-1/xi}
        # Solve for x: alpha = 1 - P(loss > x)
        p_tail = (1 - alpha) * n / n_u
        if xi_hat == 0:
            return u - sigma_hat * np.log(p_tail)
        return u + sigma_hat / xi_hat * (p_tail**(-xi_hat) - 1)

    def cvar_gpd(alpha: float) -> float:
        """CVaR at confidence level alpha (analytical for GPD)."""
        v = var_gpd(alpha)
        if xi_hat >= 1:
            return np.inf   # CVaR undefined for xi >= 1
        beta_eff = sigma_hat + xi_hat * (v - u)
        return (v + beta_eff / (1 - xi_hat))

    return {
        "threshold_u":    round(float(u), 6),
        "n_exceedances":  n_u,
        "n_total":        n,
        "xi":             round(float(xi_hat), 4),     # shape: >0 = fat tail
        "sigma":          round(float(sigma_hat), 6),  # scale
        "var_99":         round(var_gpd(0.99), 6),
        "var_999":        round(var_gpd(0.999), 6),
        "cvar_99":        round(cvar_gpd(0.99), 6),
        "cvar_999":       round(cvar_gpd(0.999), 6),
        "hist_var_99":    round(float(np.percentile(losses, 99)), 6),
        "tail_exponent":  round(float(1 / max(xi_hat, 1e-6)), 2),  # alpha = 1/xi
    }`,
    explanation:
      "The GPD tail extrapolation is essential for extreme risk quantification because historical simulation at 99.9% VaR requires at least 1000 observations to have one data point in the tail — a 10-year daily history provides only 2520 observations and a single 99.9% VaR estimate. The shape parameter ξ determines the tail heaviness: for equity indices ξ ≈ 0.2-0.3 (Pareto tail with exponent α = 1/ξ ≈ 4), meaning the fourth moment is finite but the fifth is not — consistent with empirical kurtosis of 3-6 in daily returns.",
  },
  {
    id: "pyfin-20260614-b1-carry-factor",
    language: "python",
    tag: "finance",
    title: "Carry factor — FX and fixed income carry portfolio construction",
    code: `import numpy as np
import pandas as pd

def fx_carry_portfolio(
    spot_rates: pd.DataFrame,      # (T, N_ccy) spot rates vs USD
    forward_rates: pd.DataFrame,   # (T, N_ccy) 1-month forward rates
    n_long: int = 3,               # number of high-carry currencies to go long
    n_short: int = 3,              # number of low-carry currencies to go short
) -> dict:
    """
    FX Carry: go long high-interest-rate currencies, short low-rate currencies.
    Carry proxy: (forward - spot) / spot — negative carry = high interest rate
    (covered interest parity: F/S = (1+r_d)/(1+r_f) ≈ 1 + (r_d - r_f)).
    Rebalance monthly; equal weight within long/short legs.
    """
    # Carry proxy: (F - S) / S. Positive = USD has higher rates (go long foreign)
    carry = (forward_rates - spot_rates) / spot_rates

    currencies = list(spot_rates.columns)
    T = len(spot_rates)

    # Monthly returns from FX spot changes
    # r_t = S_{t+1}/S_t - 1  (long = receive foreign, short = receive USD)
    spot_returns = spot_rates.pct_change().shift(-1)  # (T, N): forward return

    portfolio_returns = []
    dates = []

    for t in range(T - 1):
        c_row = carry.iloc[t].sort_values()
        # Short: lowest carry (highest foreign interest, worst for USD longs)
        # Long: highest carry (lowest foreign interest, best for USD longs)
        short_ccys = c_row.index[:n_short].tolist()
        long_ccys  = c_row.index[-n_long:].tolist()

        ret_row = spot_returns.iloc[t]
        long_ret  = ret_row[long_ccys].mean()
        short_ret = ret_row[short_ccys].mean()

        # Long foreign (gain when foreign appreciates = negative carry proxy decreases)
        # We go long the negative-carry (low forward premium) side = high interest rate
        portfolio_ret = long_ret - short_ret
        portfolio_returns.append(portfolio_ret)
        dates.append(spot_rates.index[t])

    pf = pd.Series(portfolio_returns, index=dates).dropna()

    ann_ret = float(pf.mean() * 12)
    ann_vol = float(pf.std() * np.sqrt(12))
    sharpe  = ann_ret / ann_vol if ann_vol > 1e-8 else 0.0

    return {
        "annual_return": round(ann_ret, 4),
        "annual_vol":    round(ann_vol, 4),
        "sharpe_ratio":  round(sharpe, 4),
        "skewness":      round(float(pf.skew()), 4),
        "kurtosis":      round(float(pf.kurtosis()), 4),
        "max_drawdown":  round(float(((1+pf).cumprod() / (1+pf).cumprod().cummax() - 1).min()), 4),
        "n_obs":         len(pf),
        "portfolio_rets": pf.round(6).tolist(),
    }`,
    explanation:
      "FX carry exploits the violation of uncovered interest parity (UIP): in theory, high-interest-rate currencies should depreciate to offset the yield advantage, but empirically they appreciate — the 'forward premium puzzle'. The carry trade is profitable on average but exhibits pronounced left skew (negative skewness ≈ −1.5) because it is exposed to sudden currency crises and risk-off episodes where all high-yield currencies collapse simultaneously — the Sharpe ratio of ~0.5 comes with a Calmar ratio near 0.3 due to the periodic large drawdowns.",
  },
];
