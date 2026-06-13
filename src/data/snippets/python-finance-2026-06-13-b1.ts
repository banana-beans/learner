import type { Snippet } from "./types";

export const pythonFinanceSnippets20260613B1: Snippet[] = [
  {
    id: "pyfin-20260613-b1-garch-mle",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) MLE — maximum likelihood estimation with scipy",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def fit_garch11(returns: np.ndarray) -> dict:
    """
    GARCH(1,1): sigma_t^2 = omega + alpha * r_{t-1}^2 + beta * sigma_t-1^2
    MLE under Gaussian innovations: L = -0.5 * sum [log(sigma_t^2) + r_t^2/sigma_t^2]
    Log-likelihood is negative because scipy minimises.
    Stationarity constraint: alpha + beta < 1.
    """
    T = len(returns)
    r = returns - returns.mean()   # demeaned

    def garch_variance(params):
        omega, alpha, beta = params
        var = np.zeros(T)
        var[0] = omega / max(1.0 - alpha - beta, 1e-8)   # unconditional variance
        for t in range(1, T):
            var[t] = omega + alpha * r[t-1]**2 + beta * var[t-1]
        return np.maximum(var, 1e-10)

    def neg_log_likelihood(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        var = garch_variance(params)
        ll  = -0.5 * np.sum(np.log(var) + r**2 / var)
        return -float(ll)   # negate for minimisation

    # Initial guess: omega from sample variance, typical persistence
    s2   = float(np.var(r))
    x0   = [s2 * 0.05, 0.10, 0.85]
    bounds = [(1e-8, None), (1e-6, 0.99), (1e-6, 0.99)]

    res = minimize(neg_log_likelihood, x0, method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-12, "gtol": 1e-9})
    omega, alpha, beta = res.x

    var_path = garch_variance(res.x)
    sigma_t  = np.sqrt(var_path)

    # AIC / BIC
    ll_opt   = -res.fun
    n_params = 3
    aic = 2 * n_params - 2 * ll_opt
    bic = n_params * np.log(T) - 2 * ll_opt

    return {
        "omega":        round(float(omega), 8),
        "alpha":        round(float(alpha), 6),
        "beta":         round(float(beta), 6),
        "persistence":  round(float(alpha + beta), 6),
        "half_life":    round(-np.log(2) / np.log(alpha + beta), 2),
        "long_run_vol": round(float(np.sqrt(omega / (1 - alpha - beta))) * np.sqrt(252), 4),
        "log_lik":      round(float(ll_opt), 4),
        "aic":          round(float(aic), 4),
        "bic":          round(float(bic), 4),
        "sigma_last":   round(float(sigma_t[-1]) * np.sqrt(252), 4),  # last annualised vol
        "converged":    bool(res.success),
    }`,
    explanation:
      "GARCH MLE requires computing the variance recursion at every evaluation of the log-likelihood, making the optimisation O(T × iterations) — for 2500 days and 100 iterations, that is 250 000 variance recursions, each consuming ~10 µs in pure Python. The persistence parameter α+β near 1 (typically 0.97-0.99 for equity) means the variance process is near-integrated (IGARCH), which causes numerical difficulties in the initialisation of the recursion; initialising with the unconditional variance ω/(1−α−β) is the standard fix.",
  },
  {
    id: "pyfin-20260613-b1-vol-cone",
    language: "python",
    tag: "finance",
    title: "Volatility cone — historical vol distribution across horizons",
    code: `import numpy as np
import pandas as pd
from typing import Optional

def volatility_cone(
    returns: pd.Series,
    horizons: list = [5, 10, 21, 63, 126, 252],   # trading days
    percentiles: list = [5, 25, 50, 75, 95],
    ann_factor: float = 252.0,
) -> pd.DataFrame:
    """
    Volatility cone: for each horizon H, compute the historical distribution
    of rolling H-day realised vol. Percentiles trace a 'cone' shape:
    high percentiles are high for short horizons (sampling noise) and compress
    toward the long-run average at long horizons (CLT effect).
    Used to judge whether current implied vol is rich or cheap vs historical.
    """
    results = {}

    for H in horizons:
        # Rolling realised vol: annualised std of log returns over H days
        rolling_vol = (
            returns.rolling(H)
                   .std(ddof=1)     # sample std of daily returns
            * np.sqrt(ann_factor)   # annualise
        ).dropna()

        row = {}
        for p in percentiles:
            row[f"p{p}"] = float(np.percentile(rolling_vol, p))
        row["current"] = float(rolling_vol.iloc[-1]) if len(rolling_vol) > 0 else float("nan")
        row["mean"]    = float(rolling_vol.mean())
        results[H] = row

    df = pd.DataFrame(results).T
    df.index.name = "horizon_days"
    return df.round(4)

def implied_vs_cone(
    iv_by_expiry: dict,    # {horizon_days: implied_vol}
    cone: pd.DataFrame,
) -> pd.DataFrame:
    """
    For each IV observation, compute its percentile within the historical cone.
    Negative richness: IV < median historical vol (options are cheap).
    Positive richness: IV > median historical vol (options are rich).
    """
    rows = []
    for H, iv in iv_by_expiry.items():
        if H not in cone.index:
            continue
        row = cone.loc[H]
        percentile = float(
            sum(iv > cone.loc[H, f"p{p}"] for p in [5, 25, 50, 75, 95]) * 20
        )  # rough percentile
        rows.append({
            "horizon":    H,
            "iv":         round(float(iv), 4),
            "hist_med":   row["p50"],
            "richness":   round(float(iv) - row["p50"], 4),
            "approx_pct": percentile,
        })
    return pd.DataFrame(rows).set_index("horizon")`,
    explanation:
      "The volatility cone's width shrinks at longer horizons because averaging over more days reduces sampling variance — the CLT compresses the distribution of mean-reversion-affected vol estimates. A point where implied vol sits above the 95th percentile of the cone is traditionally considered 'rich' (sell vol), while below the 5th percentile is 'cheap' (buy vol). The cone is constructed from a minimum of 5-10 years of data to capture at least one full vol cycle including crisis and quiescent regimes.",
  },
  {
    id: "pyfin-20260613-b1-ff3-regression",
    language: "python",
    tag: "finance",
    title: "Fama-French 3-factor regression — alpha and beta decomposition",
    code: `import numpy as np
import pandas as pd
from scipy import stats

def fama_french_3factor(
    asset_returns: pd.Series,    # excess returns of the asset
    mkt_rf: pd.Series,           # Mkt-Rf: market excess return
    smb: pd.Series,              # SMB: small-minus-big
    hml: pd.Series,              # HML: high-minus-low (value)
    rf: pd.Series = None,        # risk-free rate (if asset_returns are not excess)
) -> dict:
    """
    OLS regression:  r_i - rf = alpha + beta_mkt*(Mkt-Rf) + beta_smb*SMB + beta_hml*HML + eps
    Fama-French (1993): SMB captures size premium, HML captures value premium.
    Alpha (Jensen's alpha): risk-adjusted outperformance vs FF3 factors.
    Information ratio = alpha / tracking_error.
    """
    # Align on common dates
    df = pd.concat([asset_returns, mkt_rf, smb, hml], axis=1).dropna()
    df.columns = ["r", "mkt_rf", "smb", "hml"]

    if rf is not None:
        rf_aligned = rf.reindex(df.index).fillna(0)
        df["r"] = df["r"] - rf_aligned

    y = df["r"].values
    X = np.column_stack([
        np.ones(len(df)),     # intercept (alpha)
        df["mkt_rf"].values,
        df["smb"].values,
        df["hml"].values,
    ])

    # OLS: beta = (X'X)^{-1} X'y
    beta, resid, rank, sv = np.linalg.lstsq(X, y, rcond=None)
    alpha, b_mkt, b_smb, b_hml = beta

    y_hat = X @ beta
    residuals = y - y_hat

    # Statistics
    T      = len(y)
    k      = 4
    s2     = np.sum(residuals**2) / (T - k)   # residual variance
    cov_b  = s2 * np.linalg.inv(X.T @ X)
    se     = np.sqrt(np.diag(cov_b))
    t_stat = beta / se
    p_vals = 2 * (1 - stats.t.cdf(np.abs(t_stat), df=T - k))

    r2      = 1.0 - np.var(residuals, ddof=1) / np.var(y, ddof=1)
    te      = float(np.std(residuals, ddof=1)) * np.sqrt(252)   # annualised
    ir      = float(alpha) * 252 / te if te > 0 else 0.0        # annualised IR

    return {
        "alpha_daily":      round(float(alpha), 6),
        "alpha_annual":     round(float(alpha * 252), 4),
        "t_alpha":          round(float(t_stat[0]), 4),
        "p_alpha":          round(float(p_vals[0]), 4),
        "beta_market":      round(float(b_mkt), 4),
        "beta_smb":         round(float(b_smb), 4),
        "beta_hml":         round(float(b_hml), 4),
        "r_squared":        round(float(r2), 4),
        "tracking_error":   round(float(te), 4),
        "information_ratio": round(float(ir), 4),
        "n_obs":            T,
    }`,
    explanation:
      "Fama-French alpha (Jensen's alpha in the 3-factor model) measures return in excess of what is explained by market, size, and value risk premia — a fund with positive FF3-alpha truly adds value through stock selection or timing rather than just by holding small-cap or value stocks. The information ratio annualises the alpha and divides by the residual tracking error, providing a risk-adjusted measure of the manager's skill that is comparable across strategies with different beta exposures.",
  },
  {
    id: "pyfin-20260613-b1-engle-granger",
    language: "python",
    tag: "finance",
    title: "Engle-Granger cointegration — pairs trading z-score and spread mean reversion",
    code: `import numpy as np
import pandas as pd
from scipy import stats

def engle_granger_test(
    y: pd.Series,    # price series 1 (e.g. stock A)
    x: pd.Series,   # price series 2 (e.g. stock B)
) -> dict:
    """
    Engle-Granger (1987) two-step cointegration test:
    1. OLS regression: y = alpha + beta * x + residual
    2. ADF test on the residual (null: unit root = not cointegrated)
    If residual is I(0) (ADF rejects), the pair is cointegrated.
    Critical values (MacKinnon 1994) for 5%: approx -3.34 for T=200.
    """
    # Step 1: OLS to estimate the cointegrating vector (hedge ratio)
    df = pd.concat([y, x], axis=1).dropna()
    df.columns = ["y", "x"]

    X  = np.column_stack([np.ones(len(df)), df["x"].values])
    b, _, _, _ = np.linalg.lstsq(X, df["y"].values, rcond=None)
    alpha_ols, beta = b

    spread  = df["y"].values - (alpha_ols + beta * df["x"].values)

    # Step 2: ADF on the spread (ADF with 0 lags = Dickey-Fuller)
    def adf_stat(series, lags=1):
        """ADF with 'lags' additional lags of the differenced series."""
        n    = len(series)
        diff = np.diff(series)
        # Build regressors: lagged level + lagged diffs
        lag_level = series[lags:-1]
        Y_reg     = diff[lags:]
        cols      = [lag_level - lag_level.mean()]
        for k in range(1, lags + 1):
            cols.append(diff[lags - k: -k])
        cols.append(np.ones(len(Y_reg)))
        X_reg = np.column_stack(cols)
        bhat, _, _, _ = np.linalg.lstsq(X_reg, Y_reg, rcond=None)
        resid2 = Y_reg - X_reg @ bhat
        s2     = np.sum(resid2**2) / (len(Y_reg) - X_reg.shape[1])
        se_b   = np.sqrt(s2 * np.linalg.inv(X_reg.T @ X_reg)[0, 0])
        return float(bhat[0] / se_b)   # t-statistic on lagged level

    adf_t = adf_stat(spread, lags=1)

    # MacKinnon approximate 5% critical value
    cv_5pct = -3.34

    # Z-score of the spread (for trading signal)
    spread_mean = float(np.mean(spread))
    spread_std  = float(np.std(spread, ddof=1))
    z_score     = (spread[-1] - spread_mean) / max(spread_std, 1e-10)

    return {
        "hedge_ratio":   round(float(beta), 6),
        "intercept":     round(float(alpha_ols), 6),
        "adf_statistic": round(float(adf_t), 4),
        "cv_5pct":       cv_5pct,
        "cointegrated":  bool(adf_t < cv_5pct),
        "spread_mean":   round(spread_mean, 6),
        "spread_std":    round(spread_std, 6),
        "z_score_now":   round(float(z_score), 4),
        "half_life":     round(-np.log(2) / np.log(1 + max(adf_t / len(spread), -0.99)), 2),
    }`,
    explanation:
      "The Engle-Granger test regresses one price series on the other and tests the residual for a unit root — if the spread is stationary (ADF rejects), the two series share a common stochastic trend and mean-revert to the cointegrating relationship. The hedge ratio beta (the slope of the OLS regression) determines how many units of stock B to hold short per unit of stock A long; mispricing this ratio introduces a non-stationary residual that never mean-reverts, poisoning the pairs trade.",
  },
  {
    id: "pyfin-20260613-b1-kalman-beta",
    language: "python",
    tag: "finance",
    title: "Kalman filter dynamic beta — state-space pairs trading hedge ratio",
    code: `import numpy as np
import pandas as pd

def kalman_hedge_ratio(
    y: np.ndarray,   # dependent series (stock A returns or prices)
    x: np.ndarray,   # independent series (stock B)
    delta: float = 1e-4,    # state transition variance (how fast beta can change)
    obs_var: float = None,  # observation noise variance (estimated if None)
) -> dict:
    """
    State-space model for time-varying beta:
    y_t = beta_t * x_t + alpha_t + eps_t,  eps_t ~ N(0, R)
    [beta_t, alpha_t] = [beta_{t-1}, alpha_{t-1}] + eta_t, eta_t ~ N(0, Q)
    Q = delta * I  (random walk state equation)
    Kalman filter gives the optimal online estimate of (beta_t, alpha_t).
    """
    T      = len(y)
    n_state = 2   # [beta, alpha/intercept]

    # State transition (random walk for beta and alpha)
    Q = delta * np.eye(n_state)

    # Initial state and covariance
    theta = np.array([1.0, 0.0])       # [beta, alpha]
    P     = np.eye(n_state) * 10.0    # wide initial uncertainty

    # Estimate obs variance from first 30 obs if not provided
    if obs_var is None:
        ols_resid = y[:30] - x[:30] * (y[:30] @ x[:30]) / (x[:30] @ x[:30])
        obs_var   = max(float(np.var(ols_resid)), 1e-8)
    R = obs_var

    betas  = np.zeros(T)
    alphas = np.zeros(T)
    spreads = np.zeros(T)

    for t in range(T):
        # Observation vector H_t = [x_t, 1] (regression on x and intercept)
        H = np.array([x[t], 1.0])

        # Prediction step (state equation is identity: theta_t = theta_{t-1})
        # P_pred = P + Q (no state transition matrix needed for random walk)
        P_pred = P + Q

        # Innovation (prediction error)
        y_hat  = H @ theta
        innov  = y[t] - y_hat

        # Innovation variance
        S_t  = H @ P_pred @ H + R

        # Kalman gain
        K_t  = P_pred @ H / S_t

        # Update step
        theta  = theta + K_t * innov
        P      = (np.eye(n_state) - np.outer(K_t, H)) @ P_pred

        betas[t]   = theta[0]
        alphas[t]  = theta[1]
        spreads[t] = innov   # spread = actual - predicted

    spread_std = float(np.std(spreads, ddof=1))
    z_scores   = spreads / max(spread_std, 1e-10)

    return {
        "betas":         betas,
        "alphas":        alphas,
        "spreads":       spreads,
        "z_scores":      z_scores,
        "beta_now":      round(float(betas[-1]), 6),
        "alpha_now":     round(float(alphas[-1]), 6),
        "spread_std":    round(float(spread_std), 6),
        "z_score_now":   round(float(z_scores[-1]), 4),
        "delta":         delta,
    }`,
    explanation:
      "The Kalman filter provides optimal (minimum-variance) online estimates of time-varying beta without requiring a rolling window — it naturally up-weights recent observations through the state uncertainty matrix P, which grows between observations (via Q) and shrinks when new data arrives. The delta parameter controls the speed of adaptation: large delta allows beta to change rapidly (responsive but noisy), while small delta produces slow-moving, stable estimates. In practice, delta is cross-validated on out-of-sample spread stationarity.",
  },
  {
    id: "pyfin-20260613-b1-realized-var",
    language: "python",
    tag: "finance",
    title: "Realized variance estimators — classical, Parkinson, Rogers-Satchell",
    code: `import numpy as np
import pandas as pd

def realized_variance_estimators(
    df: pd.DataFrame,   # columns: open, high, low, close (prices, not returns)
    ann_factor: float = 252.0,
) -> pd.DataFrame:
    """
    Multiple OHLC-based realized variance estimators:
    1. Close-to-close (CC): baseline, uses only closing prices.
    2. Parkinson (1980): uses high-low range; 5x more efficient than CC.
    3. Garman-Klass (1980): uses OHLC; ~8x more efficient than CC.
    4. Rogers-Satchell (1991): drift-adjusted, unbiased when mu != 0.
    5. Yang-Zhang (2000): handles overnight gap jumps.

    All estimators are per-day variance; annualise by multiplying by ann_factor.
    """
    o = np.log(df["open"])
    h = np.log(df["high"])
    l = np.log(df["low"])
    c = np.log(df["close"])
    c_prev = c.shift(1)

    # 1. Close-to-close
    cc = (c - c_prev) ** 2

    # 2. Parkinson: var = (1/(4*ln2)) * (H-L)^2
    pk = (h - l) ** 2 / (4.0 * np.log(2))

    # 3. Garman-Klass: uses open and close as well
    gk = 0.5 * (h - l) ** 2 - (2 * np.log(2) - 1) * (c - o) ** 2

    # 4. Rogers-Satchell: drift-adjusted (works when mean return != 0)
    rs = (h - c) * (h - o) + (l - c) * (l - o)

    # 5. Yang-Zhang: handles overnight jump (open - prev_close gap)
    k  = 0.34 / (1.34 + (len(df) + 1) / (len(df) - 1))
    overnight = (o - c_prev) ** 2
    open_close = (c - o) ** 2
    yz = overnight + k * open_close + (1 - k) * rs

    result = pd.DataFrame({
        "CC_daily":    cc,
        "Parkinson":   pk,
        "GarmanKlass": gk,
        "RogersSatch": rs,
        "YangZhang":   yz,
    }).dropna()

    # Annualised vols
    summary = {}
    for col in result.columns:
        v = result[col].clip(lower=0)
        summary[col] = {
            "mean_var":   round(float(v.mean()), 8),
            "annual_vol": round(float(np.sqrt(v.mean() * ann_factor)), 4),
        }

    return pd.DataFrame(summary).T`,
    explanation:
      "The Parkinson estimator extracts 5× more information per day than close-to-close because the intraday range (H−L) reflects the continuous path of the price rather than a single observation at close. However, Parkinson assumes zero drift, which biases the estimate upward when returns have a persistent trend; Rogers-Satchell removes this bias by explicitly decomposing variance into up-move and down-move components. Yang-Zhang combines all four price points and handles the overnight gap (the open gap from prior close) that other estimators treat as intraday variance.",
  },
  {
    id: "pyfin-20260613-b1-kelly-correlated",
    language: "python",
    tag: "finance",
    title: "Kelly criterion with correlated bets — multi-asset optimal sizing",
    code: `import numpy as np
from scipy.optimize import minimize

def kelly_multi_asset(
    mu: np.ndarray,        # (N,) expected excess returns (annualised)
    Sigma: np.ndarray,     # (N, N) covariance matrix of returns
    rf: float = 0.0,
    max_leverage: float = 2.0,  # maximum sum of absolute weights
    fractional: float = 0.25,   # fraction of full Kelly (for safety)
) -> dict:
    """
    Multi-asset Kelly: maximise E[log(1 + w'r)] ≈ w'mu - 0.5*w'Sigma*w
    (second-order Taylor expansion of log utility).
    Full Kelly solution: w* = Sigma^{-1} * mu  (unconstrained).
    Constrained version via scipy for leverage and short-sale limits.
    Fractional Kelly (f=0.25): reduces optimal position by factor f,
    trading geometric growth for significantly lower drawdown risk.
    """
    N = len(mu)

    # Unconstrained full Kelly
    try:
        Sigma_inv = np.linalg.inv(Sigma)
        w_full    = Sigma_inv @ (mu - rf)
    except np.linalg.LinAlgError:
        w_full = np.zeros(N)

    # Constrained Kelly: maximise Kelly objective subject to leverage limit
    def neg_kelly(w):
        rp   = float(w @ mu) - rf
        var  = float(w @ Sigma @ w)
        return -(rp - 0.5 * var)   # negate for minimisation

    x0 = w_full / max(np.sum(np.abs(w_full)), max_leverage) * max_leverage
    constraints = [
        {"type": "ineq", "fun": lambda w: max_leverage - np.sum(np.abs(w))},
    ]
    bounds = [(-max_leverage, max_leverage)] * N

    res = minimize(neg_kelly, x0, method="SLSQP", bounds=bounds,
                   constraints=constraints,
                   options={"ftol": 1e-10, "maxiter": 1000})

    w_constrained = np.array(res.x) * fractional  # fractional Kelly

    # Portfolio statistics
    port_ret = float(w_constrained @ mu)
    port_var = float(w_constrained @ Sigma @ w_constrained)
    port_vol = np.sqrt(max(port_var, 0))

    # Expected log growth (Kelly criterion: G ≈ r_p - 0.5*sigma_p^2)
    kelly_growth = port_ret - 0.5 * port_var

    return {
        "weights_full_kelly":   w_full.round(4).tolist(),
        "weights_constrained":  w_constrained.round(4).tolist(),
        "leverage_full":        round(float(np.sum(np.abs(w_full))), 4),
        "leverage_constrained": round(float(np.sum(np.abs(w_constrained))), 4),
        "expected_return":      round(float(port_ret), 4),
        "portfolio_vol":        round(float(port_vol), 4),
        "kelly_growth":         round(float(kelly_growth), 4),
        "fractional":           fractional,
        "converged":            bool(res.success),
    }`,
    explanation:
      "The full Kelly criterion maximises long-run geometric growth but is extremely aggressive — it can allocate leverages of 5-10× for high-Sharpe strategies, leading to 50-70% drawdowns during bad streaks. Fractional Kelly (typically 0.25-0.5 of full Kelly) reduces expected growth by a small factor while dramatically cutting drawdown risk: at f=0.25, the drawdown is roughly f times the full-Kelly drawdown, while the geometric growth rate is reduced by 1−f²/2 ≈ 3% relative to full Kelly for typical parameters.",
  },
  {
    id: "pyfin-20260613-b1-merton-credit",
    language: "python",
    tag: "finance",
    title: "Merton structural credit model — distance-to-default and PD estimation",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import fsolve

def merton_credit_model(
    equity_value: float,    # market cap (E)
    equity_vol: float,      # annualised equity vol (sigma_E)
    face_debt: float,       # face value of debt (F) — typically short-term debt + 0.5*long-term
    r: float,               # risk-free rate
    T: float = 1.0,         # debt maturity
) -> dict:
    """
    Merton (1974): equity is a call option on firm value V with strike F.
    E = V*N(d1) - F*e^{-rT}*N(d2)   (Black-Scholes call with V, F)
    sigma_E = (V/E)*N(d1)*sigma_V    (equity vol is levered asset vol)
    Solve numerically for (V, sigma_V) given (E, sigma_E, F, r, T).
    Distance to default (DD) = (ln(V/F) + (r - 0.5*sigma_V^2)*T) / (sigma_V*sqrt(T))
    Probability of default (PD) = N(-DD)
    """
    def equations(params):
        V, sigma_V = params
        if V <= 0 or sigma_V <= 0:
            return [1e8, 1e8]
        sqT = np.sqrt(T)
        d1  = (np.log(V / face_debt) + (r + 0.5 * sigma_V**2) * T) / (sigma_V * sqT)
        d2  = d1 - sigma_V * sqT
        E_model  = V * norm.cdf(d1) - face_debt * np.exp(-r * T) * norm.cdf(d2)
        sE_model = (V / max(E_model, 1e-8)) * norm.cdf(d1) * sigma_V
        return [E_model - equity_value, sE_model - equity_vol]

    # Initial guess: V ≈ E + F (leverage = debt to equity)
    V0 = equity_value + face_debt
    s0 = equity_vol * equity_value / V0
    sol = fsolve(equations, [V0, s0], full_output=True)
    V, sigma_V = sol[0]

    sqT = np.sqrt(T)
    d1  = (np.log(V / face_debt) + (r + 0.5 * sigma_V**2) * T) / (sigma_V * sqT)
    d2  = d1 - sigma_V * sqT

    E_model = V * norm.cdf(d1) - face_debt * np.exp(-r * T) * norm.cdf(d2)

    # Credit spread: y_debt - rf where y_debt from P(0,T) = e^{-y_debt*T}
    P_T    = face_debt * np.exp(-r * T) * norm.cdf(d2) + V * norm.cdf(-d1) * np.exp(-r * T)
    # Simplified: risky zero-coupon bond price
    P_debt = face_debt * np.exp(-r * T) * norm.cdf(d2) + V * (1 - norm.cdf(d1))
    y_debt = -np.log(P_debt / face_debt) / T if P_debt > 0 else np.inf
    spread_bps = (y_debt - r) * 10_000

    return {
        "asset_value":      round(float(V), 2),
        "asset_vol":        round(float(sigma_V), 4),
        "distance_to_default": round(float(d2), 4),  # d2 = physical DD
        "prob_default":     round(float(norm.cdf(-d2)), 6),
        "credit_spread_bps": round(float(spread_bps), 2),
        "leverage_ratio":   round(float(face_debt / V), 4),
        "recovery_value":   round(float(V * norm.cdf(-d1)), 2),
    }`,
    explanation:
      "The Merton model's distance-to-default (d2 in the BS formula) is the number of standard deviations the firm value is above the default threshold — N(−d2) gives the risk-neutral default probability. The key insight is that equity is precisely a call option on firm value: shareholders receive max(V−F, 0) at maturity while debtholders receive min(V, F). This allows the unobservable firm value and its volatility to be backed out from the observable equity price and equity volatility by solving two equations (BS price + BS vega = sigma_E·E/V·N(d1)).",
  },
  {
    id: "pyfin-20260613-b1-cds-hazard-bootstrap",
    language: "python",
    tag: "finance",
    title: "CDS hazard rate bootstrapping — piecewise constant hazard from market spreads",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(
    tenors: list,           # [0.5, 1, 2, 3, 5, 7, 10] in years
    cds_spreads_bps: list,  # par CDS spreads in basis points
    recovery: float = 0.40, # recovery rate
    r: float = 0.05,        # flat risk-free rate
    dt: float = 0.25,       # premium payment frequency (quarterly)
) -> dict:
    """
    Bootstraps piecewise-constant hazard rates h_i from par CDS spreads.
    Par spread: value of protection leg = value of premium leg.
    Sequential: h_1 matches the 6M CDS, then h_2 matches 1Y given h_1, etc.
    """
    hazards = []      # piecewise-constant hazard rates per tenor bucket
    tenors_sorted = sorted(zip(tenors, cds_spreads_bps))

    def survival_prob(t, hz_list, tenor_breaks):
        """Q(t): survival probability from piecewise-constant hazard curve."""
        q = 1.0
        t_prev = 0.0
        for i, tb in enumerate(tenor_breaks):
            t_end = min(t, tb)
            dt_seg = max(t_end - t_prev, 0.0)
            q *= np.exp(-hz_list[i] * dt_seg)
            t_prev = tb
            if t <= tb:
                break
        return q

    def price_cds(spread, T_cds, hz_list, tenor_breaks):
        """CDS PV = protection leg - spread * premium leg."""
        s     = spread / 10_000.0   # bps -> decimal
        prot  = 0.0
        prem  = 0.0
        t_steps = np.arange(dt, T_cds + 1e-9, dt)
        Q_prev  = 1.0
        for t in t_steps:
            df  = np.exp(-r * t)
            Q_t = survival_prob(t, hz_list, tenor_breaks)
            # Protection: (1-R) * df * dQ (default in this period)
            prot += (1 - recovery) * df * (Q_prev - Q_t)
            # Premium: s * dt * df * Q_t
            prem += s * dt * df * Q_t
            Q_prev = Q_t
        return prot - prem

    tenor_breaks = []
    for T_i, s_i in tenors_sorted:
        tenor_breaks.append(T_i)

        def objective(h):
            hz_trial = hazards + [h]
            return price_cds(s_i, T_i, hz_trial, tenor_breaks)

        h_sol = brentq(objective, 1e-6, 2.0, xtol=1e-8)
        hazards.append(h_sol)

    # Build output curve
    surv_probs = [float(np.exp(-hazards[0] * t)) for t, _ in tenors_sorted]

    return {
        "tenors":       [t for t, _ in tenors_sorted],
        "hazard_rates": [round(h, 6) for h in hazards],
        "spreads_bps":  [s for _, s in tenors_sorted],
        "survival_probs": [round(q, 6) for q in surv_probs],
        "implied_pd_1y":  round(1 - float(np.exp(-hazards[0])), 6),
    }`,
    explanation:
      "CDS hazard rate bootstrapping is exactly analogous to yield curve bootstrapping: each tenor's CDS spread pins one piecewise-constant hazard rate, and the calculation proceeds sequentially — the short-dated hazard rate is fixed before the long-dated one is solved. The piecewise-constant hazard assumption implies that the survival probability within each tenor bucket decays exponentially, producing a continuous survival curve that exactly reprices all market CDS quotes by construction.",
  },
  {
    id: "pyfin-20260613-b1-fd-greeks",
    language: "python",
    tag: "finance",
    title: "Finite difference Greeks — bump-and-reprice for model-agnostic sensitivities",
    code: `import numpy as np
from typing import Callable

def finite_difference_greeks(
    price_fn: Callable[..., float],   # f(S, K, r, q, sigma, T, **kwargs) -> price
    S: float, K: float, r: float, q: float, sigma: float, T: float,
    dS: float = None, dr: float = 1e-4, dsigma: float = 1e-4, dT: float = 1/252,
    **kwargs,
) -> dict:
    """
    Compute all first and second-order Greeks via bump-and-reprice.
    Central differences for first-order (O(h^2) accuracy).
    Second-order (gamma, vomma, vanna): also central differences.
    Model-agnostic: works for any pricing function.
    """
    if dS is None:
        dS = S * 0.001   # 10 bps of spot

    P0  = price_fn(S, K, r, q, sigma, T, **kwargs)

    # Delta: dV/dS (central)
    Pup_S   = price_fn(S + dS,  K, r, q, sigma, T, **kwargs)
    Pdn_S   = price_fn(S - dS,  K, r, q, sigma, T, **kwargs)
    delta   = (Pup_S - Pdn_S) / (2 * dS)

    # Gamma: d^2V/dS^2 (central)
    gamma   = (Pup_S - 2 * P0 + Pdn_S) / (dS * dS)

    # Vega: dV/dsigma (central), per 1% vol move
    Pup_v   = price_fn(S, K, r, q, sigma + dsigma, T, **kwargs)
    Pdn_v   = price_fn(S, K, r, q, sigma - dsigma, T, **kwargs)
    vega    = (Pup_v - Pdn_v) / (2 * dsigma) * 0.01   # per 1% vol

    # Theta: dV/dt (forward, per calendar day)
    Pu_T    = price_fn(S, K, r, q, sigma, max(T - dT, 1e-6), **kwargs)
    theta   = (Pu_T - P0) / dT   # daily theta (negative for long options)

    # Rho: dV/dr (central, per 1% rate move)
    Pup_r   = price_fn(S, K, r + dr, q, sigma, T, **kwargs)
    Pdn_r   = price_fn(S, K, r - dr, q, sigma, T, **kwargs)
    rho     = (Pup_r - Pdn_r) / (2 * dr) * 0.01

    # Vanna: d^2V/(dS dsigma) — mixed partial
    Puu     = price_fn(S + dS, K, r, q, sigma + dsigma, T, **kwargs)
    Pud     = price_fn(S + dS, K, r, q, sigma - dsigma, T, **kwargs)
    Pdu     = price_fn(S - dS, K, r, q, sigma + dsigma, T, **kwargs)
    Pdd     = price_fn(S - dS, K, r, q, sigma - dsigma, T, **kwargs)
    vanna   = (Puu - Pud - Pdu + Pdd) / (4 * dS * dsigma) * 0.01

    # Volga (vomma): d^2V/dsigma^2
    volga   = (Pup_v - 2 * P0 + Pdn_v) / (dsigma * dsigma) * 0.01**2

    return {
        "price": round(float(P0), 6),
        "delta": round(float(delta), 6),
        "gamma": round(float(gamma), 6),
        "vega":  round(float(vega), 6),    # per 1% vol
        "theta": round(float(theta), 6),   # per day
        "rho":   round(float(rho), 6),     # per 1% rate
        "vanna": round(float(vanna), 6),   # per 1% vol move per spot move
        "volga": round(float(volga), 6),   # d^2V/dvol^2 per (1%)^2
    }`,
    explanation:
      "Central finite differences have O(h²) accuracy versus O(h) for one-sided differences — for Greeks where the pricing function is smooth, h = 10 bps for spot and 1 bp for rate/vol gives 6-8 digits of accuracy. The mixed partial (vanna = d²V/dS·dσ) requires a 2D grid of bumps and costs 4 additional function evaluations — in practice, vanna is the most important second-order Greek for FX risk because it quantifies how the spot delta changes as implied vol moves, directly driving the P&L of spot-vol correlation risk in a smile book.",
  },
  {
    id: "pyfin-20260613-b1-hull-white-swaption",
    language: "python",
    tag: "finance",
    title: "Hull-White swaption analytical formula — ATM swaption pricing",
    code: `import numpy as np
from scipy.stats import norm

def hull_white_swaption(
    a: float,       # mean reversion speed
    sigma: float,   # short rate volatility
    r0: float,      # current short rate
    theta: float,   # long-run rate (theta/a in Vasicek sense)
    swap_tenor: float,    # length of underlying swap (years)
    option_expiry: float, # option maturity (years)
    swap_rate_K: float,   # fixed rate of the underlying swap (strike)
    n_coupon: int = 2,    # coupons per year (2 = semi-annual)
    notional: float = 1.0,
) -> dict:
    """
    Hull-White (1990) analytical swaption under affine term structure.
    Receiver swaption: right to receive fixed swap_rate_K.
    Key formula: swaption = sum over coupon dates of ZCB bond options.
    Uses Jamshidian's decomposition: each coupon bond option has its own
    strike r* such that the sum of bond values at r* equals the swap strike.
    Here we use the analytical normal vol approach (common in rates markets).
    """
    def B(tau: float) -> float:
        """B(tau) = (1 - e^{-a*tau}) / a in HW affine pricing."""
        if abs(a) < 1e-8:
            return tau
        return (1.0 - np.exp(-a * tau)) / a

    def A(tau: float) -> float:
        """A(tau): log(P_mkt / P_hw) — for fitting; here use flat vol."""
        B_tau = B(tau)
        return ((theta - sigma**2 / (2 * a**2)) * (B_tau - tau)
                - sigma**2 * B_tau**2 / (4 * a))

    def df(t: float) -> float:
        return np.exp(-A(t) - B(t) * r0)

    # Coupon dates
    dt = 1.0 / n_coupon
    T0 = option_expiry   # option expiry
    coupon_dates = np.arange(T0 + dt, T0 + swap_tenor + 1e-9, dt)
    c = swap_rate_K * dt   # coupon per period
    flows = [c] * len(coupon_dates)
    flows[-1] += 1.0       # final coupon + principal

    # Variance of r at T0 (HW: Var[r(T0)] = sigma^2*(1-e^{-2aT0})/(2a))
    var_r = sigma**2 * (1 - np.exp(-2 * a * T0)) / (2 * a)
    std_r = np.sqrt(var_r)

    # Jamshidian: find r* such that sum of bond values = 1 (par swap)
    # Approximation for ATM swaption: bond option vols
    P0_T0 = df(T0)
    swaption_val = 0.0
    for Ti, ci in zip(coupon_dates, flows):
        P0_Ti = df(Ti)
        B_Ti_T0 = B(Ti - T0)
        # Vol of log(P(T0, Ti)) under T0-forward measure
        sig_P = std_r * B_Ti_T0
        if sig_P < 1e-10:
            continue
        # European option on ZCB P(T0, Ti) with strike c_i/swap_factor
        # (receiver: payer of fixed, so bond option is a put on P)
        K_i   = ci * P0_Ti / P0_T0   # approximate strike for decomposition
        d1    = np.log(P0_Ti / (K_i * P0_T0)) / sig_P + 0.5 * sig_P
        d2    = d1 - sig_P
        swaption_val += notional * (K_i * P0_T0 * norm.cdf(-d2) - P0_Ti * norm.cdf(-d1))

    # ATM approximation: annuity * sigma_annuity * sqrt(T0)
    annuity = sum(dt * df(Ti) for Ti in coupon_dates)
    atm_approx_vol = sigma * B(swap_tenor) / np.sqrt(a) if a > 1e-8 else sigma * swap_tenor

    return {
        "swaption_pv":     round(float(swaption_val), 8),
        "annuity":         round(float(annuity), 6),
        "atm_vol_approx":  round(float(atm_approx_vol), 6),
        "variance_r_T0":   round(float(var_r), 6),
        "n_coupons":       len(coupon_dates),
    }`,
    explanation:
      "Jamshidian's decomposition factorises the swaption payoff as a sum of individual ZCB option payoffs because the swap value is a linear function of ZCB prices and the Hull-White model has a one-factor structure — all bond prices move monotonically in the same direction when the short rate changes. This decomposition transforms a path-dependent problem (the swap NPV depends on the entire yield curve at the swaption expiry) into a sum of European bond options, each with an analytical Hull-White formula.",
  },
  {
    id: "pyfin-20260613-b1-implied-vol-bisect",
    language: "python",
    tag: "finance",
    title: "Implied vol bisection — robust fallback when Newton-Raphson fails",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_price(S: float, K: float, r: float, q: float,
                  sigma: float, T: float) -> float:
    if T <= 0 or sigma <= 0:
        return max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
    sqT = np.sqrt(T)
    d1  = (np.log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * sqT)
    d2  = d1 - sigma * sqT
    return S * np.exp(-q*T) * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

def implied_vol_bisection(
    C_mkt: float, S: float, K: float, r: float, q: float, T: float,
    lo: float = 1e-4, hi: float = 10.0, tol: float = 1e-7, max_iter: int = 100,
) -> float:
    """
    Bisection for implied vol: guaranteed convergence, no gradient needed.
    Slower than Newton but robust for deep OTM, near-zero vega, or bad initial guesses.
    Combines Newton (fast near solution) with bisection (safe far from solution).
    """
    # Check bracket validity
    if bs_call_price(S, K, r, q, hi, T) < C_mkt:
        return float("nan")   # price above maximum BS price

    intrinsic = max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
    if C_mkt <= intrinsic:
        return lo   # price at or below intrinsic: vol ≈ 0

    for _ in range(max_iter):
        mid   = 0.5 * (lo + hi)
        price = bs_call_price(S, K, r, q, mid, T)
        if abs(price - C_mkt) < tol:
            return mid
        if price < C_mkt:
            lo = mid
        else:
            hi = mid

    return 0.5 * (lo + hi)

def implied_vol_brentq(
    C_mkt: float, S: float, K: float, r: float, q: float, T: float,
) -> float:
    """
    Brent's method: combines bisection, secant, and inverse quadratic interpolation.
    Superlinearly convergent (1.618× order) while maintaining bracket safety.
    Best of both worlds: Newton's speed near solution, bisection's robustness far away.
    """
    from scipy.optimize import brentq
    intrinsic = max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
    if C_mkt <= intrinsic + 1e-10:
        return 1e-6
    try:
        return float(brentq(
            lambda s: bs_call_price(S, K, r, q, s, T) - C_mkt,
            1e-6, 10.0, xtol=1e-8, maxiter=100
        ))
    except ValueError:
        return float("nan")`,
    explanation:
      "Bisection is O(log₂(range/tol)) iterations — for range [1e-4, 10] and tol = 1e-7, that is at most log₂(10/1e-7) ≈ 27 iterations, each requiring one BS evaluation. Newton-Raphson typically converges in 3-5 iterations but can diverge for deep OTM options where vega is near zero (the Newton step σ − error/vega diverges). Production systems use Newton with a bisection fallback: if the Newton step violates the bracket, switch to bisection for that step, giving the asymptotic speed of Newton with the global convergence guarantee of bisection.",
  },
  {
    id: "pyfin-20260613-b1-arb-surface-checks",
    language: "python",
    tag: "finance",
    title: "Volatility surface arbitrage checks — calendar, butterfly, and call spread",
    code: `import numpy as np
import pandas as pd
from scipy.stats import norm

def bs_call(S, K, r, q, sigma, T):
    if T <= 0 or sigma <= 0:
        return max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r-q+0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma * sqT
    return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def check_vol_surface_arbitrage(
    strikes: np.ndarray,    # (N_K,)
    expiries: np.ndarray,   # (N_T,)
    ivs: np.ndarray,        # (N_T, N_K) implied vol surface
    S: float, r: float, q: float = 0.0,
) -> dict:
    """
    Three no-arbitrage conditions for a BS implied vol surface:
    1. Call spread monotonicity: C(K1) >= C(K2) for K1 < K2 (non-negative density).
    2. Calendar spread: C(T1, K) <= C(T2, K) for T1 < T2 (time value).
    3. Butterfly positivity: C(K-dK) - 2*C(K) + C(K+dK) >= 0 (positive density).
       Equivalent: d^2C/dK^2 >= 0 (Breeden-Litzenberger condition).
    Violations indicate model misfits or data errors.
    """
    violations = {"call_spread": [], "calendar": [], "butterfly": []}

    # Compute call prices from IVs
    calls = np.zeros_like(ivs)
    for i, T in enumerate(expiries):
        for j, K in enumerate(strikes):
            calls[i, j] = bs_call(S, K, r, q, ivs[i, j], T)

    # 1. Call spread: C(K_j) >= C(K_{j+1}) for all i, j
    for i, T in enumerate(expiries):
        for j in range(len(strikes) - 1):
            if calls[i, j] < calls[i, j+1] - 1e-6:
                violations["call_spread"].append({
                    "expiry": T,
                    "strike_lo": strikes[j],
                    "strike_hi": strikes[j+1],
                    "spread": round(float(calls[i, j] - calls[i, j+1]), 6),
                })

    # 2. Calendar spread: C(T_i, K) <= C(T_{i+1}, K) for all j
    for i in range(len(expiries) - 1):
        for j, K in enumerate(strikes):
            if calls[i, j] > calls[i+1, j] + 1e-6:
                violations["calendar"].append({
                    "expiry_lo": expiries[i],
                    "expiry_hi": expiries[i+1],
                    "strike":    K,
                    "violation": round(float(calls[i, j] - calls[i+1, j]), 6),
                })

    # 3. Butterfly: C(K-dK) - 2C(K) + C(K+dK) >= 0 (positive risk-neutral density)
    for i, T in enumerate(expiries):
        for j in range(1, len(strikes) - 1):
            butterfly = calls[i, j-1] - 2*calls[i, j] + calls[i, j+1]
            if butterfly < -1e-6:
                violations["butterfly"].append({
                    "expiry": T,
                    "strike": strikes[j],
                    "value":  round(float(butterfly), 6),
                })

    return {
        "n_call_spread_violations": len(violations["call_spread"]),
        "n_calendar_violations":    len(violations["calendar"]),
        "n_butterfly_violations":   len(violations["butterfly"]),
        "violations":               violations,
        "surface_is_arbitrage_free": all(len(v) == 0 for v in violations.values()),
    }`,
    explanation:
      "The butterfly condition (C(K−ΔK) − 2C(K) + C(K+ΔK) ≥ 0) is the discrete Breeden-Litzenberger condition — violations imply a negative risk-neutral probability density, which would allow a static option portfolio to achieve a risk-free profit. Calendar violations (shorter-expiry call > longer-expiry call) allow arbitrage via buying the near and selling the far, while call-spread violations (lower strike cheaper than higher strike) are exploitable via a risk-free call spread. Real surfaces from interpolation or parametric models must pass all three checks before being used for hedging.",
  },
  {
    id: "pyfin-20260613-b1-drawdown-metrics",
    language: "python",
    tag: "finance",
    title: "Portfolio drawdown analysis — maximum drawdown, Calmar, and underwater curve",
    code: `import numpy as np
import pandas as pd

def drawdown_analysis(
    returns: pd.Series,   # daily or periodic returns (not log returns)
    ann_factor: float = 252.0,
) -> dict:
    """
    Compute drawdown statistics from a return series.
    Drawdown at t: (peak_value_up_to_t - value_t) / peak_value_up_to_t.
    Maximum drawdown (MDD): the worst peak-to-trough decline.
    Calmar ratio: annualised_return / |MDD| (measures return per unit of max drawdown).
    Recovery time: trading days from trough back to prior peak.
    """
    # Wealth index
    wealth = (1 + returns).cumprod()
    wealth.iloc[0] = wealth.iloc[0]   # ensure series integrity

    # Running maximum (high-water mark)
    hwm = wealth.cummax()

    # Drawdown series
    drawdown = (wealth - hwm) / hwm

    # Maximum drawdown and its location
    mdd_idx    = int(drawdown.idxmin() if hasattr(drawdown.index[0], 'date') else drawdown.argmin())
    mdd        = float(drawdown.iloc[mdd_idx])
    mdd_date   = drawdown.index[mdd_idx]

    # Peak before MDD
    peak_idx  = int(wealth.iloc[:mdd_idx+1].argmax())
    peak_date = drawdown.index[peak_idx]

    # Recovery: first date after MDD where wealth >= prior peak
    wealth_mdd = float(hwm.iloc[mdd_idx])
    recovery_idx = None
    for i in range(mdd_idx + 1, len(wealth)):
        if float(wealth.iloc[i]) >= wealth_mdd:
            recovery_idx = i
            break

    recovery_days = (recovery_idx - mdd_idx) if recovery_idx else None

    # Calmar ratio
    n_years  = len(returns) / ann_factor
    ann_ret  = float(wealth.iloc[-1] ** (1 / n_years) - 1) if n_years > 0 else 0
    calmar   = ann_ret / abs(mdd) if abs(mdd) > 1e-10 else np.inf

    # Distribution of drawdowns
    dd_series = drawdown[drawdown < -0.01]   # drawdowns > 1%

    # Conditional drawdown at risk (CDaR at 95%)
    cdar_95 = float(np.percentile(drawdown, 5))  # 5th percentile of drawdown (most negative)

    return {
        "max_drawdown_pct":  round(float(mdd * 100), 4),
        "mdd_start":         str(peak_date)[:10],
        "mdd_trough":        str(mdd_date)[:10],
        "recovery_days":     recovery_days,
        "calmar_ratio":      round(float(calmar), 4),
        "ann_return":        round(float(ann_ret * 100), 4),
        "cdar_95_pct":       round(float(cdar_95 * 100), 4),
        "pct_underwater":    round(float((drawdown < 0).mean() * 100), 2),
        "avg_drawdown_pct":  round(float(dd_series.mean() * 100), 4) if len(dd_series) > 0 else 0.0,
        "drawdown_series":   drawdown,
    }`,
    explanation:
      "Maximum drawdown is the single most important risk metric for trend-following and long-short equity strategies because institutional investors allocate and redeem based on drawdown tolerance — a 20% MDD often triggers redemptions even if the Sharpe ratio is high. The Calmar ratio (annual return / MDD) normalises performance by the worst realised pain: a Calmar of 1.0 means the strategy earned its MDD back in one year, while a value below 0.5 indicates the strategy is unlikely to recover before investor patience runs out.",
  },
  {
    id: "pyfin-20260613-b1-brinson-attribution",
    language: "python",
    tag: "finance",
    title: "Brinson-Hood-Beebower attribution — allocation, selection, interaction effects",
    code: `import numpy as np
import pandas as pd

def brinson_attribution(
    portfolio_weights: pd.Series,   # portfolio weights by sector (sum to 1)
    benchmark_weights: pd.Series,   # benchmark weights by sector (sum to 1)
    portfolio_returns: pd.Series,   # portfolio sector returns
    benchmark_returns: pd.Series,   # benchmark sector returns
) -> pd.DataFrame:
    """
    Brinson-Hood-Beebower (1986) attribution decomposes active return into:
    1. Allocation effect:  (wp - wb) * (rb - rb_total)
       Overweight a sector that outperformed the benchmark average.
    2. Selection effect:   wb * (rp - rb)
       Held benchmark weight but picked better stocks in the sector.
    3. Interaction effect: (wp - wb) * (rp - rb)
       Overweight AND picked better stocks (multiplicative effect).
    Total active return = sum(Allocation + Selection + Interaction).
    """
    df = pd.concat([
        portfolio_weights.rename("wp"),
        benchmark_weights.rename("wb"),
        portfolio_returns.rename("rp"),
        benchmark_returns.rename("rb"),
    ], axis=1).fillna(0)

    # Benchmark total return (weighted)
    rb_total = float((df["wb"] * df["rb"]).sum())
    rp_total = float((df["wp"] * df["rp"]).sum())

    # Attribution components
    df["allocation"]   = (df["wp"] - df["wb"]) * (df["rb"] - rb_total)
    df["selection"]    = df["wb"] * (df["rp"] - df["rb"])
    df["interaction"]  = (df["wp"] - df["wb"]) * (df["rp"] - df["rb"])
    df["active_return"]= df["allocation"] + df["selection"] + df["interaction"]

    # Active weight
    df["active_weight"] = df["wp"] - df["wb"]

    total = {
        "allocation":   round(float(df["allocation"].sum()), 6),
        "selection":    round(float(df["selection"].sum()), 6),
        "interaction":  round(float(df["interaction"].sum()), 6),
        "total_active": round(float(rp_total - rb_total), 6),
        "portfolio_ret": round(float(rp_total), 6),
        "benchmark_ret": round(float(rb_total), 6),
    }

    # Verify: allocation + selection + interaction ≈ total active return
    check = abs(total["allocation"] + total["selection"] + total["interaction"]
                - total["total_active"])

    result = df[["wp", "wb", "rp", "rb", "active_weight",
                 "allocation", "selection", "interaction"]].round(6)
    result.loc["TOTAL"] = result.sum()
    result.attrs["totals"] = total
    result.attrs["check"] = round(float(check), 8)

    return result`,
    explanation:
      "Brinson attribution is the industry standard for explaining why a portfolio outperformed or underperformed its benchmark: the allocation effect captures the macro decision (which sectors to overweight), the selection effect captures the micro decision (which stocks within the sector), and the interaction captures their multiplicative combination. A portfolio manager with positive selection but negative allocation is skilled at stock picking but makes offsetting sector bets — the decomposition reveals this clearly whereas total active return alone does not.",
  },
  {
    id: "pyfin-20260613-b1-merton-jump-py",
    language: "python",
    tag: "finance",
    title: "Merton jump-diffusion — closed-form European call via Poisson series",
    code: `import numpy as np
from scipy.stats import norm, poisson

def merton_jump_call(
    S: float, K: float, r: float, q: float, T: float,
    sigma: float,     # diffusion vol (GBM component)
    lam: float,       # jump intensity (jumps per year)
    mu_J: float,      # mean log-jump size (log of 1 + expected % jump)
    sigma_J: float,   # std of log-jump size
    n_terms: int = 40,
) -> dict:
    """
    Merton (1976) jump-diffusion call: series over number of jumps.
    C = sum_{n=0}^{inf} Poisson(lam_p*T, n) * BSCall(S, K, r_n, q, sigma_n, T)
    where:
      k_bar   = E[J-1] = exp(mu_J + 0.5*sigma_J^2) - 1  (mean jump size)
      lam_p   = lam * (1 + k_bar)      (risk-neutral intensity)
      sigma_n = sqrt(sigma^2 + n*sigma_J^2/T)  (total vol for n jumps)
      r_n     = r - lam*k_bar + n*(mu_J + 0.5*sigma_J^2)/T  (adj drift)
    """
    def bs_call(S, K, r_n, sigma_n, T):
        if sigma_n < 1e-10 or T <= 0:
            return max(S * np.exp(-q*T) - K * np.exp(-r_n*T), 0.0)
        sqT = np.sqrt(T)
        d1  = (np.log(S/K) + (r_n - q + 0.5*sigma_n**2)*T) / (sigma_n*sqT)
        d2  = d1 - sigma_n*sqT
        return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r_n*T)*norm.cdf(d2)

    k_bar  = np.exp(mu_J + 0.5 * sigma_J**2) - 1.0
    lam_p  = lam * (1.0 + k_bar)   # risk-neutral jump intensity

    price = 0.0
    log_poisson = 0.0   # log of Poisson PMF for numerical stability

    for n in range(n_terms + 1):
        if n > 0:
            log_poisson += np.log(lam_p * T) - np.log(n)
        p_n    = np.exp(log_poisson - lam_p * T)

        # Modified parameters for n jumps
        sig_n = np.sqrt(sigma**2 + n * sigma_J**2 / T)
        r_n   = r - lam * k_bar + n * (mu_J + 0.5 * sigma_J**2) / T

        price += p_n * bs_call(S, K, r_n, sig_n, T)

    # BS price without jumps (sigma only, for comparison)
    bs_only = bs_call(S, K, r, sigma, T)

    # Implied vol from Merton price (approximate)
    from scipy.optimize import brentq
    try:
        merton_iv = brentq(
            lambda s: bs_call(S, K, r, s, T) - price,
            1e-4, 10.0, xtol=1e-8
        )
    except ValueError:
        merton_iv = float("nan")

    return {
        "price":           round(float(price), 6),
        "bs_price":        round(float(bs_only), 6),
        "jump_premium":    round(float(price - bs_only), 6),
        "merton_iv":       round(float(merton_iv), 6),
        "k_bar":           round(float(k_bar), 6),
        "lam_p":           round(float(lam_p), 4),
        "expected_jumps":  round(float(lam * T), 4),
    }`,
    explanation:
      "The Merton series converges rapidly because Poisson PMF decays exponentially — for λT = 3, terms beyond n = 10 contribute less than 0.1% to the total price. The 'jump premium' (Merton price minus BS price) is always positive for ATM options because jumps add kurtosis to the return distribution, fattening the tails beyond what the BS normal distribution captures. The Merton implied vol (backing out the BS vol that matches the Merton price) exceeds the diffusion sigma, explaining the observed 'vol smile' as the market's pricing of jump risk.",
  },
  {
    id: "pyfin-20260613-b1-garch-cvar",
    language: "python",
    tag: "finance",
    title: "GARCH conditional VaR — time-varying volatility for dynamic risk limits",
    code: `import numpy as np
from scipy.stats import norm, t as student_t

def garch_cvar(
    returns: np.ndarray,
    confidence: float = 0.99,
    horizon_days: int = 1,
    omega: float = None,
    alpha: float = 0.10,
    beta: float  = 0.85,
    use_t: bool  = True,   # Student-t innovations for fat tails
    nu: int = 6,           # degrees of freedom for t-distribution
    notional: float = 1_000_000,
) -> dict:
    """
    GARCH-based VaR/CVaR:
    1. Fit (or use provided) GARCH(1,1) parameters.
    2. Compute current conditional variance sigma_t^2.
    3. Scale by sqrt(horizon) for multi-day VaR (approximation).
    4. Compute parametric VaR: sigma_t * z_alpha (or t_nu quantile).
    5. CVaR (Expected Shortfall): E[loss | loss > VaR].
    """
    T = len(returns)
    r = returns - returns.mean()

    # Compute GARCH variance path
    if omega is None:
        omega = float(np.var(r)) * (1 - alpha - beta)
    var = np.zeros(T)
    var[0] = omega / max(1 - alpha - beta, 1e-8)
    for t in range(1, T):
        var[t] = omega + alpha * r[t-1]**2 + beta * var[t-1]

    sigma_current = float(np.sqrt(var[-1]))

    # Multi-day scaling (square-root of time approximation)
    sigma_horizon = sigma_current * np.sqrt(horizon_days)

    # Quantile (z or t)
    if use_t:
        q_alpha = float(student_t.ppf(1 - confidence, df=nu))
        # CVaR for t-distribution: -E[X | X < q] = sigma * t_pdf(q) / (1-c) * (nu+q^2)/(nu-1)
        pdf_q = float(student_t.pdf(q_alpha, df=nu))
        cvar_z = -sigma_horizon * pdf_q / (1 - confidence) * (nu + q_alpha**2) / (nu - 1)
    else:
        q_alpha = float(norm.ppf(1 - confidence))
        cvar_z  = sigma_horizon * norm.pdf(q_alpha) / (1 - confidence)

    var_pct  = -q_alpha * sigma_horizon    # positive number (loss)
    cvar_pct = cvar_z

    # Historical VaR for comparison
    hist_var  = float(-np.percentile(r, (1 - confidence) * 100))
    hist_cvar = float(-r[r < -hist_var].mean()) if len(r[r < -hist_var]) > 0 else hist_var

    return {
        "sigma_1day":      round(float(sigma_current) * np.sqrt(252), 4),   # annualised
        "sigma_horizon":   round(float(sigma_horizon), 6),
        "VaR_pct":         round(float(var_pct * 100), 4),
        "CVaR_pct":        round(float(cvar_pct * 100), 4),
        "VaR_usd":         round(float(var_pct * notional), 0),
        "CVaR_usd":        round(float(cvar_pct * notional), 0),
        "hist_VaR_pct":    round(float(hist_var * 100), 4),
        "hist_CVaR_pct":   round(float(hist_cvar * 100), 4),
        "garch_alpha":     alpha,
        "garch_beta":      beta,
        "innovation_dist": "t" if use_t else "normal",
        "horizon_days":    horizon_days,
    }`,
    explanation:
      "GARCH-based VaR is superior to historical VaR during volatility regime changes: it correctly widens risk limits immediately after a volatility spike rather than waiting for the historical window to fill with the new regime. The Student-t innovation distribution captures the excess kurtosis of financial returns beyond what GARCH heteroskedasticity explains — equity returns have empirical kurtosis of 5-10, while GARCH with normal innovations produces kurtosis of 3 + 6α²/(1−3α²−2αβ−β²) ≈ 4-5 for typical parameters.",
  },
  {
    id: "pyfin-20260613-b1-min-var-analytical",
    language: "python",
    tag: "finance",
    title: "Global minimum variance portfolio — analytical solution and sensitivity",
    code: `import numpy as np

def global_min_variance(
    Sigma: np.ndarray,      # (N, N) covariance matrix
    allow_short: bool = False,
    regularise: float = 1e-6,   # add lambda*I to improve conditioning
) -> dict:
    """
    Global minimum variance (GMV) portfolio: min w'Sigma w s.t. sum(w) = 1.
    Analytical solution (unconstrained): w_GMV = Sigma^{-1} 1 / (1' Sigma^{-1} 1).
    With long-only constraint: solve via QP (scipy) or iterative re-weighting.
    Does NOT require expected return estimates — purely from Sigma.
    Sensitivity: GMV is robust to estimation error compared to mean-variance.
    """
    N = Sigma.shape[0]
    ones = np.ones(N)

    # Regularise for numerical stability (adds constant to diagonal)
    Sigma_reg = Sigma + regularise * np.eye(N)

    if allow_short:
        # Analytical closed form
        Sigma_inv = np.linalg.inv(Sigma_reg)
        numer     = Sigma_inv @ ones
        denom     = float(ones @ Sigma_inv @ ones)
        w_gmv     = numer / denom
        converged = True
    else:
        # QP with long-only: scipy
        from scipy.optimize import minimize
        def objective(w):
            return float(w @ Sigma_reg @ w)
        def grad(w):
            return 2 * Sigma_reg @ w

        x0 = ones / N
        res = minimize(
            objective, x0,
            jac=grad,
            method="SLSQP",
            bounds=[(0, 1)] * N,
            constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1}],
            options={"ftol": 1e-12, "maxiter": 2000},
        )
        w_gmv     = np.array(res.x)
        converged = bool(res.success)

    # Portfolio statistics
    port_var = float(w_gmv @ Sigma @ w_gmv)
    port_vol = np.sqrt(max(port_var, 0))

    # Marginal risk contributions: (Sigma @ w) / port_vol
    mrc   = (Sigma @ w_gmv) / max(port_vol, 1e-10)
    rc    = w_gmv * mrc    # risk contribution per asset
    rc_pct = rc / max(port_vol, 1e-10)

    # Effective N (diversification measure: 1/HHI of risk contributions)
    hhi = float(np.sum(rc_pct**2))
    eff_n = 1 / hhi if hhi > 0 else N

    return {
        "weights":     w_gmv.round(6).tolist(),
        "portfolio_vol": round(float(port_vol * np.sqrt(252)), 4),   # annualised
        "portfolio_var": round(float(port_var), 8),
        "risk_contribs": rc_pct.round(6).tolist(),
        "effective_n":   round(float(eff_n), 2),
        "n_assets":      N,
        "long_only":     not allow_short,
        "converged":     converged,
    }`,
    explanation:
      "The GMV portfolio requires only the covariance matrix as input — not expected returns — making it robust to the estimation error that plagues mean-variance optimisation. The effective N (reciprocal of the Herfindahl index of risk contributions) measures diversification: a GMV portfolio with effective N = 5 draws 80% of its risk from 5 'effective assets' even if it holds 50 positions. In practice, the long-only GMV portfolio concentrates heavily in low-volatility, low-correlation assets (defensive sectors) and is used as a benchmark for minimum volatility ETFs.",
  },
];
