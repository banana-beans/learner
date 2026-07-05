import type { Snippet } from "./types";

export const pythonFinanceSnippets20260705B1: Snippet[] = [
  {
    id: "pyfin-20260705-b1-garman-kohlhagen",
    language: "python",
    title: "Garman-Kohlhagen FX Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def garman_kohlhagen(
    S: float,       # spot FX rate (domestic per foreign)
    K: float,       # strike
    T: float,       # time to expiry (years)
    r_d: float,     # domestic risk-free rate
    r_f: float,     # foreign risk-free rate
    sigma: float,   # implied vol
    option_type: str = "call",
) -> dict:
    """Garman-Kohlhagen = Black-Scholes with foreign rate as dividend yield."""
    sqT = np.sqrt(T)
    d1 = (np.log(S / K) + (r_d - r_f + 0.5 * sigma**2) * T) / (sigma * sqT)
    d2 = d1 - sigma * sqT

    disc_d = np.exp(-r_d * T)
    disc_f = np.exp(-r_f * T)

    if option_type == "call":
        price = S * disc_f * norm.cdf(d1) - K * disc_d * norm.cdf(d2)
        delta = disc_f * norm.cdf(d1)
    else:
        price = K * disc_d * norm.cdf(-d2) - S * disc_f * norm.cdf(-d1)
        delta = -disc_f * norm.cdf(-d1)

    vega  = S * disc_f * norm.pdf(d1) * sqT
    gamma = disc_f * norm.pdf(d1) / (S * sigma * sqT)
    return {"price": price, "delta": delta, "gamma": gamma,
            "vega": vega, "d1": d1, "d2": d2}`,
    explanation:
      "The Garman-Kohlhagen formula treats the foreign risk-free rate as a continuous dividend yield in the Black-Scholes framework; the FX spot earns foreign interest while the domestic rate discounts. Delta is quoted in foreign notional units — a USD/EUR call with delta=0.6 means buying 0.6 EUR of spot to hedge one call option.",
  },
  {
    id: "pyfin-20260705-b1-merton-jump-diffusion",
    language: "python",
    title: "Merton Jump-Diffusion Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, poisson

def merton_jump_call(
    S: float, K: float, T: float, r: float, sigma: float,
    lam: float,    # Poisson jump intensity (jumps per year)
    mu_j: float,   # mean log jump size
    sigma_j: float,# std dev of log jump size
    n_terms: int = 50,
) -> float:
    """Merton (1976) jump-diffusion: sum over Poisson-weighted BS calls."""
    k_bar = np.exp(mu_j + 0.5 * sigma_j**2) - 1  # mean jump factor - 1
    lam_prime = lam * (1 + k_bar)                  # risk-neutral intensity

    price = 0.0
    for n in range(n_terms):
        # Poisson weight for n jumps
        w = poisson.pmf(n, lam_prime * T)
        if w < 1e-12:
            continue
        # Adjusted parameters for n jumps
        r_n     = r - lam * k_bar + n * (mu_j + 0.5 * sigma_j**2) / T
        sigma_n = np.sqrt(sigma**2 + n * sigma_j**2 / T)

        sqT = np.sqrt(T)
        d1  = (np.log(S / K) + (r_n + 0.5 * sigma_n**2) * T) / (sigma_n * sqT)
        d2  = d1 - sigma_n * sqT
        bs  = S * norm.cdf(d1) - K * np.exp(-r_n * T) * norm.cdf(d2)
        price += w * bs

    return price`,
    explanation:
      "Merton's model adds a compound Poisson jump process to GBM, capturing the fat tails and skew seen in equity returns. Each term in the series is a Black-Scholes price conditioned on exactly n jumps occurring; the Poisson weights sum to 1. The risk-neutral intensity lam' = lam*(1+k_bar) adjusts for the drift correction needed to preserve the martingale property.",
  },
  {
    id: "pyfin-20260705-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def heston_mc(
    S0: float, K: float, T: float, r: float,
    v0: float,     # initial variance
    kappa: float,  # mean-reversion speed
    theta: float,  # long-run variance
    sigma_v: float,# vol of vol
    rho: float,    # correlation between S and v
    n_steps: int = 252,
    n_paths: int = 100_000,
    seed: int = 0,
) -> dict:
    """Euler-Maruyama discretization of Heston model."""
    rng = np.random.default_rng(seed)
    dt  = T / n_steps

    S = np.full(n_paths, S0, dtype=float)
    v = np.full(n_paths, v0, dtype=float)

    sqrt_dt = np.sqrt(dt)
    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rng.standard_normal(n_paths)
        # Cholesky decomposition of correlation
        Zs = Z1
        Zv = rho * Z1 + np.sqrt(1 - rho**2) * Z2

        v_pos = np.maximum(v, 0.0)  # full truncation scheme
        S *= np.exp((r - 0.5 * v_pos) * dt + np.sqrt(v_pos) * sqrt_dt * Zs)
        v  = v_pos + kappa * (theta - v_pos) * dt + sigma_v * np.sqrt(v_pos) * sqrt_dt * Zv

    payoffs = np.maximum(S - K, 0.0) * np.exp(-r * T)
    price = payoffs.mean()
    se    = payoffs.std() / np.sqrt(n_paths)
    return {"price": price, "se": se, "ci_95": (price - 1.96*se, price + 1.96*se)}`,
    explanation:
      "Heston's model allows correlation between spot and variance, producing the volatility smile. rho < 0 (typical for equities) creates negative skew: down moves coincide with vol spikes. The full-truncation scheme (max(v,0)) prevents variance from going negative due to discretization error — more stable than reflection but slightly biased; the Quadratic-Exponential scheme is the production standard.",
  },
  {
    id: "pyfin-20260705-b1-arima-forecast",
    language: "python",
    title: "ARIMA(p,d,q) Volatility Forecasting with statsmodels",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import warnings

def arima_vol_forecast(
    returns: pd.Series,
    horizon: int = 5,
    max_order: int = 3,
) -> dict:
    """Select ARIMA order by AIC and produce rolling h-step ahead forecasts."""
    # Compute realised vol (21-day rolling)
    rv = returns.rolling(21).std() * np.sqrt(252)
    rv = rv.dropna()

    # ADF test: choose d (d=1 if non-stationary)
    adf_pval = adfuller(rv, maxlags=1, autolag=None)[1]
    d = 1 if adf_pval > 0.05 else 0
    rv_fit = rv.diff(d).dropna() if d > 0 else rv

    # Grid search p, q by AIC
    best_aic, best_order = np.inf, (1, d, 1)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        for p in range(max_order + 1):
            for q in range(max_order + 1):
                try:
                    aic = ARIMA(rv_fit, order=(p, 0, q)).fit().aic
                    if aic < best_aic:
                        best_aic, best_order = aic, (p, d, q)
                except Exception:
                    pass

    model = ARIMA(rv if d == 0 else rv_fit, order=best_order).fit()
    fc    = model.forecast(steps=horizon)
    return {"best_order": best_order, "aic": best_aic,
            "forecast": fc.tolist(), "last_rv": float(rv.iloc[-1])}`,
    explanation:
      "ARIMA on realised volatility captures the autocorrelation structure (high vol tends to persist — 'volatility clustering'). The ADF test determines integration order d; AIC-based grid search balances goodness-of-fit against model complexity. ARIMA forecasts mean-revert to the long-run level, unlike GARCH which updates conditionally on each new observation.",
  },
  {
    id: "pyfin-20260705-b1-pca-yield-curve",
    language: "python",
    title: "PCA Factor Decomposition of the Yield Curve",
    tag: "finance",
    code: `import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import pandas as pd

def yield_curve_pca(
    yields: pd.DataFrame,   # columns = maturities (e.g. '2Y','5Y','10Y','30Y')
    n_components: int = 3,
) -> dict:
    """
    PCA on yield changes.
    PC1 ~ level (parallel shift), PC2 ~ slope (twist), PC3 ~ curvature (butterfly).
    """
    changes = yields.diff().dropna()
    scaler  = StandardScaler(with_std=False)  # demean but don't scale
    X       = scaler.fit_transform(changes)

    pca = PCA(n_components=n_components)
    scores = pca.fit_transform(X)  # time series of factor scores

    explained = pca.explained_variance_ratio_
    loadings   = pd.DataFrame(
        pca.components_.T,
        index=yields.columns,
        columns=[f"PC{i+1}" for i in range(n_components)],
    )
    # DV01 attribution: how much of each tenor's DV01 comes from each factor
    factor_scores = pd.DataFrame(
        scores, index=changes.index,
        columns=[f"PC{i+1}" for i in range(n_components)],
    )
    return {
        "explained_variance": explained.tolist(),
        "cumulative_explained": np.cumsum(explained).tolist(),
        "loadings": loadings,
        "factor_scores": factor_scores,
        "level_factor": loadings["PC1"].values,
        "slope_factor": loadings["PC2"].values,
        "curve_factor": loadings["PC3"].values,
    }`,
    explanation:
      "The first three PCs of yield changes typically explain >95% of variance: PC1 (level) shifts all tenors equally, PC2 (slope) tilts the curve short vs long, PC3 (curvature) captures the belly vs wings. PCA-based hedging reduces a 10-tenor book to 3 factor exposures, dramatically reducing the number of hedge instruments needed.",
  },
  {
    id: "pyfin-20260705-b1-hull-white",
    language: "python",
    title: "Hull-White One-Factor Short Rate Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def hull_white_simulate(
    r0: float, a: float, sigma: float,
    theta_t,           # callable theta(t): time-dependent mean reversion level
    T: float, n_steps: int, n_paths: int, seed: int = 0
) -> dict:
    """
    dr = a*(theta(t) - r)*dt + sigma*dW
    theta(t) calibrated to match the initial term structure.
    For flat curve at r_mkt: theta(t) = r_mkt + sigma^2/(2a) * (1 - exp(-2at)).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = r0

    for t in range(n_steps):
        t_mid = (t + 0.5) * dt
        r_t   = paths[:, t]
        th    = theta_t(t_mid)
        dW    = rng.standard_normal(n_paths) * np.sqrt(dt)
        paths[:, t + 1] = r_t + a * (th - r_t) * dt + sigma * dW

    # Zero-coupon bond: P(0,T) = E[exp(-integral r_t dt)]
    integrals = paths[:, 1:].mean(axis=1) * T
    zcb       = np.exp(-integrals).mean()
    rates     = paths[:, -1]
    return {
        "paths": paths,
        "zcb_price": zcb,
        "terminal_rate_mean": rates.mean(),
        "terminal_rate_std":  rates.std(),
    }

# Example: calibrate to flat 5% curve
def theta_flat(t, r_mkt=0.05, a=0.5, sigma=0.01):
    return r_mkt + sigma**2 / (2 * a) * (1 - np.exp(-2 * a * t))

result = hull_white_simulate(
    r0=0.05, a=0.5, sigma=0.01,
    theta_t=lambda t: theta_flat(t),
    T=5.0, n_steps=60, n_paths=10_000
)`,
    explanation:
      "Hull-White is a Gaussian short-rate model: rates can go negative (consistent with observed post-2008 rates) and the model can be exactly calibrated to any initial term structure by choosing theta(t). Unlike CIR, HW has tractable analytic formulas for bond and swaption prices. The flat-curve theta formula ensures the model prices the current yield curve exactly on day one.",
  },
  {
    id: "pyfin-20260705-b1-risk-parity",
    language: "python",
    title: "Risk Parity Portfolio via Scipy Optimization",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_parity(sigma: np.ndarray) -> dict:
    """Equal risk contribution portfolio: each asset contributes equally to total risk."""
    n = sigma.shape[0]

    def risk_contributions(w: np.ndarray) -> np.ndarray:
        port_var = w @ sigma @ w
        marginal  = sigma @ w                # marginal risk = partial derivative of vol
        rc        = w * marginal / np.sqrt(port_var)  # risk contribution per asset
        return rc

    def objective(w: np.ndarray) -> float:
        # Minimise sum of squared pairwise differences in risk contributions
        rc   = risk_contributions(w)
        rc_bar = rc.mean()
        return float(np.sum((rc - rc_bar)**2))

    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1}]
    bounds      = [(1e-4, 1.0)] * n
    w0          = np.ones(n) / n

    res = minimize(objective, w0, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": 1e-12, "maxiter": 1000})

    w   = res.x
    rc  = risk_contributions(w)
    vol = np.sqrt(w @ sigma @ w)
    return {"weights": w, "risk_contributions": rc,
            "portfolio_vol": vol, "converged": res.success}`,
    explanation:
      "Risk parity equalises risk contributions: if assets have different volatilities, risk parity overweights low-vol assets compared to equal-weight. This is different from min-variance (which concentrates in low-vol assets) or mean-variance (which requires expected return estimates). The objective function penalises dispersion in risk contributions, converging to the equal-risk portfolio.",
  },
  {
    id: "pyfin-20260705-b1-drawdown-analysis",
    language: "python",
    title: "Maximum Drawdown and Drawdown Duration Analysis",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def drawdown_analysis(returns: pd.Series) -> dict:
    """Comprehensive drawdown metrics for a return series."""
    cum = (1 + returns).cumprod()
    rolling_max = cum.cummax()
    drawdown    = (cum - rolling_max) / rolling_max  # always <= 0

    max_dd      = drawdown.min()
    max_dd_date = drawdown.idxmin()

    # Find peak before the trough
    peak_date   = cum[:max_dd_date].idxmax()

    # Recovery date: first time cum returns to rolling_max after trough
    recovery_series = cum[max_dd_date:] >= rolling_max[max_dd_date]
    recovery_date   = recovery_series[recovery_series].index[0] \
                      if recovery_series.any() else None

    # Drawdown duration
    dd_duration = (max_dd_date - peak_date).days if hasattr(max_dd_date, 'days') \
                  else int(max_dd_date - peak_date)

    # Calmar ratio: annualized return / abs(max drawdown)
    ann_return = (cum.iloc[-1] ** (252 / len(returns)) - 1)
    calmar     = ann_return / abs(max_dd) if max_dd != 0 else np.inf

    # All drawdown periods
    in_dd = drawdown < 0
    segments = (in_dd != in_dd.shift()).cumsum()
    dd_periods = [grp[grp < 0].min() for _, grp in drawdown.groupby(segments) if (grp < 0).any()]

    return {
        "max_drawdown": max_dd,
        "peak_date": peak_date,
        "trough_date": max_dd_date,
        "recovery_date": recovery_date,
        "drawdown_duration_days": dd_duration,
        "calmar_ratio": calmar,
        "n_drawdown_periods": len(dd_periods),
        "avg_drawdown": np.mean(dd_periods) if dd_periods else 0.0,
    }`,
    explanation:
      "Maximum drawdown measures peak-to-trough decline and is the primary risk metric for CTAs and hedge funds. Calmar ratio (return / max drawdown) is preferred over Sharpe for strategies with fat left tails because it directly penalises the worst historical loss. Recovery duration distinguishes a temporary drawdown from a permanent impairment of capital.",
  },
  {
    id: "pyfin-20260705-b1-rolling-beta",
    language: "python",
    title: "Rolling Beta and Information Ratio via Pandas",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

def rolling_factor_metrics(
    portfolio: pd.Series,
    benchmark: pd.Series,
    window: int = 63,   # ~3 months of trading days
) -> pd.DataFrame:
    """Rolling beta, alpha, tracking error, and information ratio."""
    excess_port  = portfolio
    excess_bench = benchmark

    # Rolling covariance and variance for beta
    rolling_cov  = excess_port.rolling(window).cov(excess_bench)
    rolling_var  = excess_bench.rolling(window).var()
    rolling_beta = rolling_cov / rolling_var

    # Rolling alpha: annualized intercept from rolling OLS
    rolling_alpha = (
        excess_port.rolling(window).mean()
        - rolling_beta * excess_bench.rolling(window).mean()
    ) * 252

    # Tracking error: std dev of active return
    active        = excess_port - excess_bench
    tracking_err  = active.rolling(window).std() * np.sqrt(252)

    # Information ratio: annualized alpha / tracking error
    info_ratio    = rolling_alpha / tracking_err

    # Sortino ratio: downside deviation (negative returns only)
    def downside_std(x):
        neg = x[x < 0]
        return neg.std() * np.sqrt(252) if len(neg) > 1 else np.nan

    sortino_denom = excess_port.rolling(window).apply(downside_std, raw=True)
    sortino       = excess_port.rolling(window).mean() * 252 / sortino_denom

    return pd.DataFrame({
        "beta":          rolling_beta,
        "alpha_ann":     rolling_alpha,
        "tracking_err":  tracking_err,
        "info_ratio":    info_ratio,
        "sortino":       sortino,
    })`,
    explanation:
      "Rolling beta reveals how market sensitivity changes over time — a strategy with time-varying beta is not truly market-neutral even if its full-sample beta is zero. The information ratio (alpha / tracking error) is the standard performance metric for active managers; an IR > 0.5 is considered good. Sortino replaces volatility with downside deviation, giving credit for upside variability.",
  },
  {
    id: "pyfin-20260705-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Dynamic Hedge Ratio for Pairs Trading",
    tag: "finance",
    code: `import numpy as np

def kalman_pairs_filter(
    y1: np.ndarray,   # price series of asset 1
    y2: np.ndarray,   # price series of asset 2
    delta: float = 1e-4,  # state noise variance (higher = more responsive)
    R: float = 1e-2,      # observation noise variance
) -> dict:
    """
    State: beta (hedge ratio), alpha (intercept) — both time-varying.
    Observation: y1_t = alpha_t + beta_t * y2_t + eps_t
    Kalman filter tracks the time-varying cointegrating vector.
    """
    n = len(y1)
    # State vector: [alpha, beta]; 2x1
    x_hat = np.zeros(2)
    P     = np.eye(2)           # state covariance
    Q     = delta * np.eye(2)   # process noise

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spread = np.zeros(n)

    for t in range(n):
        # Observation matrix: H_t = [1, y2_t]
        H = np.array([1.0, y2[t]])

        # Predict
        x_pred = x_hat
        P_pred = P + Q

        # Innovation
        y_pred = H @ x_pred
        innov  = y1[t] - y_pred
        S      = H @ P_pred @ H + R  # innovation variance

        # Update
        K       = P_pred @ H / S     # Kalman gain
        x_hat   = x_pred + K * innov
        P       = (np.eye(2) - np.outer(K, H)) @ P_pred

        alphas[t] = x_hat[0]
        betas[t]  = x_hat[1]
        spread[t] = innov

    z_score = (spread - spread.mean()) / (spread.std() + 1e-9)
    return {"alpha": alphas, "beta": betas, "spread": spread, "zscore": z_score}`,
    explanation:
      "The Kalman filter tracks a time-varying hedge ratio by treating it as an unobserved state variable; this outperforms static OLS regression for non-stationary pairs. The process noise variance delta controls adaptation speed: larger delta means the filter trusts new observations more and adapts faster (faster to structural regime changes but noisier). The innovation (residual) is the spread signal used for entry/exit.",
  },
  {
    id: "pyfin-20260705-b1-vasicek-model",
    language: "python",
    title: "Vasicek Short Rate Model: Bond Pricing and Calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def vasicek_zcb_price(r0: float, kappa: float, theta: float,
                       sigma: float, T: float) -> float:
    """Analytic zero-coupon bond price under Vasicek model."""
    B = (1 - np.exp(-kappa * T)) / kappa
    A = np.exp(
        (theta - sigma**2 / (2 * kappa**2)) * (B - T)
        - sigma**2 * B**2 / (4 * kappa)
    )
    return A * np.exp(-B * r0)

def vasicek_yield_curve(
    r0: float, kappa: float, theta: float, sigma: float,
    maturities: np.ndarray
) -> np.ndarray:
    """Yield curve: y(T) = -log(P(0,T)) / T"""
    prices = np.array([vasicek_zcb_price(r0, kappa, theta, sigma, T)
                       for T in maturities])
    return -np.log(prices) / maturities

def calibrate_vasicek(
    maturities: np.ndarray, market_yields: np.ndarray, r0: float
) -> dict:
    def obj(params):
        kappa, theta, sigma = params
        if kappa <= 0 or sigma <= 0:
            return 1e10
        model_yields = vasicek_yield_curve(r0, kappa, theta, sigma, maturities)
        return np.sum((model_yields - market_yields)**2)

    res = minimize(obj, x0=[0.5, 0.04, 0.01], method="Nelder-Mead")
    kappa, theta, sigma = res.x
    fitted = vasicek_yield_curve(r0, kappa, theta, sigma, maturities)
    return {"kappa": kappa, "theta": theta, "sigma": sigma,
            "fitted_yields": fitted, "rmse": np.sqrt(res.fun / len(maturities))}`,
    explanation:
      "Vasicek is the first analytically tractable mean-reverting rate model: kappa controls speed of mean-reversion, theta is the long-run rate, sigma is the rate volatility. Unlike CIR, Vasicek allows negative rates (a feature or bug depending on the era). The closed-form ZCB price P(0,T) = A(T)*exp(-B(T)*r0) enables fast calibration to the observed yield curve.",
  },
  {
    id: "pyfin-20260705-b1-bond-duration-convexity",
    language: "python",
    title: "Bond Duration, Convexity and Price Sensitivity",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def bond_analytics(
    face: float, coupon_rate: float, ytm: float,
    maturity: float, freq: int = 2
) -> dict:
    """Macaulay duration, modified duration, convexity, and DV01."""
    periods = int(maturity * freq)
    coupon  = face * coupon_rate / freq
    t_vals  = np.arange(1, periods + 1) / freq

    disc    = (1 + ytm / freq) ** (-np.arange(1, periods + 1))
    cf      = np.full(periods, coupon)
    cf[-1] += face                          # add principal at maturity

    pv_cf     = cf * disc
    price     = pv_cf.sum()

    # Macaulay duration: weighted average time to cash flow
    mac_dur   = (t_vals * pv_cf).sum() / price
    # Modified duration: mac_dur / (1 + y/freq)
    mod_dur   = mac_dur / (1 + ytm / freq)

    # Convexity
    convexity = (((t_vals * (t_vals + 1/freq)) * pv_cf).sum()
                 / (price * (1 + ytm / freq)**2))

    dv01      = -mod_dur * price * 0.0001   # $ per 1bp per $face

    # Approx price change for arbitrary yield shift
    def approx_price_change(dy: float) -> float:
        return -mod_dur * price * dy + 0.5 * convexity * price * dy**2

    return {
        "price": price, "yield": ytm,
        "macaulay_duration": mac_dur,
        "modified_duration": mod_dur,
        "convexity": convexity,
        "dv01": dv01,
        "approx_50bp_move": approx_price_change(0.005),
    }

# 5Y 5% coupon bond at par
result = bond_analytics(face=1000, coupon_rate=0.05, ytm=0.05,
                         maturity=5.0, freq=2)`,
    explanation:
      "Macaulay duration is the weighted average time to cash flow receipt; modified duration converts this to price sensitivity (% price change per 1% yield change). Convexity captures the positive curvature that benefits bondholders: a bond gains more when yields fall than it loses when yields rise by the same amount. DV01 (dollar value of a basis point) is the standard risk metric for bond trading desks.",
  },
  {
    id: "pyfin-20260705-b1-pandas-rolling-corr",
    language: "python",
    title: "Rolling Correlation Matrix and Eigenvalue Risk Decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.linalg import eigh

def rolling_correlation_risk(
    returns: pd.DataFrame,   # columns = assets
    window: int = 63,
    n_components: int = 3,
) -> pd.DataFrame:
    """
    Rolling correlation matrix eigenvalue decomposition.
    Track systemic risk: largest eigenvalue captures 'market mode'.
    """
    results = []
    for end in range(window, len(returns) + 1):
        sub = returns.iloc[end - window:end]
        corr = sub.corr().values
        # Sorted descending eigenvalues
        eigvals = np.sort(eigh(corr, eigvals_only=True))[::-1]

        # Absorption ratio: fraction of variance in top k factors
        total_var = eigvals.sum()
        absorption = eigvals[:n_components].sum() / total_var

        results.append({
            "date":          returns.index[end - 1],
            "lambda_1":      eigvals[0],       # systemic risk proxy
            "lambda_2":      eigvals[1],
            "absorption":    absorption,
            "avg_pairwise":  (corr.sum() - np.trace(corr)) / (corr.shape[0]**2 - corr.shape[0]),
        })

    df = pd.DataFrame(results).set_index("date")
    return df

# High lambda_1 and high absorption_ratio => high systemic correlation (crisis mode)
# Used as a leading indicator: rising absorption often precedes market stress`,
    explanation:
      "The largest eigenvalue of the correlation matrix captures the 'market mode' — how much all assets move together. During crises, correlations spike and the absorption ratio (top-3 eigenvalues / total) rises sharply toward 1. Tracking rolling absorption is a systemic risk indicator used by risk managers to identify when diversification benefits are eroding.",
  },
  {
    id: "pyfin-20260705-b1-fft-option-pricing",
    language: "python",
    title: "Carr-Madan FFT Option Pricing via Characteristic Function",
    tag: "finance",
    code: `import numpy as np
from scipy.fft import fft

def carr_madan_fft(
    char_func,          # characteristic function phi(u) of log(S_T)
    S0: float, K: float, r: float, T: float,
    N: int = 4096, eta: float = 0.25, alpha: float = 1.5,
) -> float:
    """
    Carr-Madan (1999): option price via FFT of the characteristic function.
    Works for any model with a known char function (Heston, VG, CGMY, etc.).
    """
    lam  = 2 * np.pi / (N * eta)  # log-strike spacing
    k    = -N * lam / 2 + lam * np.arange(N)  # log-strike grid
    beta = np.log(S0) + r * T       # log-forward

    # Characteristic function evaluated on a shifted contour
    v = np.arange(N) * eta
    psi_v = (np.exp(-r * T) * char_func(v - (alpha + 1) * 1j)
             / (alpha**2 + alpha - v**2 + 1j * (2*alpha + 1) * v))

    # Apply Simpson weights
    w = np.ones(N)
    w[0] = w[-1] = 1/3
    w[1:-1:2] = 4/3
    w[2:-2:2] = 2/3

    x = np.exp(1j * v * (k[0] - beta)) * psi_v * eta * w
    prices = np.real(np.exp(-alpha * k) / np.pi * fft(x))

    # Interpolate at desired log-strike
    log_k = np.log(K) - beta
    idx   = int((log_k - k[0]) / lam)
    if idx < 0 or idx >= N - 1:
        return np.nan
    frac  = (log_k - k[idx]) / lam
    return float(prices[idx] * (1 - frac) + prices[idx + 1] * frac)

# Example: use Black-Scholes characteristic function
def bs_char(u, S0=100, r=0.05, T=1.0, sigma=0.20):
    log_s = np.log(S0)
    return np.exp(1j * u * (log_s + (r - 0.5*sigma**2)*T)
                  - 0.5 * sigma**2 * T * u**2)`,
    explanation:
      "The Carr-Madan method prices European options for any model with a known characteristic function using a single FFT pass — O(N log N) for a full smile across strikes. This is the standard production method for Heston, Variance Gamma, and CGMY models where the PDF has no closed form but the characteristic function is analytic. The dampening factor alpha regularises the integral; alpha=1.5 is the standard choice.",
  },
  {
    id: "pyfin-20260705-b1-transaction-cost-model",
    language: "python",
    title: "Transaction Cost Model with Market Impact and Slippage",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def transaction_cost_model(
    trades: pd.DataFrame,  # columns: symbol, side, qty, price, adv
    spread_bps: float = 2.0,
    impact_coefficient: float = 0.1,   # sqrt-impact model
    timing_alpha: float = 0.6,         # Almgren: power of qty/adv
) -> pd.DataFrame:
    """
    Total cost = spread cost + market impact + timing risk.
    Impact model: I = impact_coeff * sigma * (qty / adv)^alpha
    """
    df = trades.copy()
    df["spread_cost"] = df["price"] * spread_bps / 10_000 * df["qty"]

    # Square-root impact (Tower Research / Almgren form)
    # Impact = sigma * coeff * (qty / ADV)^alpha
    df["sigma_daily"]  = df["price"] * 0.015   # assume 1.5% daily vol
    df["pct_adv"]      = df["qty"] / df["adv"]
    df["impact_bps"]   = (impact_coefficient
                          * df["sigma_daily"] / df["price"]
                          * df["pct_adv"] ** timing_alpha
                          * 10_000)
    df["impact_cost"]  = df["impact_bps"] / 10_000 * df["price"] * df["qty"]

    df["total_cost"]   = df["spread_cost"] + df["impact_cost"]
    df["total_cost_bps"] = df["total_cost"] / (df["price"] * df["qty"]) * 10_000

    # Implementation shortfall: total_cost as fraction of trade notional
    df["IS"] = df["total_cost"] / (df["price"] * df["qty"])
    return df[["symbol", "qty", "pct_adv", "spread_cost",
               "impact_bps", "impact_cost", "total_cost_bps", "IS"]]`,
    explanation:
      "The square-root market impact model (I ∝ σ × (q/ADV)^0.6) is the empirical industry standard — impact grows sublinearly because patient execution spreads the trade over time. Implementation shortfall (IS) measures the difference between the decision price and the average fill price, incorporating both timing risk and market impact. IS is the correct objective for optimal execution algorithms.",
  },
  {
    id: "pyfin-20260705-b1-numpy-linalg-covariance",
    language: "python",
    title: "Ledoit-Wolf Shrinkage Covariance Estimation",
    tag: "finance",
    code: `import numpy as np
from sklearn.covariance import LedoitWolf

def shrinkage_covariance(returns: np.ndarray) -> dict:
    """
    Ledoit-Wolf analytical shrinkage: shrinks sample covariance toward scaled identity.
    Reduces estimation error for high-dimensional portfolios (n_assets > n_obs).
    """
    T, N = returns.shape
    lw = LedoitWolf()
    lw.fit(returns)

    cov_shrunk = lw.covariance_
    cov_sample = np.cov(returns.T)
    shrinkage  = lw.shrinkage_

    # Compare condition numbers: shrinkage improves numerical stability
    cond_sample = np.linalg.cond(cov_sample)
    cond_shrunk = np.linalg.cond(cov_shrunk)

    # Minimum variance portfolio weights using each covariance estimate
    def min_var_weights(cov: np.ndarray) -> np.ndarray:
        ones  = np.ones(N)
        inv_c = np.linalg.inv(cov)
        w     = inv_c @ ones / (ones @ inv_c @ ones)
        return w

    w_sample = min_var_weights(cov_sample)
    w_shrunk = min_var_weights(cov_shrunk)

    return {
        "shrinkage_intensity":    shrinkage,
        "cond_sample":            cond_sample,
        "cond_shrunk":            cond_shrunk,
        "min_var_w_sample":       w_sample,
        "min_var_w_shrunk":       w_shrunk,
        "weights_max_diff":       np.max(np.abs(w_sample - w_shrunk)),
    }`,
    explanation:
      "The sample covariance matrix is poorly conditioned when N > T (more assets than observations), causing minimum-variance portfolio weights to be extreme and unstable. Ledoit-Wolf shrinkage analytically selects the optimal convex combination of the sample covariance and scaled identity matrix, reducing estimation error. A shrinkage coefficient of 0.2 means 80% sample covariance + 20% identity prior.",
  },
  {
    id: "pyfin-20260705-b1-importance-sampling-mc",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def importance_sampling_call(
    S0: float, K: float, T: float, r: float, sigma: float,
    n_paths: int = 100_000, seed: int = 0
) -> dict:
    """
    Standard MC has huge variance for deep OTM options (payoff is rare).
    Importance sampling shifts the mean of Z so that S_T > K is more likely.
    """
    rng   = np.random.default_rng(seed)
    sqT   = np.sqrt(T)
    drift = (r - 0.5 * sigma**2) * T

    # --- Standard MC ---
    Z_std = rng.standard_normal(n_paths)
    S_T   = S0 * np.exp(drift + sigma * sqT * Z_std)
    pay_std = np.maximum(S_T - K, 0.0) * np.exp(-r * T)

    # --- Importance Sampling ---
    # Shift: sample Z ~ N(mu*, 1) where mu* moves mass to the exercise region
    # Optimal mu*: solve S0*exp(drift + sigma*sqT*mu*) = K
    log_moneyness = np.log(K / S0) - drift
    mu_star = log_moneyness / (sigma * sqT)  # shift mean to boundary

    Z_is    = rng.standard_normal(n_paths) + mu_star
    S_T_is  = S0 * np.exp(drift + sigma * sqT * Z_is)

    # Radon-Nikodym derivative (likelihood ratio)
    # dP/dQ = exp(-mu_star * Z_std + 0.5 * mu_star**2)
    # but Z_is = Z_std + mu_star, so Z_std = Z_is - mu_star
    lr = np.exp(-mu_star * Z_is + 0.5 * mu_star**2)

    pay_is = np.maximum(S_T_is - K, 0.0) * np.exp(-r * T) * lr

    # BS analytic for comparison
    d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2 = d1 - sigma*sqT
    bs = S0 * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

    return {
        "analytic":   bs,
        "std_mc":     pay_std.mean(),
        "std_mc_se":  pay_std.std() / np.sqrt(n_paths),
        "is_mc":      pay_is.mean(),
        "is_mc_se":   pay_is.std() / np.sqrt(n_paths),
        "variance_reduction": (pay_std.std() / pay_is.std())**2,
    }`,
    explanation:
      "For deep OTM options, standard MC has near-zero variance reduction because almost all paths have zero payoff — the standard error is dominated by the tail. Importance sampling shifts the sampling distribution so the exercise region is well-represented, then corrects with the likelihood ratio (Radon-Nikodym derivative). For a 30% OTM option, IS can reduce variance by 100x or more.",
  },
  {
    id: "pyfin-20260705-b1-jump-detection",
    language: "python",
    title: "Lee-Mykland Jump Test for High-Frequency Returns",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.stats import norm

def lee_mykland_jump_test(
    prices: pd.Series,
    window: int = 252,      # realised bipower variation window
    alpha: float = 0.01,    # significance level
) -> pd.DataFrame:
    """
    Lee-Mykland (2008) jump test for high-frequency returns.
    Standardises each return by a local volatility estimate (BPV).
    Under no-jump null: L_t ~ N(0,1) asymptotically.
    """
    log_ret = np.log(prices / prices.shift(1)).dropna()

    # Bipower Variation: robust to jumps (unlike squared returns)
    # BPV_t ≈ pi/2 * sum |r_{t-1}| * |r_t|  over a rolling window
    abs_ret = log_ret.abs()
    bpv = (np.pi / 2) * (abs_ret * abs_ret.shift(1)).rolling(window).sum()
    sigma_hat = np.sqrt(bpv / window)

    # Test statistic
    L = log_ret / sigma_hat

    # Critical value adjusted for multiple testing (max of N statistics)
    N = len(log_ret)
    c_n = np.sqrt(2 * np.log(N))
    S_n = (2 * np.log(N))**0.5
    # Gumbel limit: P(max|L_t| - c_n) / S_n <= x) -> exp(-exp(-x))
    # Threshold: c_n + (-log(-log(1-alpha))) / S_n
    threshold = c_n + (-np.log(-np.log(1 - alpha))) / S_n

    is_jump = L.abs() > threshold
    return pd.DataFrame({
        "log_return":     log_ret,
        "sigma_hat":      sigma_hat,
        "L_statistic":    L,
        "is_jump":        is_jump,
        "threshold":      threshold,
    })`,
    explanation:
      "The Lee-Mykland test identifies individual intraday jumps by standardizing each return by local bipower variation — a volatility estimator that is robust to jumps (since BPV ignores adjacent return products). The critical value uses Gumbel extreme-value theory to control the family-wise error rate across all test statistics. Identifying jump times helps separate diffusive from jump risk in high-frequency models.",
  },
  {
    id: "pyfin-20260705-b1-copula-var",
    language: "python",
    title: "Gaussian Copula Portfolio VaR Simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, t as tdist

def gaussian_copula_var(
    corr: np.ndarray,       # n x n correlation matrix
    marginal_vols: np.ndarray,  # daily vol per asset
    weights: np.ndarray,    # portfolio weights
    confidence: float = 0.99,
    n_sims: int = 100_000,
    seed: int = 0,
) -> dict:
    """
    Simulate portfolio loss using a Gaussian copula with specified marginals.
    Steps: 1) Draw correlated normals, 2) Apply marginal distributions, 3) aggregate.
    """
    rng  = np.random.default_rng(seed)
    n    = len(weights)
    L    = np.linalg.cholesky(corr)        # Cholesky decomposition

    # Correlated standard normals
    Z_indep = rng.standard_normal((n_sims, n))
    Z_corr  = Z_indep @ L.T               # shape (n_sims, n)

    # Apply marginal normal distributions: return = vol * Z
    asset_returns = Z_corr * marginal_vols[np.newaxis, :]  # (n_sims, n)

    # Portfolio loss (negative return)
    port_returns = asset_returns @ weights
    port_losses  = -port_returns

    var  = np.quantile(port_losses, confidence)
    es   = port_losses[port_losses > var].mean()

    # Stressed correlation: replace with identity for diversified benchmark
    Z_indep2 = rng.standard_normal((n_sims, n))
    port_loss_indep = -(Z_indep2 * marginal_vols[np.newaxis, :]) @ weights
    var_indep = np.quantile(-port_loss_indep, confidence)

    return {
        "var_99":             var,
        "es_99":              es,
        "var_diversified":    var_indep,
        "correlation_addon":  var / var_indep - 1,
    }`,
    explanation:
      "A Gaussian copula specifies the dependence structure independently of marginal distributions: the Cholesky factorisation of the correlation matrix generates correlated normal quantiles, which are then mapped to any marginal via the inverse CDF. The difference between correlated VaR and independent VaR is the 'correlation add-on' — the extra capital required because assets don't diversify in stress. The 2008 crisis exposed the Gaussian copula's failure to model joint tail dependence (which a Student-t copula handles better).",
  },
  {
    id: "pyfin-20260705-b1-scenario-analysis",
    language: "python",
    title: "Stress Test and Scenario Analysis via Historical Scenarios",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def scenario_analysis(
    portfolio_weights: pd.Series,  # index = tickers
    asset_returns: pd.DataFrame,   # historical returns, columns = tickers
    scenario_dates: dict,          # {"2008 Crisis": (start, end), ...}
) -> pd.DataFrame:
    """
    Apply historical stress scenarios to a current portfolio.
    Returns P&L and drawdown for each scenario period.
    """
    results = []
    aligned_weights = portfolio_weights.reindex(asset_returns.columns).fillna(0)
    w = aligned_weights.values

    for scenario_name, (start, end) in scenario_dates.items():
        period = asset_returns.loc[start:end]
        if len(period) == 0:
            continue

        # Compound return over period
        compound = (1 + period).prod() - 1
        port_return = float(compound.values @ w)

        # Daily P&L
        daily_port = (period * w).sum(axis=1)
        cumulative  = (1 + daily_port).cumprod()
        max_dd      = (cumulative / cumulative.cummax() - 1).min()

        # Annualized vol during scenario
        ann_vol = daily_port.std() * np.sqrt(252)

        results.append({
            "scenario":     scenario_name,
            "start":        start,
            "end":          end,
            "total_return": port_return,
            "max_drawdown": max_dd,
            "ann_vol":      ann_vol,
            "calmar":       port_return / abs(max_dd) if max_dd != 0 else np.nan,
            "days":         len(period),
        })

    return pd.DataFrame(results).set_index("scenario")`,
    explanation:
      "Historical scenario analysis is the most credible stress test because it uses actual market moves rather than stylised shocks — it incorporates the real correlation structure during crises (when correlations spike). Regulators require banks to test portfolios against specific historical episodes; comparing total return, max drawdown, and realised vol across scenarios reveals which risk factors drove losses.",
  },
];
