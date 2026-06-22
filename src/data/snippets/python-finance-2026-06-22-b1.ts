import type { Snippet } from "./types";

export const pythonFinanceSnippets20260622B1: Snippet[] = [
  {
    id: "pyfin-20260622-b1-mv-frontier",
    language: "python",
    title: "Mean-variance efficient frontier via scipy quadratic program",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def efficient_frontier(mu: np.ndarray, Sigma: np.ndarray,
                        n_points: int = 50) -> dict:
    """
    Trace the efficient frontier by minimising portfolio variance
    for a sequence of target return levels.
    mu:    (n,) expected returns
    Sigma: (n, n) covariance matrix
    Returns frontier weights, returns, and vols.
    """
    n = len(mu)
    mu_min = float(np.min(mu))
    mu_max = float(np.max(mu))

    front_w, front_r, front_v = [], [], []

    for mu_target in np.linspace(mu_min, mu_max, n_points):
        constraints = [
            {'type': 'eq', 'fun': lambda w: w.sum() - 1.0},
            {'type': 'eq', 'fun': lambda w, mt=mu_target: w @ mu - mt},
        ]
        bounds = [(0.0, 1.0)] * n
        x0 = np.ones(n) / n

        res = minimize(lambda w: float(w @ Sigma @ w),
                       x0, method='SLSQP',
                       bounds=bounds, constraints=constraints,
                       options={'ftol': 1e-12, 'maxiter': 500})

        if res.success:
            w = res.x
            front_w.append(w)
            front_r.append(float(w @ mu))
            front_v.append(float(np.sqrt(w @ Sigma @ w)))

    return {
        'weights': np.array(front_w),
        'returns': np.array(front_r),
        'vols':    np.array(front_v),
        'sharpe':  np.array(front_r) / np.array(front_v),
    }`,
    explanation: "The efficient frontier is traced by parametrising over target return and solving a quadratic program at each point; in practice the global minimum-variance portfolio is found first (only the variance objective, no return constraint) and the frontier is traced upward from there, since below the GMV portfolio the frontier is inefficient.",
  },
  {
    id: "pyfin-20260622-b1-cir-model",
    language: "python",
    title: "Cox-Ingersoll-Ross (CIR) model: simulation and ZCB pricing",
    tag: "fixed-income",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class CIR:
    kappa: float   # mean reversion speed
    theta: float   # long-run mean
    sigma: float   # vol of short rate
    r0:    float   # initial short rate

    def feller(self) -> bool:
        """Feller condition: 2*kappa*theta > sigma^2 — keeps rate positive."""
        return 2.0 * self.kappa * self.theta > self.sigma**2

    def zcb(self, T: float) -> float:
        """Analytic zero-coupon bond P(0,T) = A(T)*exp(-B(T)*r0)."""
        g  = np.sqrt(self.kappa**2 + 2.0*self.sigma**2)
        B  = 2.0*(np.exp(g*T) - 1.0) / ((g+self.kappa)*(np.exp(g*T)-1.0) + 2.0*g)
        lA = (2.0*self.kappa*self.theta/self.sigma**2
              * np.log(2.0*g*np.exp((g+self.kappa)*T/2.0)
                       / ((g+self.kappa)*(np.exp(g*T)-1.0) + 2.0*g)))
        return np.exp(lA - B*self.r0)

    def simulate(self, T: float, n_steps: int = 252,
                 n_paths: int = 1000, seed: int = 0) -> np.ndarray:
        """
        Euler-Maruyama simulation (full truncation to prevent r < 0).
        For exact CIR simulation, use the non-central chi-squared scheme.
        """
        rng = np.random.default_rng(seed)
        dt  = T / n_steps
        paths = np.empty((n_paths, n_steps + 1))
        paths[:, 0] = self.r0

        for i in range(n_steps):
            r = np.maximum(paths[:, i], 0.0)
            dW = rng.standard_normal(n_paths) * np.sqrt(dt)
            dr = self.kappa*(self.theta - r)*dt + self.sigma*np.sqrt(r)*dW
            paths[:, i+1] = np.maximum(r + dr, 0.0)   # full truncation

        return paths

    def yield_curve(self, tenors: np.ndarray) -> np.ndarray:
        return np.array([-np.log(self.zcb(T)) / T for T in tenors])`,
    explanation: "The Feller condition 2κθ > σ² guarantees the CIR rate stays strictly positive; when violated, Euler simulation requires full truncation (clamping to zero) which introduces bias — the non-central chi-squared exact transition scheme avoids this bias but requires sampling from that distribution, which is more expensive.",
  },
  {
    id: "pyfin-20260622-b1-fama-french-3f",
    language: "python",
    title: "Fama-French 3-factor OLS regression for alpha estimation",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd
from typing import Optional

def fama_french_3factor(portfolio_returns: np.ndarray,
                         mkt_excess: np.ndarray,
                         smb: np.ndarray,
                         hml: np.ndarray,
                         rf: Optional[np.ndarray] = None) -> dict:
    """
    Regress portfolio excess returns on Fama-French 3 factors:
    R_p - rf = alpha + beta_mkt*(Rm-rf) + beta_smb*SMB + beta_hml*HML + eps

    Returns alpha (annualised), betas, t-stats, and R^2.
    """
    if rf is None:
        rf = np.zeros(len(portfolio_returns))

    y = portfolio_returns - rf          # excess returns
    X = np.column_stack([
        np.ones(len(y)),                 # intercept (alpha)
        mkt_excess,                      # market risk premium
        smb,                             # small-minus-big
        hml,                             # high-minus-low (value)
    ])

    # OLS: beta = (X'X)^{-1} X'y
    XtX_inv = np.linalg.inv(X.T @ X)
    betas   = XtX_inv @ X.T @ y
    resid   = y - X @ betas
    n, k    = X.shape

    # Standard errors
    s2      = float(resid @ resid) / (n - k)
    se      = np.sqrt(np.diag(XtX_inv) * s2)
    t_stats = betas / se

    ss_tot = float(np.sum((y - y.mean())**2))
    ss_res = float(resid @ resid)

    return {
        'alpha_daily':  betas[0],
        'alpha_annual': betas[0] * 252,
        'beta_mkt':     betas[1],
        'beta_smb':     betas[2],
        'beta_hml':     betas[3],
        't_alpha':      t_stats[0],
        't_mkt':        t_stats[1],
        't_smb':        t_stats[2],
        't_hml':        t_stats[3],
        'r_squared':    1.0 - ss_res / ss_tot,
        'info_ratio':   betas[0] / (resid.std() * np.sqrt(252)),
    }`,
    explanation: "The information ratio (alpha / tracking error) is more interpretable than a raw t-statistic for evaluating active fund performance because it scales by the residual risk taken; a t-stat of 2 requires roughly 16 years of data to achieve statistical significance for a typical equity fund, which is why factor-model residual tests are the industry standard.",
  },
  {
    id: "pyfin-20260622-b1-pca-risk",
    language: "python",
    title: "PCA-based risk factor extraction from return covariance",
    tag: "factor-models",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class PCAFactors:
    loadings:       np.ndarray   # (n_assets, n_factors) factor loadings
    factor_returns: np.ndarray   # (T, n_factors) realised factor returns
    explained_var:  np.ndarray   # (n_factors,) fraction of variance explained
    eigenvalues:    np.ndarray   # (n_factors,) eigenvalues

def pca_factors(returns: np.ndarray, n_factors: int = 5) -> PCAFactors:
    """
    Extract top-n PCA risk factors from a (T x n_assets) return matrix.
    Factors are ordered by variance explained (descending).
    """
    T, n = returns.shape
    mu   = returns.mean(axis=0)
    R    = returns - mu               # demean

    # Sample covariance (unbiased)
    Sigma = R.T @ R / (T - 1)

    # Eigen-decomposition (symmetric, so eigh is stable and faster)
    eigenvalues, eigenvectors = np.linalg.eigh(Sigma)

    # Sort descending
    idx   = np.argsort(eigenvalues)[::-1]
    eigenvalues  = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    # Top factors
    L = eigenvectors[:, :n_factors]          # (n, k) loadings
    F = R @ L                                # (T, k) factor returns
    explained = eigenvalues[:n_factors] / eigenvalues.sum()

    return PCAFactors(
        loadings       = L,
        factor_returns = F,
        explained_var  = explained,
        eigenvalues    = eigenvalues[:n_factors],
    )

def reconstruct_cov(pca: PCAFactors, specific_var: np.ndarray) -> np.ndarray:
    """Reconstruct Sigma = L * diag(lambda) * L' + diag(specific_var)."""
    return (pca.loadings * pca.eigenvalues) @ pca.loadings.T + np.diag(specific_var)`,
    explanation: "PCA covariance compression replaces an n×n covariance matrix with a k×n loading matrix plus a diagonal specific variance, reducing the number of parameters from O(n²) to O(kn); for equity universes with n=500 assets and k=20 factors, this cuts the covariance matrix from 125,000 to 10,500 parameters while explaining 70-80% of variance.",
  },
  {
    id: "pyfin-20260622-b1-arima",
    language: "python",
    title: "ARIMA model fitting and forecasting for spread returns",
    tag: "time-series",
    code: `import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import warnings

def fit_arima_spread(spread: np.ndarray, max_p: int = 3, max_q: int = 3,
                      d: int = 0) -> dict:
    """
    Fit ARIMA(p, d, q) to a spread series using AIC to select order.
    d=0 assumes the spread is already stationary (cointegrated pair).
    """
    # ADF test for stationarity
    adf_stat, adf_p, *_ = adfuller(spread, autolag='AIC')

    best_aic = np.inf
    best_order = (1, d, 0)
    best_model = None

    for p in range(max_p + 1):
        for q in range(max_q + 1):
            if p == 0 and q == 0:
                continue
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    model = ARIMA(spread, order=(p, d, q)).fit()
                if model.aic < best_aic:
                    best_aic   = model.aic
                    best_order = (p, d, q)
                    best_model = model
            except Exception:
                continue

    if best_model is None:
        raise ValueError("No ARIMA model converged")

    # 5-step ahead forecast with confidence intervals
    forecast = best_model.get_forecast(steps=5)
    fc_mean  = forecast.predicted_mean
    fc_ci    = forecast.conf_int(alpha=0.05)

    return {
        'order':           best_order,
        'aic':             best_aic,
        'params':          best_model.params,
        'resid_std':       float(best_model.resid.std()),
        'forecast':        fc_mean.values,
        'forecast_ci_lo':  fc_ci.iloc[:, 0].values,
        'forecast_ci_hi':  fc_ci.iloc[:, 1].values,
        'adf_stat':        adf_stat,
        'adf_pvalue':      adf_p,
        'is_stationary':   adf_p < 0.05,
    }`,
    explanation: "AIC penalises model complexity by 2k where k is the number of parameters, balancing fit against overfitting; for ARIMA order selection, AIC typically selects parsimonious models with AR(1) or AR(2) for equity spreads, because higher-order models overfit the short memory of daily return data.",
  },
  {
    id: "pyfin-20260622-b1-engle-granger",
    language: "python",
    title: "Engle-Granger cointegration test for pairs trading",
    tag: "stat-arb",
    code: `import numpy as np
from statsmodels.regression.linear_model import OLS
from statsmodels.tsa.stattools import adfuller
import statsmodels.api as sm

def engle_granger_test(y: np.ndarray, x: np.ndarray,
                         lags: int = 1) -> dict:
    """
    Engle-Granger (1987) two-step cointegration test:
    Step 1: OLS of y on x to get hedge ratio and residuals (spread).
    Step 2: ADF test on residuals — stationary residuals => cointegrated.

    Returns hedge ratio, half-life of spread mean reversion, and test stats.
    """
    # Step 1: OLS
    X = sm.add_constant(x)
    ols = OLS(y, X).fit()
    spread = ols.resid
    beta   = float(ols.params[1])
    alpha  = float(ols.params[0])

    # Step 2: ADF on spread
    adf_stat, adf_p, _, _, crit, _ = adfuller(spread, maxlag=lags, regression='nc')

    # Half-life of mean reversion: fit AR(1) to spread
    # spread_t = phi * spread_{t-1} + eps
    spread_lag = spread[:-1]
    spread_diff = np.diff(spread)
    phi   = float(np.cov(spread_diff, spread_lag)[0, 1] / np.var(spread_lag))
    half_life = -np.log(2.0) / np.log(1.0 + phi) if -1.0 < phi < 0.0 else np.inf

    # Z-score of current spread for entry signal
    z_score = (spread - spread.mean()) / spread.std()

    return {
        'hedge_ratio':   beta,
        'intercept':     alpha,
        'spread':        spread,
        'adf_stat':      adf_stat,
        'adf_pvalue':    adf_p,
        'crit_5pct':     crit['5%'],
        'cointegrated':  adf_p < 0.05,
        'half_life_days': half_life,
        'z_score':       z_score,
        'spread_std':    float(spread.std()),
    }`,
    explanation: "The Engle-Granger test uses a critical value table specific to the cointegration residuals (which are themselves estimated), so standard ADF critical values understate the rejection threshold; the half-life of mean reversion computed from the AR(1) coefficient is the practical input to position sizing — a half-life of 5 days supports daily rebalancing, while 60+ days makes the strategy impractical.",
  },
  {
    id: "pyfin-20260622-b1-delta-gamma-var",
    language: "python",
    title: "Delta-gamma parametric VaR for an options portfolio",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def delta_gamma_var(deltas: np.ndarray, gammas: np.ndarray,
                     S: np.ndarray, sigma_vec: np.ndarray,
                     corr: np.ndarray, horizon: int = 1,
                     alpha: float = 0.99) -> dict:
    """
    Parametric delta-gamma VaR for a portfolio of options.
    dP ≈ delta' * dS + 0.5 * gamma' * dS^2 (component-wise)

    For the quadratic approximation, VaR is computed via the
    Cornish-Fisher expansion using portfolio skewness and kurtosis.

    deltas: (n,) option deltas (dollar delta = delta * S)
    gammas: (n,) option gammas
    S:      (n,) underlying prices
    sigma_vec: (n,) annualised vols
    """
    dt = horizon / 252.0

    # Dollar sensitivities
    dol_delta = deltas * S               # (n,)
    dol_gamma = gammas * S**2 * 0.5     # (n,)

    # Daily covariance of underlying returns
    daily_sigma = sigma_vec * np.sqrt(dt)
    D = np.diag(daily_sigma)
    Sigma_ret = D @ corr @ D             # return covariance (n x n)

    # Portfolio moments via delta (linear) approximation
    port_var  = float(dol_delta @ Sigma_ret @ dol_delta)
    port_vol  = np.sqrt(port_var)

    # Gamma contribution to variance (second-order)
    gamma_var = 2.0 * float(dol_gamma @ (Sigma_ret**2) @ dol_gamma)

    # Cornish-Fisher skewness correction (from gamma)
    skew = float(dol_gamma @ (Sigma_ret @ (Sigma_ret @ dol_gamma))) / port_var**1.5

    z_cf = norm.ppf(alpha) + (norm.ppf(alpha)**2 - 1) * skew / 6.0

    return {
        'delta_var':   port_vol * norm.ppf(alpha),
        'delta_gamma_var': np.sqrt(port_var + gamma_var) * z_cf,
        'port_vol':    port_vol,
        'skewness':    skew,
    }`,
    explanation: "The Cornish-Fisher expansion adjusts the normal quantile for the portfolio's skewness, which arises entirely from the gamma term; for a long-gamma portfolio (net positive gamma), the P&L distribution is positively skewed and standard delta-only VaR overestimates loss, while short-gamma portfolios are negatively skewed and delta VaR dangerously underestimates tail risk.",
  },
  {
    id: "pyfin-20260622-b1-garch-hs",
    language: "python",
    title: "GARCH-filtered historical simulation VaR (Hull-White 1998)",
    tag: "risk",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_filtered_hs_var(returns: np.ndarray, alpha: float = 0.99,
                            horizon: int = 1) -> dict:
    """
    Hull-White GARCH-filtered HS:
    1. Fit GARCH(1,1) to get conditional variance path sigma2_t.
    2. Standardise returns: z_t = r_t / sigma_t.
    3. Forecast sigma_{T+1} from last GARCH update.
    4. Scale historical z_t by sigma_{T+1} -> synthetic scenarios.
    5. VaR = quantile of scaled scenarios.
    """
    r = returns - returns.mean()
    n = len(r)

    # Fit GARCH(1,1) via MLE
    def neg_loglik(params):
        omega, a, b = params
        if omega <= 0 or a < 0 or b < 0 or a + b >= 1: return 1e10
        sigma2 = np.empty(n)
        sigma2[0] = np.var(r)
        for t in range(1, n):
            sigma2[t] = omega + a*r[t-1]**2 + b*sigma2[t-1]
        return 0.5*float(np.sum(np.log(sigma2) + r**2/sigma2))

    res = minimize(neg_loglik, [np.var(r)*0.1, 0.1, 0.8],
                   bounds=[(1e-8,None),(1e-6,0.999),(1e-6,0.999)],
                   method='L-BFGS-B')
    omega, a, b = res.x

    # Conditional variance path
    sigma2 = np.empty(n)
    sigma2[0] = np.var(r)
    for t in range(1, n):
        sigma2[t] = omega + a*r[t-1]**2 + b*sigma2[t-1]

    # Forecast next-period sigma
    sigma2_next = omega + a*r[-1]**2 + b*sigma2[-1]
    sigma_next  = np.sqrt(sigma2_next * horizon)

    # Standardised residuals (innovations)
    z = r / np.sqrt(sigma2)

    # Synthetic scenarios for tomorrow
    scenarios = z * sigma_next

    var = float(-np.quantile(scenarios, 1.0 - alpha))
    es  = float(-scenarios[scenarios <= -var].mean())

    return {'var': var, 'es': es, 'sigma_forecast': sigma_next,
            'omega': omega, 'alpha_garch': a, 'beta_garch': b,
            'persistence': a + b}`,
    explanation: "GARCH-filtered HS addresses the two main weaknesses of plain HS: it adjusts all historical observations to today's volatility regime (so 2008 observations are rescaled to their low-vol GARCH equivalent when today is calm) and it uses the actual non-normal return distribution rather than assuming Gaussian innovations.",
  },
  {
    id: "pyfin-20260622-b1-calmar-sortino",
    language: "python",
    title: "Calmar ratio, Sortino ratio, and max drawdown analytics",
    tag: "portfolio",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class PerformanceMetrics:
    ann_return:   float
    ann_vol:      float
    sharpe:       float
    sortino:      float
    calmar:       float
    max_drawdown: float
    max_dd_start: int     # index of drawdown peak
    max_dd_end:   int     # index of drawdown trough
    win_rate:     float

def performance_metrics(returns: np.ndarray, rf: float = 0.0,
                         ann_factor: int = 252) -> PerformanceMetrics:
    """Compute standard risk-adjusted performance metrics from daily returns."""
    n        = len(returns)
    ann_ret  = float(np.mean(returns) * ann_factor)
    ann_vol  = float(np.std(returns, ddof=1) * np.sqrt(ann_factor))

    # Sortino: only downside semi-deviation below rf threshold
    excess   = returns - rf / ann_factor
    downside = np.where(excess < 0, excess, 0.0)
    semi_var = float(np.mean(downside**2) * ann_factor)
    sortino  = (ann_ret - rf) / np.sqrt(semi_var) if semi_var > 0 else 0.0

    # Drawdown series
    cum  = np.cumprod(1.0 + returns)
    peak = np.maximum.accumulate(cum)
    dd   = (cum - peak) / peak

    max_dd   = float(dd.min())
    dd_end   = int(np.argmin(dd))
    dd_start = int(np.argmax(cum[:dd_end + 1]))

    calmar  = (ann_ret - rf) / abs(max_dd) if max_dd != 0 else np.inf
    sharpe  = (ann_ret - rf) / ann_vol if ann_vol > 0 else 0.0

    return PerformanceMetrics(
        ann_return=ann_ret, ann_vol=ann_vol, sharpe=sharpe,
        sortino=sortino, calmar=calmar, max_drawdown=max_dd,
        max_dd_start=dd_start, max_dd_end=dd_end,
        win_rate=float((returns > 0).mean()),
    )`,
    explanation: "The Calmar ratio divides annualised return by maximum drawdown (not vol), making it the preferred metric for trend-following funds where long drawdown durations are the primary risk; Sortino's semi-deviation ignores upside volatility since investors only care about downside fluctuations, resulting in a higher ratio than Sharpe for positively skewed return distributions.",
  },
  {
    id: "pyfin-20260622-b1-backtest-costs",
    language: "python",
    title: "Vectorised backtest with proportional transaction costs and slippage",
    tag: "backtesting",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class BacktestResult:
    equity_curve: np.ndarray
    daily_returns: np.ndarray
    turnover:      np.ndarray
    total_cost:    float
    sharpe:        float
    max_drawdown:  float

def vectorised_backtest(prices: np.ndarray, signals: np.ndarray,
                         tc_bps: float = 5.0, slippage_bps: float = 2.0,
                         initial_capital: float = 1e6) -> BacktestResult:
    """
    Backtest a signal-based strategy with costs.
    signals: (T,) in [-1, 0, 1] — direction or target weight
    tc_bps:  one-way transaction cost in basis points
    slippage_bps: one-way slippage in basis points
    """
    T = len(prices)
    cost_per_unit = (tc_bps + slippage_bps) * 1e-4   # total one-way cost

    # Daily returns of the underlying
    rets = np.diff(prices) / prices[:-1]   # length T-1

    # Position and turnover
    pos = signals[:-1]                     # position held during day t
    trades = np.abs(np.diff(signals))      # absolute turnover at day boundaries

    # Strategy returns: signal * next-day return - turnover * cost
    strat_rets = pos * rets - trades * cost_per_unit

    equity = initial_capital * np.cumprod(1.0 + strat_rets)
    cum    = np.maximum.accumulate(equity)
    dd     = ((equity - cum) / cum).min()

    ann = 252
    sharpe = (strat_rets.mean() * ann) / (strat_rets.std(ddof=1) * np.sqrt(ann))

    return BacktestResult(
        equity_curve  = equity,
        daily_returns = strat_rets,
        turnover      = trades,
        total_cost    = float(trades.sum() * cost_per_unit),
        sharpe        = float(sharpe),
        max_drawdown  = float(dd),
    )`,
    explanation: "Modelling turnover-based costs rather than a flat fee captures the real cost structure of strategies: a mean-reverting signal that trades every day at 5+2 bps per leg incurs 2520 bps/year of costs, while a trend-following signal that turns over monthly incurs only 84 bps — comparing Sharpe ratios before costs can reverse the ranking of these strategies.",
  },
  {
    id: "pyfin-20260622-b1-vol-targeting",
    language: "python",
    title: "Volatility targeting and regime-aware position sizing",
    tag: "risk",
    code: `import numpy as np

def vol_targeting(returns: np.ndarray, target_vol: float = 0.10,
                   ewm_halflife: int = 21, max_leverage: float = 2.0,
                   ann_factor: int = 252) -> dict:
    """
    Scale position size inversely with realised volatility to maintain
    a constant annualised portfolio vol target.

    Uses EWMA volatility (not GARCH) for computational simplicity.
    target_vol: annualised target vol (e.g. 0.10 = 10%)
    """
    n    = len(returns)
    lam  = 1.0 - np.log(2.0) / ewm_halflife   # EWM decay factor

    # EWMA variance (online)
    ewma_var = np.empty(n)
    ewma_var[0] = returns[0]**2
    for t in range(1, n):
        ewma_var[t] = lam*ewma_var[t-1] + (1.0-lam)*returns[t]**2

    # EWMA daily vol -> scale to annual
    ewma_vol_ann = np.sqrt(ewma_var * ann_factor)

    # Leverage: target_vol / realised_vol, capped at max_leverage
    leverage = np.minimum(target_vol / np.maximum(ewma_vol_ann, 1e-6), max_leverage)

    # Scaled returns
    scaled_returns = returns * leverage

    ann_ret = scaled_returns.mean() * ann_factor
    ann_vol = scaled_returns.std(ddof=1) * np.sqrt(ann_factor)

    return {
        'leverage':       leverage,
        'ewma_vol':       ewma_vol_ann,
        'scaled_returns': scaled_returns,
        'ann_vol':        ann_vol,
        'ann_ret':        ann_ret,
        'sharpe':         ann_ret / ann_vol if ann_vol > 0 else 0.0,
        'avg_leverage':   float(leverage.mean()),
    }`,
    explanation: "Volatility targeting is a dynamic leverage strategy: it increases leverage in calm markets and reduces it in turbulent ones, mechanically mean-reverting portfolio risk; empirically, vol-targeted equity and trend strategies show substantially higher Sharpe ratios than fixed-leverage equivalents because they avoid being maximally exposed during high-vol crashes.",
  },
  {
    id: "pyfin-20260622-b1-mc-importance-sampling",
    language: "python",
    title: "Importance sampling for deep OTM option pricing",
    tag: "derivatives",
    code: `import numpy as np

def is_call_price(S0: float, K: float, r: float, sigma: float, T: float,
                   n_paths: int = 100_000, seed: int = 42) -> dict:
    """
    Importance sampling for deep OTM call:
    Shift the sampling distribution toward the strike to reduce zero-payoff paths.

    Under shifted measure Q' with drift mu_shift, the payoff becomes
    payoff * likelihood_ratio where LR = exp(-z_shift*Z - 0.5*z_shift^2).

    Optimal shift: z_shift = [log(K/S0) - (r-0.5*sigma^2)*T] / (sigma*sqrt(T))
    sets the mean of log(S_T) to exactly log(K).
    """
    rng   = np.random.default_rng(seed)
    sqT   = np.sqrt(T)
    disc  = np.exp(-r*T)

    # Optimal drift shift (puts the log-mean of S_T at log(K))
    z_shift = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / (sigma*sqT)

    # Sample under shifted measure
    Z  = rng.standard_normal(n_paths) + z_shift   # shifted samples
    ST = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*sqT*Z)

    # Likelihood ratio (Radon-Nikodym derivative back to Q)
    lr = np.exp(-z_shift * Z + 0.5*z_shift**2)

    payoff = np.maximum(ST - K, 0.0)
    is_payoff = payoff * lr

    price    = disc * is_payoff.mean()
    std_is   = disc * is_payoff.std(ddof=1) / np.sqrt(n_paths)

    # Naive MC for comparison
    Z2  = rng.standard_normal(n_paths)
    ST2 = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*sqT*Z2)
    naive_price = disc * np.maximum(ST2 - K, 0.0).mean()
    std_naive   = disc * np.maximum(ST2-K, 0.0).std(ddof=1) / np.sqrt(n_paths)

    return {'price_is': price, 'std_is': std_is,
            'price_naive': naive_price, 'std_naive': std_naive,
            'variance_reduction': (std_naive/std_is)**2}`,
    explanation: "For deep OTM options, plain MC wastes 99%+ of paths on zero payoffs; importance sampling shifts the sampling distribution so nearly every path generates a non-zero payoff, reducing variance by orders of magnitude — a 10% OTM 3-month call can see variance reductions of 100x, reducing the required sample count by the same factor for equal precision.",
  },
  {
    id: "pyfin-20260622-b1-ois-bootstrap",
    language: "python",
    title: "OIS curve bootstrapping from swap rates",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_ois(tenors: list[float], swap_rates: list[float]) -> dict:
    """
    Bootstrap a piecewise-constant forward rate curve from OIS swap rates.
    OIS swaps: fixed rate vs compounded overnight rate.
    Assumes annual payment and act/365 day count.

    Returns discount factors and zero rates at each pillar.
    """
    n   = len(tenors)
    dfs = np.ones(n)   # discount factors at each tenor

    for i, (T, S) in enumerate(zip(tenors, swap_rates)):
        # Fixed leg PV: S * sum_j tau_j * df(T_j)   for j < i (already known)
        # Plus unknown df(T_i) term
        # Float leg PV: 1 - df(T_i) (bootstrapping identity)

        known_pv = sum(
            S * (tenors[j] - (tenors[j-1] if j>0 else 0.0)) * dfs[j]
            for j in range(i)
        )
        tau_i = T - (tenors[i-1] if i > 0 else 0.0)

        # Solve: (1 - df_i) = known_pv + S * tau_i * df_i
        # => df_i = (1 - known_pv) / (1 + S * tau_i)
        dfs[i] = (1.0 - known_pv) / (1.0 + S * tau_i)

    zeros = -np.log(dfs) / np.array(tenors)
    fwds  = np.diff(np.concatenate([[0.0], -np.log(dfs)]))
    fwds /= np.diff(np.concatenate([[0.0], tenors]))

    return {
        'tenors':   np.array(tenors),
        'dfs':      dfs,
        'zeros':    zeros,
        'forwards': fwds,
    }`,
    explanation: "The OIS bootstrapping identity 'float leg PV = 1 - df(T)' holds because the floating leg of an OIS swap (receiving daily compounded overnight rate) is equivalent to receiving par at maturity and paying par at inception — this allows each discount factor to be solved in closed form from the shorter-tenor factors already bootstrapped.",
  },
  {
    id: "pyfin-20260622-b1-multi-asset-kelly",
    language: "python",
    title: "Multi-asset Kelly criterion via log-utility maximisation",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def multi_asset_kelly(mu: np.ndarray, Sigma: np.ndarray,
                       rf: float = 0.0, max_leverage: float = 3.0) -> dict:
    """
    Full Kelly portfolio: maximise E[log(1 + w'(mu-rf) + rf - 0.5*w'*Sigma*w)]
    Approximated as: max w'*mu_excess - 0.5*w'*Sigma*w  (log-normal approx)
    Analytic solution: w* = Sigma^{-1} * mu_excess  (unconstrained)
    """
    mu_excess = mu - rf

    # Unconstrained full Kelly
    Sigma_inv  = np.linalg.inv(Sigma)
    w_full_kelly = Sigma_inv @ mu_excess

    # Constrained Kelly (no short, leverage cap)
    n = len(mu)
    def neg_utility(w):
        return -(w @ mu_excess - 0.5 * float(w @ Sigma @ w))

    constraints = [{'type': 'ineq', 'fun': lambda w: max_leverage - np.abs(w).sum()}]
    bounds      = [(-max_leverage, max_leverage)] * n
    x0          = w_full_kelly / max(1.0, np.abs(w_full_kelly).sum() / max_leverage)

    res = minimize(neg_utility, x0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-12, 'maxiter': 1000})
    w_constrained = res.x

    return {
        'full_kelly':      w_full_kelly,
        'half_kelly':      w_full_kelly * 0.5,
        'constrained':     w_constrained,
        'leverage_full':   float(np.abs(w_full_kelly).sum()),
        'expected_log_g':  float(w_constrained @ mu_excess
                                 - 0.5*(w_constrained @ Sigma @ w_constrained)),
    }`,
    explanation: "The unconstrained multi-asset Kelly solution is Σ⁻¹μ — identical to the mean-variance tangency portfolio weights scaled by 1/risk_aversion; full Kelly typically implies 5-10x leverage for diversified asset classes, which is why practitioners always use a fraction (half-Kelly or less) to guard against estimation error in μ.",
  },
  {
    id: "pyfin-20260622-b1-ssvi",
    language: "python",
    title: "SSVI (Surface SVI) parametrisation for full vol surface",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def ssvi_total_var(k: np.ndarray, t: float,
                    theta: float, rho: float, phi: float) -> np.ndarray:
    """
    Gatheral-Jacquier (2014) SSVI:
    w(k, t) = (theta_t / 2) * (1 + rho*phi*k + sqrt((phi*k + rho)^2 + (1-rho^2)))
    theta_t: ATM total variance at maturity t (= sigma_atm^2 * t)
    rho:     correlation (controls skew, rho in (-1, 1))
    phi:     curvature of smile
    """
    phi_k = phi * k
    return (theta / 2.0) * (
        1.0 + rho*phi_k
        + np.sqrt((phi_k + rho)**2 + (1.0 - rho**2))
    )

def fit_ssvi_slice(log_moneyness: np.ndarray, total_var: np.ndarray,
                    theta_init: float = 0.04) -> dict:
    """Fit a single SSVI slice at fixed maturity."""
    def sse(params):
        theta, rho, phi = params
        if theta <= 0 or abs(rho) >= 1 or phi <= 0: return 1e10
        w = ssvi_total_var(log_moneyness, 1.0, theta, rho, phi)
        if np.any(w <= 0): return 1e10
        return float(np.sum((w - total_var)**2))

    x0  = [theta_init, -0.3, 1.0]
    res = minimize(sse, x0, method='Nelder-Mead',
                   options={'maxiter': 10000, 'xatol': 1e-9})
    theta, rho, phi = res.x

    w_fit = ssvi_total_var(log_moneyness, 1.0, theta, rho, phi)
    return {'theta': theta, 'rho': rho, 'phi': phi,
            'fitted_w': w_fit,
            'rmse_vol': float(np.sqrt(np.mean(
                (np.sqrt(w_fit) - np.sqrt(total_var))**2)))}`,
    explanation: "SSVI extends SVI by imposing the no-calendar-spread-arbitrage condition globally across maturities: the ATM total variance θ(t) must be an increasing function of t, and the SSVI surface is guaranteed butterfly-arbitrage-free if ρ ∈ (-1,1) and φ ≤ 4/(1+|ρ|) — making SSVI the industry standard for model-free vol surface construction.",
  },
  {
    id: "pyfin-20260622-b1-var-swap-replication",
    language: "python",
    title: "Variance swap fair strike via log-contract replication",
    tag: "derivatives",
    code: `import numpy as np
from scipy.integrate import quad
from scipy.stats import norm

def bs_put(F: float, K: float, sigma: float, T: float, r: float = 0.0) -> float:
    """BS put price on forward F."""
    if K <= 0 or T <= 0 or sigma <= 0: return max(K - F, 0.0)
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return np.exp(-r*T) * (K*norm.cdf(-d2) - F*norm.cdf(-d1))

def bs_call(F: float, K: float, sigma: float, T: float, r: float = 0.0) -> float:
    if K <= 0 or T <= 0 or sigma <= 0: return max(F - K, 0.0)
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return np.exp(-r*T) * (F*norm.cdf(d1) - K*norm.cdf(d2))

def variance_swap_strike(F: float, T: float,
                          vol_surface: callable,  # vol_surface(K) -> implied vol
                          n_points: int = 200) -> dict:
    """
    Neuberger-Carr-Madan replication:
    K_var = (2/T) * [integral_0^F (1/K^2)*Put(K) dK
                    + integral_F^inf (1/K^2)*Call(K) dK]
    Numerical integration over a discrete strike grid.
    """
    dK    = F * 0.05   # step size 5% of forward

    K_puts  = np.linspace(F*0.2, F,    n_points)
    K_calls = np.linspace(F,     F*3.0, n_points)

    def put_integrand(K):
        iv = vol_surface(K)
        return bs_put(F, K, iv, T) / K**2

    def call_integrand(K):
        iv = vol_surface(K)
        return bs_call(F, K, iv, T) / K**2

    put_integral  = np.trapz([put_integrand(K)  for K in K_puts],  K_puts)
    call_integral = np.trapz([call_integrand(K) for K in K_calls], K_calls)

    K_var = (2.0/T) * (put_integral + call_integral)

    return {'K_var': K_var, 'K_vol': np.sqrt(K_var),
            'put_contribution':  2.0/T*put_integral,
            'call_contribution': 2.0/T*call_integral}`,
    explanation: "The log-contract replication shows that the variance swap strike equals the model-free integral of all OTM option prices weighted by 1/K²; in practice the integral is truncated at illiquid strikes, causing the model-free implied variance to underestimate realised variance — this systematic gap is known as the 'jump risk' in VIX construction.",
  },
  {
    id: "pyfin-20260622-b1-market-impact",
    language: "python",
    title: "Almgren-Chriss market impact with transaction cost model",
    tag: "execution",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class ACParams:
    sigma:  float   # daily vol of asset
    gamma:  float   # permanent impact coefficient (per share)
    eta:    float   # temporary impact coefficient (per share)
    lam:    float   # risk aversion (higher = more front-loaded)

def ac_trajectory(Q: float, T: float, N: int,
                   params: ACParams) -> dict:
    """
    Almgren-Chriss optimal liquidation trajectory.
    Sells Q shares over N periods of length tau = T/N.
    Returns holdings x[j] and trades n[j] for j = 0..N.
    """
    p  = params
    tau = T / N

    # Characteristic kappa = sqrt(lam*sigma^2 / eta)
    kappa = np.sqrt(p.lam * p.sigma**2 / p.eta)

    # Optimal holdings: x_j = Q * sinh(kappa*(N-j)*tau) / sinh(kappa*N*tau)
    j    = np.arange(N + 1, dtype=float)
    denom = np.sinh(kappa * N * tau)
    if denom > 1e-12:
        x = Q * np.sinh(kappa * (N - j) * tau) / denom
    else:
        x = Q * (N - j) / N   # TWAP limit

    trades = -np.diff(x)   # shares sold in each period

    # Expected cost
    E_cost = (p.gamma * Q**2 / 2.0
              + p.eta * np.sum(trades**2) / tau)

    # Risk (variance of total cost)
    V_cost = p.sigma**2 * tau * np.sum(x[:-1]**2)

    return {
        'holdings': x,
        'trades':   trades,
        'expected_cost': E_cost,
        'cost_variance': V_cost,
        'kappa':    kappa,
    }`,
    explanation: "The Almgren-Chriss model has an exact analytic solution for the optimal trajectory because the utility function (mean + λ×variance of execution cost) is quadratic in the holding vector; the hyperbolic-sine ratio collapses to TWAP when λ→0 (risk-neutral) and concentrates all trades at t=0 when λ→∞ (infinitely risk-averse).",
  },
  {
    id: "pyfin-20260622-b1-hullwhite-cap",
    language: "python",
    title: "Hull-White caplet and cap pricing (analytic)",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.stats import norm
from dataclasses import dataclass

@dataclass
class HWCaplet:
    """Hull-White caplet: call on LIBOR/SOFR rate over [T1, T2]."""
    kappa: float   # mean reversion
    sigma: float   # short rate vol
    r0:    float   # current short rate

    def zcb(self, T: float) -> float:
        """ZCB P(0, T) under HW (flat initial curve approximation)."""
        B  = (1.0 - np.exp(-self.kappa*T)) / self.kappa
        lA = (B - T)*(self.r0 - 0.5*self.sigma**2/self.kappa**2) \
             - self.sigma**2*B**2/(4.0*self.kappa)
        return np.exp(lA - B*self.r0)

    def caplet(self, T1: float, T2: float, K: float) -> float:
        """
        HW caplet price = P(0,T1)*N(-h2) - (1+K*tau)*P(0,T2)*N(-h1)
        where h1, h2 depend on vol_P, the vol of zcb(T1,T2).
        """
        tau  = T2 - T1
        B_1  = (1.0 - np.exp(-self.kappa*T1)) / self.kappa
        B_2  = (1.0 - np.exp(-self.kappa*T2)) / self.kappa

        # Vol of log(P(T1,T2)) = sigma * sqrt((1-e^{-2*kappa*T1})/(2*kappa)) * (B_2-B_1)
        vol_P = (self.sigma
                 * np.sqrt((1.0 - np.exp(-2.0*self.kappa*T1))/(2.0*self.kappa))
                 * (B_2 - B_1))

        P1   = self.zcb(T1)
        P2   = self.zcb(T2)
        X    = 1.0 + K * tau   # strike on ZCB

        h1 = np.log(P2 / (X*P1)) / vol_P + 0.5*vol_P
        h2 = h1 - vol_P

        return X*P1*norm.cdf(-h2) - P2*norm.cdf(-h1)

    def cap(self, T_schedule: list[float], K: float) -> float:
        """Sum of caplets over a schedule."""
        return sum(self.caplet(T_schedule[i], T_schedule[i+1], K)
                   for i in range(len(T_schedule)-1))`,
    explanation: "The Hull-White caplet formula is a bond option formula (Jamshidian 1989): since a caplet is equivalent to a put on a zero-coupon bond, the lognormal vol of the bond price (vol_P) is computed from the short-rate vol and the bond's duration, giving a closed-form result that extends naturally to caps (sum of caplets) and swaptions.",
  },
];
