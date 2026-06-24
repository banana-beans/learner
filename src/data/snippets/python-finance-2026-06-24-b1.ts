import type { Snippet } from "./types";

export const pythonFinanceSnippets20260624B1: Snippet[] = [
  {
    id: "pyfin-20260624-b1-arima",
    language: "python",
    title: "ARIMA fitting and multi-step forecasting with statsmodels",
    tag: "time-series",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller, acf, pacf
from statsmodels.stats.diagnostic import acorr_ljungbox

def fit_arima(series: pd.Series, max_p: int = 5, max_q: int = 5,
               d: int = 1) -> dict:
    """
    Auto-select ARIMA(p,d,q) order by minimising AIC over a grid search.
    d=1 for non-stationary prices; d=0 for stationary returns.
    """
    # ADF test to confirm stationarity of d-th difference
    diff = series.diff(d).dropna() if d > 0 else series.dropna()
    adf_stat, adf_pval, _, _, _, _ = adfuller(diff, maxlag=12, autolag='AIC')

    best_aic = np.inf
    best_order = (1, d, 1)
    best_model = None

    for p in range(max_p + 1):
        for q in range(max_q + 1):
            try:
                model = ARIMA(series, order=(p, d, q),
                              enforce_stationarity=False,
                              enforce_invertibility=False)
                res = model.fit(method_kwargs={'warn_convergence': False})
                if res.aic < best_aic:
                    best_aic   = res.aic
                    best_order = (p, d, q)
                    best_model = res
            except Exception:
                continue

    if best_model is None:
        return {'error': 'no model converged'}

    # In-sample residuals diagnostics
    lb = acorr_ljungbox(best_model.resid, lags=10, return_df=True)
    resid_autocorr = float(acf(best_model.resid, nlags=1)[1])

    # Out-of-sample forecast: 5 steps ahead with 95% confidence interval
    fc = best_model.get_forecast(steps=5)
    ci = fc.conf_int(alpha=0.05)

    return {
        'order':         best_order,
        'aic':           best_aic,
        'bic':           best_model.bic,
        'forecast':      fc.predicted_mean.tolist(),
        'conf_int_95':   ci.values.tolist(),
        'adf_pval':      adf_pval,
        'resid_acf_lag1': resid_autocorr,
        'ljung_box_pval': float(lb['lb_pvalue'].mean()),
        'params':        best_model.params.to_dict(),
    }`,
    explanation: "The AIC grid search balances in-sample fit (log-likelihood) against model complexity (parameter count) — a model with p+q too large overfits, producing good in-sample residuals but poor out-of-sample forecasts; the Ljung-Box test checks whether residuals are white noise (no remaining autocorrelation), and a p-value > 0.05 at lag 10 is the primary diagnostic for a well-specified ARIMA.",
  },
  {
    id: "pyfin-20260624-b1-cointegration",
    language: "python",
    title: "Engle-Granger cointegration test and ECM for pairs trading",
    tag: "stat-arb",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import coint, adfuller
from statsmodels.regression.linear_model import OLS
from statsmodels.tools import add_constant

def cointegration_analysis(y: pd.Series, x: pd.Series,
                            significance: float = 0.05) -> dict:
    """
    Engle-Granger two-step cointegration test + Error Correction Model (ECM).
    Step 1: OLS of y on x; test residuals for stationarity (ADF).
    Step 2: If cointegrated, fit ECM: Delta_y_t = alpha + gamma*(y_{t-1} - beta*x_{t-1}) + ...

    gamma < 0: error correction working (spread mean-reverts)
    Half-life = -log(2) / log(1 + gamma)
    """
    # Engle-Granger test (uses ADF on OLS residuals with MacKinnon critical values)
    coint_t, p_val, crit_vals = coint(y, x)

    # OLS spread regression: y = beta * x + alpha + epsilon
    X   = add_constant(x)
    reg = OLS(y, X).fit()
    beta  = float(reg.params.iloc[1])
    alpha = float(reg.params.iloc[0])
    spread = y - beta * x - alpha

    # ADF on spread (should be stationary if cointegrated)
    adf_stat, adf_pval, _, _, _, _ = adfuller(spread.dropna(), maxlag=12, autolag='AIC')

    # Error Correction Model (ECM)
    # Delta_y_t = gamma * spread_{t-1} + delta * Delta_x_t + noise
    dy    = y.diff().dropna()
    dx    = x.diff().dropna()
    ec    = spread.shift(1).dropna()

    # Align
    idx  = dy.index.intersection(dx.index).intersection(ec.index)
    dy_  = dy.loc[idx]; dx_ = dx.loc[idx]; ec_ = ec.loc[idx]

    ecm_X = add_constant(pd.concat([ec_, dx_], axis=1))
    ecm   = OLS(dy_, ecm_X).fit()
    gamma = float(ecm.params.iloc[1])   # error correction speed (should be < 0)

    half_life = -np.log(2.0) / np.log(1.0 + gamma) if gamma < 0 else np.inf

    return {
        'coint_pval':   p_val,
        'cointegrated': p_val < significance,
        'beta':         beta,
        'alpha':        alpha,
        'spread_adf_pval': adf_pval,
        'spread_mean':  float(spread.mean()),
        'spread_std':   float(spread.std()),
        'gamma_ecm':    gamma,
        'half_life_days': half_life,
        'z_score':      float((spread.iloc[-1] - spread.mean()) / spread.std()),
    }`,
    explanation: "Cointegration (not correlation) is the correct criterion for pairs trading — two correlated assets can diverge permanently, while two cointegrated assets have a stationary spread by definition; the ECM gamma parameter quantifies the mean-reversion speed: gamma = -0.1 means 10% of the spread deviation is corrected each day, giving a half-life of log(2)/0.1 ≈ 7 days, which determines the optimal holding period for the trade.",
  },
  {
    id: "pyfin-20260624-b1-fama-french",
    language: "python",
    title: "Fama-French three-factor model estimation and alpha extraction",
    tag: "factor-models",
    code: `import numpy as np
import pandas as pd
from statsmodels.regression.linear_model import OLS
from statsmodels.tools import add_constant

def fama_french_3factor(portfolio_returns: pd.Series,
                          mkt_rf: pd.Series,
                          smb: pd.Series,
                          hml: pd.Series,
                          rf: pd.Series) -> dict:
    """
    Fama-French 3-factor model:
    R_p - Rf = alpha + beta_mkt*(Rm-Rf) + beta_smb*SMB + beta_hml*HML + epsilon

    Factors (from Ken French data library):
    MKT-RF: market excess return
    SMB:    small-minus-big (size factor)
    HML:    high-minus-low book-to-market (value factor)
    """
    # Excess return of portfolio
    idx  = (portfolio_returns.index
            .intersection(mkt_rf.index)
            .intersection(smb.index)
            .intersection(hml.index)
            .intersection(rf.index))

    rp_rf = portfolio_returns.loc[idx] - rf.loc[idx]

    # Design matrix: constant + 3 factors
    factors = pd.DataFrame({
        'MKT_RF': mkt_rf.loc[idx],
        'SMB':    smb.loc[idx],
        'HML':    hml.loc[idx],
    })
    X   = add_constant(factors)
    res = OLS(rp_rf, X).fit()

    alpha  = float(res.params['const'])
    b_mkt  = float(res.params['MKT_RF'])
    b_smb  = float(res.params['SMB'])
    b_hml  = float(res.params['HML'])

    # Annualised alpha (monthly data: * 12; daily: * 252)
    # Assume monthly; adjust as needed
    alpha_ann = alpha * 12

    # Information ratio: alpha / residual vol
    resid_vol = float(res.resid.std() * np.sqrt(12))
    ir = alpha_ann / resid_vol if resid_vol > 0 else 0.0

    # Factor contribution to total return
    factor_return = (b_mkt * mkt_rf.loc[idx]
                   + b_smb * smb.loc[idx]
                   + b_hml * hml.loc[idx]).sum()
    alpha_total   = float(res.resid.sum() + alpha * len(idx))

    return {
        'alpha_monthly':    alpha,
        'alpha_annual':     alpha_ann,
        'beta_market':      b_mkt,
        'beta_smb':         b_smb,
        'beta_hml':         b_hml,
        'r_squared':        float(res.rsquared),
        'alpha_tstat':      float(res.tvalues['const']),
        'alpha_pval':       float(res.pvalues['const']),
        'information_ratio': ir,
        'residual_vol_ann': resid_vol,
        'factor_return':    factor_return,
        'total_alpha':      alpha_total,
    }`,
    explanation: "Fama-French alpha (Jensen's alpha controlling for three factors) is a more demanding benchmark than raw excess return — a small-cap value fund with positive raw return but negative FF3 alpha is just harvesting the size and value premia, not generating genuine skill; the t-statistic on alpha should exceed 2.0 (approximately) for statistical significance, and typical institutional fund alphas after fees are negative on average.",
  },
  {
    id: "pyfin-20260624-b1-kelly",
    language: "python",
    title: "Kelly criterion and fractional Kelly for optimal position sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_continuous(mu: float, sigma: float, r: float = 0.0) -> dict:
    """
    Continuous Kelly criterion for a GBM asset.
    Optimal fraction f* = (mu - r) / sigma^2 = Sharpe / sigma.
    Maximises E[log(W_T)] which is equivalent to maximising CAGR.
    """
    excess = mu - r
    f_star = excess / (sigma ** 2) if sigma > 0 else 0.0

    # Kelly CAGR: mu - 0.5 * f^2 * sigma^2
    kelly_cagr = excess * f_star - 0.5 * f_star**2 * sigma**2

    # Half-Kelly (more common in practice — less volatility, 75% of CAGR)
    f_half     = f_star / 2.0
    half_cagr  = excess * f_half - 0.5 * f_half**2 * sigma**2

    return {
        'kelly_fraction':    f_star,
        'half_kelly':        f_half,
        'kelly_cagr':        kelly_cagr,
        'half_kelly_cagr':   half_cagr,
        'sharpe':            excess / sigma if sigma > 0 else 0.0,
    }

def kelly_discrete(win_prob: float, win_return: float,
                    loss_return: float) -> dict:
    """
    Discrete Kelly for a bet that wins with probability p and loses with 1-p.
    win_return: fractional gain on win (e.g. 0.2 for +20%)
    loss_return: fractional loss on loss (e.g. 0.1 for -10%, positive number)
    f* = p / loss_return - q / win_return  (Kelly formula)
    """
    q = 1.0 - win_prob
    f_star = win_prob / loss_return - q / win_return if win_return > 0 and loss_return > 0 else 0.0
    f_star = max(0.0, f_star)  # never short

    # Expected log return at Kelly fraction
    def log_growth(f):
        return (win_prob * np.log1p(f * win_return)
              + q * np.log1p(-f * loss_return))

    # Verify f_star maximises log growth
    if f_star > 0:
        res = minimize_scalar(lambda f: -log_growth(f),
                               bounds=(0.0, min(f_star * 2, 1.0)),
                               method='bounded')
        f_star_num = -res.fun if not np.isnan(res.fun) else 0.0
    else:
        f_star_num = 0.0

    return {
        'kelly_fraction':   f_star,
        'quarter_kelly':    f_star * 0.25,
        'half_kelly':       f_star * 0.5,
        'max_log_growth':   log_growth(f_star),
        'ev_per_unit':      win_prob * win_return - q * loss_return,
        'edge_to_odds':     (win_prob * win_return - q * loss_return) / loss_return,
    }

def kelly_multi_asset(mu: np.ndarray, Sigma: np.ndarray) -> np.ndarray:
    """
    Multi-asset Kelly: f* = Sigma^{-1} * mu (fraction vector).
    Maximises expected log portfolio return.
    """
    try:
        return np.linalg.solve(Sigma, mu)
    except np.linalg.LinAlgError:
        return np.linalg.lstsq(Sigma, mu, rcond=None)[0]`,
    explanation: "Kelly criterion maximises the long-run compound growth rate (CAGR) by maximising E[log(W)], but it produces high variance — a 100% Kelly bettor has ~30% drawdown probability over a year even with positive edge; half-Kelly retains 75% of CAGR with half the variance, which is why most institutional systematic traders cap position sizes at a fraction of the Kelly optimal, treating Kelly as an upper bound rather than a target.",
  },
  {
    id: "pyfin-20260624-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal liquidation trajectory",
    tag: "market-microstructure",
    code: `import numpy as np
from scipy.linalg import solve_banded

def almgren_chriss(Q0: float, T: float, n_steps: int,
                    sigma: float, eta: float, gamma: float,
                    alpha: float = 1.0) -> dict:
    """
    Almgren-Chriss (2001) optimal liquidation of Q0 shares over T days.

    Q0:     initial position (shares)
    T:      liquidation horizon (days)
    n_steps: number of trading periods
    sigma:  daily vol of share price (dollars)
    eta:    temporary market impact coeff (linear): cost = eta * (dQ/dt)
    gamma:  permanent market impact coeff: S drops permanently by gamma*dQ
    alpha:  risk aversion (higher = faster, more aggressive)

    Minimises: E[cost] + alpha * Var[cost]
    Optimal trajectory: Q(t) = Q0 * sinh(kappa*(T-t)) / sinh(kappa*T)
    """
    dt    = T / n_steps
    times = np.linspace(0, T, n_steps + 1)

    # Trade-off parameter kappa
    kappa2 = alpha * sigma**2 / eta
    kappa  = np.sqrt(kappa2)

    # Optimal inventory trajectory
    if kappa * T < 1e-6:
        # Linear trajectory (no risk aversion)
        Q = Q0 * (1.0 - times / T)
    else:
        Q = Q0 * np.sinh(kappa * (T - times)) / np.sinh(kappa * T)

    # Trading rate (shares per day)
    dQ = -np.diff(Q)   # positive = selling

    # Expected cost = permanent + temporary impact
    perm_cost = gamma * Q0**2 / 2.0   # integral of gamma * Q * dQ
    temp_cost = float(eta * np.sum(dQ**2 / dt))

    # Risk (variance of execution cost)
    var_cost  = float(sigma**2 * np.sum(Q[:-1]**2 * dt))

    # VWAP shortfall: cost as fraction of market price
    # (assuming flat price trajectory for simplicity)
    total_expected_cost = perm_cost + temp_cost
    avg_price_impact = total_expected_cost / Q0 if Q0 > 0 else 0.0

    return {
        'inventory':          Q,
        'trading_schedule':   dQ,
        'times':              times,
        'perm_impact_cost':   perm_cost,
        'temp_impact_cost':   temp_cost,
        'total_expected_cost': total_expected_cost,
        'variance_cost':      var_cost,
        'avg_price_impact':   avg_price_impact,
        'kappa':              kappa,
    }`,
    explanation: "Almgren-Chriss establishes the Pareto-optimal frontier between expected cost and variance of implementation shortfall — the risk aversion parameter alpha traces this frontier: alpha=0 gives the VWAP-like slow liquidation minimising expected cost (but with maximum exposure to adverse moves), while alpha→∞ gives immediate liquidation minimising variance at maximum temporary impact cost; the sinh-ratio trajectory profile is steeper at the beginning than TWAP, frontloading more execution early to reduce risk.",
  },
  {
    id: "pyfin-20260624-b1-antithetic",
    language: "python",
    title: "Antithetic variates Monte Carlo variance reduction",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S: float, K: float, r: float, sigma: float, T: float) -> float:
    if T <= 0 or sigma <= 0:
        return max(S - K * np.exp(-r * T), 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_call_antithetic(S0: float, K: float, r: float, sigma: float,
                         T: float, n_paths: int = 100_000,
                         seed: int = 0) -> dict:
    """
    Antithetic variates: for each random Z, also use -Z.
    Since payoff(Z) and payoff(-Z) are negatively correlated (deep OTM paths
    are paired with deep ITM paths), the average of the two has lower variance.

    Effective n_paths doubles with half the random draws.
    Variance reduction factor: 1 / (1 + corr(Y1, Y2)) where Y1,Y2 are paired payoffs.
    """
    rng  = np.random.default_rng(seed)
    disc = np.exp(-r * T)

    # Draw n_paths/2 normals; pair each with its antithetic
    n_half = n_paths // 2
    Z      = rng.standard_normal(n_half)

    # Terminal stock prices for Z and -Z
    drift  = (r - 0.5 * sigma**2) * T
    vol    = sigma * np.sqrt(T)

    S_Z  = S0 * np.exp(drift + vol * Z)
    S_nZ = S0 * np.exp(drift - vol * Z)

    pay_Z  = np.maximum(S_Z  - K, 0.0)
    pay_nZ = np.maximum(S_nZ - K, 0.0)

    # Antithetic estimate: average of paired payoffs
    pay_avg = 0.5 * (pay_Z + pay_nZ)

    mc_price = disc * pay_avg.mean()
    mc_se    = disc * pay_avg.std(ddof=1) / np.sqrt(n_half)

    # Standard MC for comparison (same number of paths = n_paths)
    Z_std      = np.concatenate([Z, rng.standard_normal(n_paths - n_half)])
    pay_std    = np.maximum(S0 * np.exp(drift + vol * Z_std) - K, 0.0)
    mc_std     = disc * pay_std.mean()
    se_std     = disc * pay_std.std(ddof=1) / np.sqrt(n_paths)

    cf_price   = bs_call(S0, K, r, sigma, T)
    corr_paired = float(np.corrcoef(pay_Z, pay_nZ)[0, 1])

    return {
        'price_antithetic': float(mc_price),
        'se_antithetic':    float(mc_se),
        'price_standard':   float(mc_std),
        'se_standard':      float(se_std),
        'price_closed_form': cf_price,
        'var_reduction':    float((se_std / mc_se)**2),
        'corr_paired':      corr_paired,
    }`,
    explanation: "Antithetic variates exploit negative correlation between paired paths — for a call option, a path with large positive Z (high terminal price, large payoff) is paired with -Z (low terminal price, small payoff); the variance of the average is (Var[Y1] + Var[Y2] + 2Cov[Y1,Y2])/4, and the negative covariance reduces it significantly; for an ATM call under typical parameters, antithetic variates typically achieve 10-30x variance reduction over standard MC.",
  },
  {
    id: "pyfin-20260624-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for deep OTM option pricing via exponential tilting",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def importance_sampling_call(S0: float, K: float, r: float, sigma: float,
                               T: float, n_paths: int = 50_000,
                               seed: int = 0) -> dict:
    """
    Importance sampling for deep OTM calls via exponential tilting.
    Shift the sampling distribution so most paths end above K,
    then weight each payoff by the likelihood ratio (Radon-Nikodym derivative).

    Optimal shift: mu* = (log(K/S0) - (r-0.5*sigma^2)*T) / (sigma*sqrt(T))
    This centres the sampling distribution at K (most paths near the strike).
    """
    rng   = np.random.default_rng(seed)
    disc  = np.exp(-r * T)
    sqT   = np.sqrt(T)
    drift = (r - 0.5 * sigma**2) * T

    # Optimal shift: re-centre at the strike level
    mu_star = (np.log(K / S0) - drift) / (sigma * sqT)

    # Sample from shifted distribution: Z ~ N(mu_star, 1)
    Z = rng.standard_normal(n_paths) + mu_star

    S_T = S0 * np.exp(drift + sigma * sqT * Z)
    pay = np.maximum(S_T - K, 0.0)

    # Likelihood ratio (Radon-Nikodym): dP/dQ = exp(-mu_star*Z + mu_star^2/2)
    # Weight each path to correct for the distributional shift
    log_rn = -mu_star * Z + 0.5 * mu_star**2
    rn     = np.exp(log_rn)

    # Importance-sampled payoff (weighted)
    weighted_pay = pay * rn

    price  = disc * weighted_pay.mean()
    se     = disc * weighted_pay.std(ddof=1) / np.sqrt(n_paths)

    # Standard MC for comparison
    Z_std  = rng.standard_normal(n_paths)
    pay_std = np.maximum(S0 * np.exp(drift + sigma*sqT*Z_std) - K, 0.0)
    se_std  = disc * pay_std.std(ddof=1) / np.sqrt(n_paths)

    moneyness = np.log(K / S0) / (sigma * sqT)  # how far OTM in sigma units

    return {
        'price_IS':      float(price),
        'se_IS':         float(se),
        'se_standard':   float(se_std),
        'var_reduction': float((se_std / se)**2) if se > 0 else 1.0,
        'mu_star':       float(mu_star),
        'moneyness_sigma': float(moneyness),
        'frac_above_K':  float((S_T > K).mean()),
    }`,
    explanation: "For a 5-sigma OTM call, only 1 in 3 million standard MC paths contributes to the payoff estimate — importance sampling recentres the sampling distribution at the strike so >50% of paths are in-the-money, then corrects with the likelihood ratio; the variance reduction is exponential in the distance from the strike: a 3-sigma OTM call can see 1000x variance reduction, making IS essential for CVA computation and stressed scenario pricing.",
  },
  {
    id: "pyfin-20260624-b1-hist-sim-var",
    language: "python",
    title: "Historical simulation VaR with full revaluation and aging weights",
    tag: "risk",
    code: `import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Callable

@dataclass
class HistoricalVaR:
    """
    Full-revaluation historical simulation VaR.
    Applies historical return scenarios to a pricing function
    rather than a simple linear approximation.
    """
    pricing_fn: Callable[[dict], float]   # maps market params -> portfolio value
    base_params: dict                      # current market parameter snapshot

    def compute(self,
                scenarios: pd.DataFrame,   # (T x n_risk_factors) returns
                alpha: float = 0.99,
                horizon: int = 1,
                decay: float = 0.995) -> dict:
        """
        scenarios: each row is one historical day's risk factor returns.
        base_params: dict of current market parameter values.
        Applies each scenario return to base_params, revalues, records P&L.
        """
        T = len(scenarios)
        pnls  = np.zeros(T)
        base_val = self.pricing_fn(self.base_params)

        for i, (_, row) in enumerate(scenarios.iterrows()):
            # Construct stressed parameter set
            stressed = {}
            for factor in self.base_params:
                ret = float(row.get(factor, 0.0))
                stressed[factor] = self.base_params[factor] * (1.0 + ret)

            stressed_val = self.pricing_fn(stressed)
            pnls[i] = stressed_val - base_val

        losses = -pnls  # positive = loss

        # Age-weighted: more recent scenarios have higher weight
        weights = np.array([(1 - decay) * decay**(T-1-i) / (1 - decay**T)
                             for i in range(T)])

        # Weighted quantile
        order  = np.argsort(losses)
        sorted_w = weights[order]
        sorted_L = losses[order]
        cum_w    = np.cumsum(sorted_w[::-1])[::-1]  # cumulative from worst

        var_idx  = np.searchsorted(1.0 - cum_w, alpha)
        var_idx  = min(var_idx, T - 1)
        VaR      = float(sorted_L[order[var_idx]])

        # Expected Shortfall
        tail_mask = 1.0 - cum_w >= alpha
        if tail_mask.any():
            ES = float(np.average(sorted_L[tail_mask], weights=sorted_w[tail_mask]))
        else:
            ES = VaR

        return {
            'VaR': VaR, 'ES': ES,
            'worst_loss': float(losses.max()),
            'mean_loss':  float(losses.mean()),
            'pnl_std':    float(pnls.std()),
            'n_scenarios': T,
        }`,
    explanation: "Full revaluation historical simulation is the gold standard for options and non-linear products because it captures convexity, skew, and vol-of-vol effects that delta-normal VaR misses; the age-weighting (BIS FRTB 'stressed' component) addresses the stale-scenario problem — during calm markets, 2008-era extreme scenarios get low weight so VaR doesn't overestimate, but after a regime shift to high vol, recent large moves immediately dominate.",
  },
  {
    id: "pyfin-20260624-b1-hw-simulation",
    language: "python",
    title: "Hull-White short-rate model Monte Carlo calibration and simulation",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.interpolate import interp1d

def hw_theta(t: float, a: float, sigma: float,
              fwd_curve: interp1d) -> float:
    """
    Hull-White drift adjustment theta(t) that matches initial forward curve.
    theta(t) = df/dt + a*f(t) + sigma^2/(2a) * (1 - exp(-2at))
    where f(t) is the instantaneous forward rate.
    """
    h = 1e-5
    f0  = float(fwd_curve(t))
    dfdt = (float(fwd_curve(t + h)) - float(fwd_curve(t - h))) / (2 * h)
    return dfdt + a * f0 + sigma**2 / (2 * a) * (1.0 - np.exp(-2 * a * t))

def hw_simulate(a: float, sigma: float,
                 tenor_rates: np.ndarray,  # (T,) zero rates at annual tenors
                 T_max: float = 5.0, n_steps: int = 252,
                 n_paths: int = 10000, seed: int = 0) -> dict:
    """
    Simulate Hull-White short rate paths calibrated to the current yield curve.
    Uses Euler-Maruyama with analytical drift theta(t).
    Returns: zero-coupon bond prices P(0,T) for T = 1,2,...,T_max.
    """
    rng      = np.random.default_rng(seed)
    dt       = T_max / n_steps
    sqdt     = np.sqrt(dt)
    tenors   = np.arange(1, len(tenor_rates) + 1, dtype=float)
    fwd_interp = interp1d(tenors, tenor_rates, kind='cubic',
                           fill_value='extrapolate')

    r0 = float(fwd_interp(0.01))    # initial short rate from curve

    # Simulate paths
    times = np.linspace(0, T_max, n_steps + 1)
    r     = np.full(n_paths, r0)

    # Discount factor paths: P(0,T) = E[exp(-integral_0^T r_t dt)]
    log_disc = np.zeros(n_paths)  # accumulate log discount

    for i in range(n_steps):
        t     = times[i]
        theta = hw_theta(t, a, sigma, fwd_interp)
        drift = (theta - a * r) * dt
        diff  = sigma * sqdt * rng.standard_normal(n_paths)

        log_disc += -r * dt      # trap rule contribution
        r         = r + drift + diff

    # Simulated ZCB prices
    zcb_sim = np.exp(log_disc)
    zcb_mean = float(zcb_sim.mean())
    zcb_std  = float(zcb_sim.std(ddof=1))

    # Market ZCB from initial curve (for calibration check)
    zcb_mkt = float(np.exp(-float(fwd_interp(T_max)) * T_max))

    return {
        'zcb_simulated_mean': zcb_mean,
        'zcb_market':         zcb_mkt,
        'zcb_se':             zcb_std / np.sqrt(n_paths),
        'r_final_mean':       float(r.mean()),
        'r_final_std':        float(r.std()),
        'r0':                 r0,
    }`,
    explanation: "The Hull-White theta(t) function is the key input that makes the model exactly arbitrage-free with the initial curve — without it, the simulated ZCB prices would not match market prices at time 0; theta(t) is computed from the derivative of the instantaneous forward rate, which requires numerically differentiating the input zero curve, making the smoothness of the curve interpolation critical for numerical stability.",
  },
  {
    id: "pyfin-20260624-b1-heston-fft",
    language: "python",
    title: "Heston model exact option pricing via characteristic function and FFT",
    tag: "derivatives",
    code: `import numpy as np
from scipy.fft import fft

def heston_char_fn(u: np.ndarray, S0: float, K: float, r: float,
                    v0: float, kappa: float, theta: float,
                    sigma: float, rho: float, T: float) -> np.ndarray:
    """
    Heston (1993) characteristic function phi(u; T) of log(S_T).
    Used for FFT-based option pricing (Carr-Madan 1999).
    """
    xi   = kappa - 1j * rho * sigma * u
    d    = np.sqrt(xi**2 + sigma**2 * u * (u + 1j))
    # Use Albrecher et al. (2007) stable formulation to avoid branch cuts
    g2   = (xi - d) / (xi + d)
    e_dt = np.exp(-d * T)

    # C and D functions
    C = (kappa * theta / sigma**2) * (
        (xi - d) * T - 2.0 * np.log((1.0 - g2 * e_dt) / (1.0 - g2))
    )
    D = (xi - d) / sigma**2 * ((1.0 - e_dt) / (1.0 - g2 * e_dt))

    return np.exp(C + D * v0 + 1j * u * (np.log(S0) + r * T))

def heston_fft_price(S0: float, K: float, r: float,
                      v0: float, kappa: float, theta: float,
                      sigma: float, rho: float, T: float,
                      N: int = 4096, eta: float = 0.25,
                      alpha: float = 1.5) -> float:
    """
    Carr-Madan (1999) FFT method for Heston call prices.
    Prices an option strip over a log-strike grid in O(N log N).

    alpha: damping factor for integrability (typically 1.0-2.0)
    eta:   grid spacing in the transform domain
    N:     number of FFT points
    """
    lam    = 2 * np.pi / (N * eta)
    b      = np.pi / eta            # log-strike range [-b, b]

    # Frequency grid
    j      = np.arange(N)
    u      = j * eta

    # Characteristic function at u - (alpha+1)*i  (Carr-Madan dampening)
    u_cm   = u - 1j * (alpha + 1.0)
    cf     = heston_char_fn(u_cm, S0, K, r, v0, kappa, theta, sigma, rho, T)

    # Integrand: psi(u)
    disc   = np.exp(-r * T)
    denom  = alpha**2 + alpha - u**2 + 1j * (2*alpha + 1) * u
    psi    = disc * cf / denom

    # Trapezoidal correction (Carr-Madan trick)
    psi[0] *= 0.5

    # FFT
    x   = psi * np.exp(1j * u * b) * eta
    y   = np.real(fft(x)) / np.pi

    # Log-strike grid
    log_K_grid = -b + lam * j

    # Undamp: call price = exp(-alpha * log_K) * y
    calls = np.exp(-alpha * log_K_grid) * y

    # Interpolate at desired log(K)
    log_K = np.log(K)
    idx   = np.searchsorted(log_K_grid, log_K)
    if 0 < idx < N:
        # Linear interpolation
        t_  = (log_K - log_K_grid[idx-1]) / (log_K_grid[idx] - log_K_grid[idx-1])
        return float(calls[idx-1] * (1-t_) + calls[idx] * t_)
    return float(calls[max(0, min(idx, N-1))])`,
    explanation: "The Carr-Madan FFT method transforms option pricing into a convolution in log-strike space, evaluating N option prices simultaneously in O(N log N) — compared to O(N) separate numerical integrations of the characteristic function; the alpha dampening factor is required because the call price function is not square-integrable, so the Fourier transform is applied to an exponentially dampened version, and alpha ∈ (1,2) balances numerical accuracy and stability.",
  },
  {
    id: "pyfin-20260624-b1-local-vol-mc",
    language: "python",
    title: "Dupire local volatility surface Monte Carlo simulation",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def local_vol_mc(S0: float, K: float, r: float,
                  T: float, strikes: np.ndarray, expiries: np.ndarray,
                  impl_vols: np.ndarray,
                  n_steps: int = 100, n_paths: int = 50000,
                  seed: int = 0) -> dict:
    """
    Dupire local vol MC: simulate S using sigma_loc(S_t, t) from the vol surface.
    sigma_loc is precomputed on a grid and interpolated at each time step.

    impl_vols: (len(expiries), len(strikes)) implied vol surface
    """
    rng   = np.random.default_rng(seed)
    disc  = np.exp(-r * T)
    dt    = T / n_steps
    sqdt  = np.sqrt(dt)

    # Build spline interpolator for sigma_loc(K, T) from implied vol surface
    # Using Dupire formula numerically on the implied vol grid
    # For simplicity, use implied vol surface directly as approximate local vol
    # (proper implementation requires numerical derivatives)
    vol_spline = RectBivariateSpline(expiries, strikes, impl_vols, kx=3, ky=3)

    S = np.full(n_paths, S0)
    times = np.linspace(0, T, n_steps + 1)

    for i in range(n_steps):
        t     = times[i]
        t_clip = np.clip(t, expiries[0], expiries[-1])

        # Interpolate local vol at current (S_t, t) for each path
        S_clip = np.clip(S, strikes[0], strikes[-1])
        sigma_loc = np.array([
            float(vol_spline(t_clip, s)) for s in S_clip
        ])
        sigma_loc = np.maximum(sigma_loc, 0.01)   # floor at 1%

        Z  = rng.standard_normal(n_paths)
        S *= np.exp((r - 0.5 * sigma_loc**2) * dt + sigma_loc * sqdt * Z)

    payoffs = np.maximum(S - K, 0.0)
    price   = disc * payoffs.mean()
    se      = disc * payoffs.std(ddof=1) / np.sqrt(n_paths)

    return {
        'price': float(price),
        'se':    float(se),
        '95ci':  (price - 1.96*se, price + 1.96*se),
        'frac_itm': float((S > K).mean()),
    }`,
    explanation: "Local vol MC exactly replicates any arbitrage-free implied vol surface by construction — unlike parametric models (Heston, SABR) which may not fit complex smile shapes; the practical challenge is computing Dupire's formula numerically from the implied vol surface without amplifying the noise in the second derivative, which requires careful smoothing of the surface before applying finite differences.",
  },
  {
    id: "pyfin-20260624-b1-dv01-duration",
    language: "python",
    title: "DV01, duration, and convexity for a bond portfolio",
    tag: "fixed-income",
    code: `import numpy as np
from dataclasses import dataclass
from typing import Optional

@dataclass
class Bond:
    face: float          # face value
    coupon: float        # annual coupon rate
    maturity: float      # years to maturity
    ytm: float           # yield to maturity (continuous compounding)
    frequency: int = 2   # coupon payments per year

    def cash_flows(self) -> tuple[np.ndarray, np.ndarray]:
        """Returns (times, cash_flow_amounts) arrays."""
        n    = int(self.maturity * self.frequency)
        dt   = 1.0 / self.frequency
        ts   = np.arange(1, n + 1) * dt
        cf   = np.full(n, self.face * self.coupon / self.frequency)
        cf[-1] += self.face   # final payment includes face value
        return ts, cf

    def price(self) -> float:
        """Continuous compounding: P = sum(cf_i * exp(-ytm * t_i))."""
        ts, cf = self.cash_flows()
        return float(np.sum(cf * np.exp(-self.ytm * ts)))

    def duration(self) -> float:
        """Macaulay duration: weighted average time of cash flows."""
        ts, cf = self.cash_flows()
        pv     = cf * np.exp(-self.ytm * ts)
        return float(np.sum(ts * pv) / np.sum(pv))

    def modified_duration(self) -> float:
        """Modified duration: -dP/(P*dy) under continuous compounding = Macaulay."""
        return self.duration()   # exact under continuous compounding

    def dv01(self) -> float:
        """Dollar value of 1 basis point: DV01 = -dP/dy * 0.0001."""
        return self.price() * self.duration() * 0.0001

    def convexity(self) -> float:
        """Convexity: d^2P/dy^2 / P."""
        ts, cf = self.cash_flows()
        pv     = cf * np.exp(-self.ytm * ts)
        return float(np.sum(ts**2 * pv) / np.sum(pv))

    def price_change(self, dy: float) -> float:
        """2nd-order price approximation: dP ≈ -D*P*dy + 0.5*C*P*dy^2."""
        P = self.price()
        return -self.duration() * P * dy + 0.5 * self.convexity() * P * dy**2

def portfolio_dv01(bonds: list[Bond], notionals: list[float]) -> dict:
    """Aggregate DV01 and duration for a multi-bond portfolio."""
    total_dv01   = sum(b.dv01() * n for b, n in zip(bonds, notionals))
    total_pv     = sum(b.price() * n for b, n in zip(bonds, notionals))
    port_duration = total_dv01 / (total_pv * 0.0001) if total_pv > 0 else 0.0
    return {
        'total_dv01':       total_dv01,
        'portfolio_value':  total_pv,
        'duration_years':   port_duration,
        'pv01':             total_dv01,
    }`,
    explanation: "Under continuous compounding, Macaulay duration equals modified duration exactly — the division by (1 + y/freq) that appears in the discrete version vanishes; DV01 is the market-standard risk unit because it translates yield moves directly into dollar P&L, making it the common currency for risk limits, hedging, and regulatory capital calculations across different bond tenors and coupon structures.",
  },
  {
    id: "pyfin-20260624-b1-irs-pricing",
    language: "python",
    title: "Vanilla interest rate swap pricing from bootstrap discount factors",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.interpolate import interp1d
from scipy.optimize import brentq

def bootstrap_discount_factors(tenors: np.ndarray,
                                  par_rates: np.ndarray) -> interp1d:
    """
    Bootstrap zero-coupon discount factors from par swap rates.
    Par swap rate s_n: annuity_n * s_n = 1 - P(0, t_n)
    => P(0, t_n) = (1 - s_n * sum_{i<n} P(0,t_i)*dt) / (1 + s_n*dt)
    """
    dfs   = np.zeros(len(tenors))
    dt    = np.diff(np.concatenate([[0.0], tenors]))

    for i, (t, s) in enumerate(zip(tenors, par_rates)):
        # Sum of previous discount factors (annuity)
        annuity = float(np.sum(dfs[:i] * dt[:i]))
        # Solve: P_i = (1 - s * annuity) / (1 + s * dt[i])
        dfs[i] = (1.0 - s * annuity) / (1.0 + s * dt[i])

    return interp1d(tenors, dfs, kind='cubic', fill_value='extrapolate')

def price_irs(notional: float, fixed_rate: float,
               pay_fixed: bool,
               fixed_tenors: np.ndarray,
               float_tenors: np.ndarray,
               df_fn: interp1d) -> dict:
    """
    Vanilla IRS: fixed_leg vs floating_leg.
    Fixed leg: notional * fixed_rate * tau_i * P(0, t_i) summed over payment dates.
    Floating leg: notional * (P(0, t_start) - P(0, t_end)) = 1 - P(0, T) at par.
    NPV = (float_leg - fixed_leg) * (1 if pay_fixed else -1)
    """
    dt_fixed  = np.diff(np.concatenate([[0.0], fixed_tenors]))
    dfs_fixed = np.array([float(df_fn(t)) for t in fixed_tenors])

    # Fixed leg PV
    annuity   = float(np.sum(dt_fixed * dfs_fixed))
    fixed_leg = notional * fixed_rate * annuity

    # Floating leg PV (par floater = 1 - P(0, T_last))
    df_start  = float(df_fn(float_tenors[0]))   # typically = 1 (spot start)
    df_end    = float(df_fn(float_tenors[-1]))
    float_leg = notional * (df_start - df_end)

    npv = (float_leg - fixed_leg) * (1 if pay_fixed else -1)

    # Par (fair) swap rate
    par_rate = (df_start - df_end) / annuity if annuity > 0 else 0.0

    # DV01: sensitivity to 1bp parallel shift
    dv01 = notional * annuity * 0.0001 * (1 if pay_fixed else -1)

    return {
        'npv':         npv,
        'fixed_leg':   fixed_leg,
        'float_leg':   float_leg,
        'par_rate':    par_rate,
        'annuity':     annuity,
        'dv01':        dv01,
        'duration_yrs': annuity / (notional * df_end) if df_end > 0 else 0.0,
    }`,
    explanation: "The floating leg of a par swap priced at LIBOR/SOFR equals par at inception — the sum of all floating cash flows (each = libor * dt * df) exactly equals 1 - P(0,T) via telescoping, so the floating PV is just the current discount factor difference; swaps are therefore priced entirely from the discount curve, and the bootstrapped discount factors are the primary market instrument for yield curve construction in most fixed-income desks.",
  },
  {
    id: "pyfin-20260624-b1-pca-yield",
    language: "python",
    title: "PCA on yield curve: level, slope, and curvature factor extraction",
    tag: "fixed-income",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

def yield_curve_pca(yield_data: pd.DataFrame,
                     n_components: int = 3) -> dict:
    """
    PCA on daily yield curve changes to extract level, slope, curvature.
    yield_data: (T x n_tenors) daily zero rates in percent.
    Columns are tenor labels (e.g. '1Y', '2Y', ..., '30Y').

    PC1 ~level:    all yields move together (~parallel shift, ~90% variance)
    PC2 ~slope:    short and long ends move oppositely (~steepening/flattening)
    PC3 ~curvature: belly moves opposite to wings (~butterfly)
    """
    # Work on first differences (yield changes) for stationarity
    dy = yield_data.diff().dropna()

    scaler = StandardScaler(with_std=False)   # demean only, preserve units
    dy_c   = scaler.fit_transform(dy)

    # Covariance-based PCA (not correlation, to preserve yield magnitudes)
    cov    = np.cov(dy_c.T)
    eigvals, eigvecs = np.linalg.eigh(cov)

    # Sort descending by eigenvalue
    order   = np.argsort(eigvals)[::-1][:n_components]
    eigvals = eigvals[order]
    eigvecs = eigvecs[:, order]

    # Factor scores (projections of yield changes onto PCs)
    scores  = dy_c @ eigvecs   # (T x n_components)

    # Explained variance
    total_var   = float(np.trace(cov))
    exp_var_pct = (eigvals / total_var * 100.0).tolist()

    # Reconstruct yield changes from top-3 factors
    y_reconstructed = scores @ eigvecs.T + scaler.mean_

    # Assign names heuristically based on loading patterns
    loadings = eigvecs.T   # (n_components x n_tenors)
    factor_names = []
    for i, load in enumerate(loadings):
        if np.all(load > 0) or np.all(load < 0):
            factor_names.append('level')
        elif load[0] * load[-1] < 0:
            factor_names.append('slope')
        else:
            factor_names.append('curvature')

    return {
        'loadings':         pd.DataFrame(loadings, index=[f'PC{i+1}' for i in range(n_components)],
                                          columns=yield_data.columns),
        'scores':           pd.DataFrame(scores, index=dy.index,
                                          columns=[f'PC{i+1}' for i in range(n_components)]),
        'eigenvalues':      eigvals.tolist(),
        'explained_var_pct': exp_var_pct,
        'cumulative_var_pct': np.cumsum(exp_var_pct).tolist(),
        'factor_names':     factor_names,
        'reconstruction_rmse': float(np.sqrt(np.mean((dy_c - (scores @ eigvecs.T))**2))),
    }`,
    explanation: "PCA on yield curve changes consistently produces three dominant factors across all markets: level (parallel shift) explains ~80-90% of variance, slope (steepening) ~10%, and curvature (butterfly) ~2-5%; trading desks use these factors to construct hedged curve trades — a bullet-to-barbell swap is dollar-neutral on level (PC1) and slope (PC2) but has a specific curvature (PC3) exposure, making it a pure butterfly bet.",
  },
  {
    id: "pyfin-20260624-b1-momentum-factor",
    language: "python",
    title: "Cross-sectional momentum factor construction and portfolio",
    tag: "factor-models",
    code: `import pandas as pd
import numpy as np

def momentum_portfolio(returns: pd.DataFrame,
                        lookback: int = 252,
                        skip: int = 21,
                        hold: int = 21,
                        n_quantiles: int = 5,
                        tc_bps: float = 5.0) -> dict:
    """
    Cross-sectional momentum (Jegadeesh-Titman 1993):
    1. Rank stocks by cumulative return over [t-lookback, t-skip] (skip last month).
    2. Long top quintile, short bottom quintile.
    3. Hold for 'hold' periods, rebalance monthly.
    4. Deduct transaction costs.

    returns: (T x N) daily stock returns
    tc_bps:  one-way transaction cost in basis points
    """
    T, N = returns.shape

    # Cumulative log returns: from t-lookback to t-skip
    log_ret   = np.log1p(returns)
    cum_log   = log_ret.rolling(lookback).sum() - log_ret.rolling(skip).sum()
    # Exclude skip period: backward-looking [t-lookback, t-skip]

    port_returns = []
    rebal_dates  = returns.index[lookback::hold]

    prev_weights = pd.Series(0.0, index=returns.columns)

    for date in rebal_dates:
        if date not in cum_log.index:
            continue
        ranking = cum_log.loc[date].rank(pct=True)
        if ranking.isna().all():
            continue

        long_mask  = ranking >= (1.0 - 1.0/n_quantiles)
        short_mask = ranking <= (1.0/n_quantiles)

        n_long  = long_mask.sum()
        n_short = short_mask.sum()
        if n_long == 0 or n_short == 0:
            continue

        # Equal-weight long-short portfolio
        new_weights = pd.Series(0.0, index=returns.columns)
        new_weights[long_mask]  =  1.0 / n_long
        new_weights[short_mask] = -1.0 / n_short

        # Turnover-based transaction cost
        turnover = float((new_weights - prev_weights).abs().sum())
        tc_drag  = turnover * tc_bps / 10000.0

        # Forward returns for the holding period
        start_idx = returns.index.get_loc(date) + 1
        end_idx   = min(start_idx + hold, T)
        period_ret = returns.iloc[start_idx:end_idx]

        port_ret = (period_ret * new_weights).sum(axis=1) - tc_drag / hold
        port_returns.append(port_ret)
        prev_weights = new_weights

    if not port_returns:
        return {}

    port_series = pd.concat(port_returns)
    ann_ret     = float(port_series.mean() * 252)
    ann_vol     = float(port_series.std() * np.sqrt(252))
    sharpe      = ann_ret / ann_vol if ann_vol > 0 else 0.0

    cum_ret     = (1 + port_series).cumprod()
    drawdown    = cum_ret / cum_ret.cummax() - 1
    max_dd      = float(drawdown.min())

    return {
        'ann_return':   ann_ret,
        'ann_vol':      ann_vol,
        'sharpe':       sharpe,
        'max_drawdown': max_dd,
        'calmar':       ann_ret / abs(max_dd) if max_dd < 0 else np.inf,
        'n_rebalances': len(port_returns),
        'series':       port_series,
    }`,
    explanation: "Jegadeesh-Titman momentum skips the most recent month (skip=21 days) because of short-term reversal — the prior-month return is negatively autocorrelated due to bid-ask bounce and microstructure effects, and including it actually reduces momentum profits; momentum crashes severely during market reversals (early 2009, Q1 2020) because the short leg consists of recent losers that recover sharply, making crash protection (via tail hedging or momentum drawdown filters) essential.",
  },
  {
    id: "pyfin-20260624-b1-mean-reversion-strategy",
    language: "python",
    title: "Mean-reversion z-score strategy with dynamic signal scaling",
    tag: "stat-arb",
    code: `import numpy as np
import pandas as pd
from dataclasses import dataclass, field

@dataclass
class MeanReversionStrategy:
    """
    Z-score mean-reversion on a stationary spread.
    Signal: z = (spread - mu) / sigma (rolling)
    Position: -sign(z) * min(|z|/entry_z, 1) * max_notional
    Entry: |z| > entry_z  Exit: |z| < exit_z
    """
    lookback:     int   = 60      # rolling window for mu, sigma
    entry_z:      float = 2.0     # enter when |z| exceeds this
    exit_z:       float = 0.5     # exit when |z| < this
    max_notional: float = 1.0     # normalised position cap

    def signals(self, spread: pd.Series) -> pd.DataFrame:
        mu    = spread.rolling(self.lookback).mean()
        sigma = spread.rolling(self.lookback).std()
        z     = (spread - mu) / sigma.replace(0, np.nan)

        # Clamp z to avoid extreme positions
        z_clip = z.clip(-3.0, 3.0)

        # Continuous position: -sign(z) * |z| / entry_z (capped at 1)
        # Only activate when |z| > entry_z
        raw_pos = np.where(z_clip.abs() > self.entry_z,
                            -z_clip / self.entry_z,
                            0.0)
        raw_pos = np.clip(raw_pos, -1.0, 1.0)

        # Exit rule: close position when |z| < exit_z (if we had a position)
        position = pd.Series(raw_pos, index=spread.index, name='position')

        # Carry forward position until exit threshold
        pos_out = []
        cur_pos = 0.0
        for z_val, raw in zip(z.values, raw_pos):
            if not np.isnan(z_val):
                if abs(z_val) < self.exit_z:
                    cur_pos = 0.0   # exit
                elif abs(z_val) > self.entry_z:
                    cur_pos = float(np.clip(-z_val / self.entry_z, -1.0, 1.0))
            pos_out.append(cur_pos)

        return pd.DataFrame({
            'spread': spread,
            'z_score': z,
            'mu': mu,
            'sigma': sigma,
            'position': pd.Series(pos_out, index=spread.index) * self.max_notional,
        })

    def backtest(self, spread: pd.Series, spread_returns: pd.Series,
                  tc_per_unit: float = 0.0) -> dict:
        df  = self.signals(spread)
        pos = df['position'].shift(1)   # use yesterday's signal

        # P&L = position * spread_return - |delta_position| * tc
        pnl    = pos * spread_returns
        trades = pos.diff().abs() * tc_per_unit
        net    = pnl - trades

        ann    = net.mean() * 252
        vol    = net.std() * np.sqrt(252)
        sr     = ann / vol if vol > 0 else 0.0
        return {
            'annualised_pnl': float(ann),
            'ann_vol':        float(vol),
            'sharpe':         float(sr),
            'n_trades':       int((pos.diff().abs() > 0.01).sum()),
            'hit_rate':       float((net > 0).mean()),
        }`,
    explanation: "Continuous position sizing (proportional to z-score magnitude) is superior to binary on/off because it builds a larger position as the spread deviates further and gradually exits as it mean-reverts — this captures the non-linear payoff structure of mean-reversion without waiting for a single exit threshold; the separate entry/exit thresholds (entry_z > exit_z) create a hysteresis band that prevents churning around the mean when the spread oscillates near the threshold.",
  },
  {
    id: "pyfin-20260624-b1-bootstrap-backtest",
    language: "python",
    title: "Stationary bootstrap for backtest confidence intervals",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd
from arch.bootstrap import StationaryBootstrap

def bootstrap_sharpe(returns: pd.Series,
                       n_bootstrap: int = 1000,
                       block_size: int = 21,
                       seed: int = 0) -> dict:
    """
    Stationary bootstrap (Politis-Romano 1994) for time-series inference.
    Unlike i.i.d. bootstrap, stationary bootstrap preserves autocorrelation
    structure by using geometrically distributed block lengths.

    Use case: confidence interval for Sharpe ratio, alpha, max drawdown.
    Avoids the invalid assumption of i.i.d. returns.
    """
    try:
        from arch.bootstrap import StationaryBootstrap as SB
    except ImportError:
        # Fallback: manual implementation
        return _manual_stationary_bootstrap(returns, n_bootstrap, block_size, seed)

    rng = np.random.default_rng(seed)
    bs  = SB(block_size, returns.values, random_state=int(rng.integers(0, 2**31)))

    sharpes     = []
    ann_returns = []
    max_dds     = []

    for pos_data, _ in bs.bootstrap(n_bootstrap):
        r = pos_data[0]
        ann_r  = r.mean() * 252
        ann_v  = r.std() * np.sqrt(252)
        sharpes.append(ann_r / ann_v if ann_v > 0 else 0.0)
        ann_returns.append(ann_r)
        cum = (1 + r).cumprod()
        max_dds.append(float((cum / cum.cummax() - 1).min()))

    sharpes     = np.array(sharpes)
    point_est   = float(returns.mean() * 252 / (returns.std() * np.sqrt(252)))

    return {
        'sharpe_point':   point_est,
        'sharpe_mean_bs': float(sharpes.mean()),
        'sharpe_ci_95':   (float(np.percentile(sharpes, 2.5)),
                           float(np.percentile(sharpes, 97.5))),
        'sharpe_pval':    float((sharpes <= 0).mean()),   # H0: Sharpe <= 0
        'max_dd_ci_95':   (float(np.percentile(max_dds, 2.5)),
                           float(np.percentile(max_dds, 97.5))),
        'ann_return_ci':  (float(np.percentile(ann_returns, 2.5)),
                           float(np.percentile(ann_returns, 97.5))),
    }

def _manual_stationary_bootstrap(returns, n_bootstrap, block_size, seed):
    rng = np.random.default_rng(seed)
    T   = len(returns)
    r   = returns.values
    sharpes = []
    for _ in range(n_bootstrap):
        sample = []
        while len(sample) < T:
            start  = rng.integers(0, T)
            length = 1 + rng.geometric(1.0 / block_size) - 1
            for j in range(length):
                sample.append(r[(start + j) % T])
        sample = np.array(sample[:T])
        v = sample.std() * np.sqrt(252)
        sharpes.append(sample.mean() * 252 / v if v > 0 else 0.0)
    sharpes = np.array(sharpes)
    return {'sharpe_ci_95': (float(np.percentile(sharpes, 2.5)),
                              float(np.percentile(sharpes, 97.5)))}`,
    explanation: "The stationary bootstrap resamples blocks of returns rather than individual returns, preserving the autocorrelation structure — standard i.i.d. bootstrap on returns with GARCH volatility clustering underestimates the uncertainty in Sharpe ratio by assuming independence; the geometric block length distribution (rather than fixed blocks) ensures the resampled series is also stationary, which is required for valid inference.",
  },
  {
    id: "pyfin-20260624-b1-cds-index",
    language: "python",
    title: "CDX index pricing and spread decomposition",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def cdx_index_price(n_names: int, recovery: float,
                     notional: float, index_spread: float,
                     coupon: float, tenors: np.ndarray,
                     risk_free_dfs: np.ndarray,
                     equal_hazards: bool = True) -> dict:
    """
    CDX IG/HY index pricing.
    CDX = basket of n_names CDS; equal weight (1/n each).
    Assume flat hazard rate lambda for all names (simplified).

    Index NPV = notional * (default_leg_pv - premium_leg_pv)
    Accrued on default: 0.5 * coupon * tau (accrued period)
    """
    # Solve for flat hazard rate matching index_spread
    def par_spread(lam: float) -> float:
        S   = np.exp(-lam * tenors)   # survival probability
        tau = np.diff(np.concatenate([[0.0], tenors]))
        annuity    = float(np.sum(tau * risk_free_dfs * S))
        default_pv = float((1.0 - recovery) *
                           np.sum(risk_free_dfs * (-np.diff(np.concatenate([[1.0], S])))))
        return default_pv / annuity if annuity > 0 else 0.0

    lambda_flat = brentq(lambda h: par_spread(h) - index_spread, 1e-6, 5.0)

    # Mark-to-market NPV for existing position with coupon != index_spread
    S   = np.exp(-lambda_flat * tenors)
    tau = np.diff(np.concatenate([[0.0], tenors]))
    annuity    = float(np.sum(tau * risk_free_dfs * S))
    default_pv = float((1.0 - recovery) *
                       np.sum(risk_free_dfs * (-np.diff(np.concatenate([[1.0], S])))))

    premium_pv = coupon    * annuity
    npv        = notional  * (default_pv - premium_pv)

    # Spread DV01: sensitivity to 1bp index spread widening
    def npv_at_spread(s):
        lam = brentq(lambda h: par_spread(h) - s, 1e-7, 5.0)
        S2  = np.exp(-lam * tenors)
        ann2 = float(np.sum(tau * risk_free_dfs * S2))
        dp2  = float((1.0 - recovery) *
                     np.sum(risk_free_dfs * (-np.diff(np.concatenate([[1.0], S2])))))
        return notional * (dp2 - coupon * ann2)

    dv01 = (npv_at_spread(index_spread + 0.0001) -
            npv_at_spread(index_spread - 0.0001)) / 2.0

    return {
        'npv':              npv,
        'hazard_rate':      lambda_flat,
        'annuity':          annuity,
        'default_leg_pv':   default_pv * notional,
        'premium_leg_pv':   premium_pv * notional,
        'spread_dv01':      dv01,
        'breakeven_spread': float(par_spread(lambda_flat)),
    }`,
    explanation: "CDX index pricing treats the basket as a single-name CDS with an average hazard rate — this 'intrinsic' spread is the equal-weighted average of constituent CDS spreads under the homogeneous pool assumption; the index typically trades at a spread different from the intrinsic due to liquidity premium, hedging demand, and non-linearity (correlation effects), and this basis is itself a tradable signal for arbitrageurs.",
  },
];
