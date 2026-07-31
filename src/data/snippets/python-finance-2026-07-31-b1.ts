import type { Snippet } from "./types";

export const pythonFinanceSnippets20260731B1: Snippet[] = [
  {
    id: "pyfin-20260731-b1-pandas-groupby-pnl",
    language: "python",
    title: "pandas groupby PnL attribution by strategy and sector",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

def pnl_attribution(df: pd.DataFrame) -> pd.DataFrame:
    """
    df columns: date, strategy, sector, pnl
    Returns per-(strategy, sector) aggregated stats.
    """
    return (
        df.groupby(["strategy", "sector"])["pnl"]
        .agg(
            total_pnl="sum",
            mean_daily="mean",
            vol="std",
            sharpe=lambda x: x.mean() / x.std() * np.sqrt(252) if x.std() else 0,
            win_rate=lambda x: (x > 0).mean(),
            n_days="count",
        )
        .sort_values("total_pnl", ascending=False)
    )`,
    explanation: "Named aggregations (pd.NamedAgg or keyword form) build multiple stats in a single groupby pass. Lambda aggregators let you add derived metrics like Sharpe and win-rate inline. sort_values keeps the highest-contributing buckets at the top for quick scanning."
  },
  {
    id: "pyfin-20260731-b1-cvxpy-max-sharpe",
    language: "python",
    title: "CVXPY maximum Sharpe ratio via auxiliary variable trick",
    tag: "portfolio-optimisation",
    code: `import cvxpy as cp
import numpy as np

def max_sharpe(mu: np.ndarray, Sigma: np.ndarray,
               rf: float = 0.0) -> np.ndarray:
    """
    Maximise (mu - rf)^T w / sqrt(w^T Sigma w) subject to w >= 0, sum(w)=1.
    Reformulation: let y = w/kappa where kappa = 1/((mu-rf)^T w).
    """
    n = len(mu)
    y     = cp.Variable(n, nonneg=True)      # y = w / kappa
    kappa = cp.Variable(pos=True)            # 1 / excess return

    prob = cp.Problem(
        cp.Minimize(cp.quad_form(y, Sigma)),  # minimise portfolio variance
        [
            (mu - rf) @ y == 1,              # normalisation
            cp.sum(y) == kappa,              # budget in rescaled space
        ],
    )
    prob.solve(solver=cp.CLARABEL)
    w = y.value / kappa.value
    return w / w.sum()                       # re-normalise for safety`,
    explanation: "Direct Sharpe maximisation is non-convex. The auxiliary-variable trick (Lobo et al. 1998) converts it to a QP: divide by the excess return kappa, making the objective quadratic in y=w/kappa. Recover weights as y/kappa, then re-normalise."
  },
  {
    id: "pyfin-20260731-b1-cvxpy-cvar",
    language: "python",
    title: "CVXPY CVaR (Expected Shortfall) portfolio optimisation",
    tag: "risk",
    code: `import cvxpy as cp
import numpy as np

def min_cvar_portfolio(returns: np.ndarray,
                       alpha: float = 0.05) -> np.ndarray:
    """
    Minimise CVaR at confidence level (1-alpha) via Rockafellar-Uryasev LP.
    returns: (T x n) matrix of historical scenario returns.
    """
    T, n = returns.shape
    w      = cp.Variable(n, nonneg=True)
    VaR    = cp.Variable()
    losses = cp.Variable(T, nonneg=True)   # exceedance above VaR

    cvar = VaR + (1.0 / (T * alpha)) * cp.sum(losses)
    prob = cp.Problem(
        cp.Minimize(cvar),
        [
            losses >= -returns @ w - VaR,  # exceedance constraint
            cp.sum(w) == 1,
        ],
    )
    prob.solve(solver=cp.CLARABEL)
    return w.value`,
    explanation: "Rockafellar-Uryasev (2000) reformulates CVaR as a linear program. losses[t] = max(0, -r_t @ w - VaR). Minimising over VaR jointly finds the optimal VaR threshold. Works directly on historical scenarios — no parametric distribution assumption required."
  },
  {
    id: "pyfin-20260731-b1-newey-west-ols",
    language: "python",
    title: "Newey-West HAC standard errors for factor regressions",
    tag: "econometrics",
    code: `import numpy as np
import statsmodels.api as sm

def newey_west_ols(y: np.ndarray, X: np.ndarray,
                   lags: int = 4) -> dict:
    """
    OLS with Newey-West (1987) HAC standard errors.
    Corrects for heteroskedasticity AND autocorrelation in residuals.
    Typical in factor-model t-statistics where returns are autocorrelated.
    """
    X_c   = sm.add_constant(X)
    model = sm.OLS(y, X_c).fit(
        cov_type="HAC",
        cov_kwds={"maxlags": lags},
    )
    return {
        "params":  model.params,
        "se":      model.bse,
        "t_stat":  model.tvalues,
        "p_value": model.pvalues,
        "r2":      model.rsquared,
        "n_obs":   int(model.nobs),
    }`,
    explanation: "Standard OLS SEs assume i.i.d. residuals. Newey-West uses a Bartlett kernel to down-weight distant lags. Rule of thumb for lags: T^(1/3) or 4*(T/100)^(2/9). Essential for monthly factor returns, which are autocorrelated due to momentum and reversal."
  },
  {
    id: "pyfin-20260731-b1-gbm-alpha",
    language: "python",
    title: "GBM drift and vol MLE from price series",
    tag: "time-series",
    code: `import numpy as np

def estimate_gbm(prices: np.ndarray, dt: float = 1 / 252) -> dict:
    """
    Maximum-likelihood estimates of GBM parameters (mu, sigma) from prices.
    dS = mu*S*dt + sigma*S*dW  =>  log(S_{t+1}/S_t) ~ N((mu-s^2/2)*dt, s^2*dt)
    """
    log_ret = np.diff(np.log(prices))
    n       = len(log_ret)
    # MLE for sigma^2 from log-returns
    sigma_sq = np.var(log_ret, ddof=0) / dt
    sigma    = np.sqrt(sigma_sq)
    # Ito correction: mu = E[log-ret]/dt + 0.5*sigma^2
    mu = np.mean(log_ret) / dt + 0.5 * sigma_sq
    se_mu = sigma / np.sqrt(n * dt)   # std error of mu estimate
    return {"mu": mu, "sigma": sigma, "se_mu": se_mu, "n_obs": n}`,
    explanation: "The Ito correction (+0.5*sigma^2) recovers the actual drift from log-return estimates; omitting it understates mu. se_mu = sigma/sqrt(T) shows why estimating drift is hard: with 10 years of daily data (T=10), se_mu ~ sigma/sqrt(10) ≈ 6% for a 20% vol stock."
  },
  {
    id: "pyfin-20260731-b1-bachelier-swaption",
    language: "python",
    title: "Bachelier (normal) model swaption pricing",
    tag: "rates",
    code: `import numpy as np
from scipy.stats import norm

def bachelier_swaption(F: float, K: float, T: float,
                        sigma_n: float, annuity: float,
                        payer: bool = True) -> float:
    """
    Bachelier (1900) normal-model swaption price.
    F:       forward swap rate
    K:       strike swap rate
    T:       option expiry (years)
    sigma_n: normal (basis-point) volatility
    annuity: swap annuity / DV01 (sum of discount factors * accrual fractions)
    """
    std = sigma_n * np.sqrt(T)
    if std < 1e-12:
        return annuity * max((F - K) * (1 if payer else -1), 0.0)
    d = (F - K) / std
    phi = 1 if payer else -1
    return annuity * phi * ((F - K) * norm.cdf(phi * d) + std * norm.pdf(d))`,
    explanation: "Normal vol is standard for interest-rate derivatives in low/negative-rate regimes (post-2016 SABR convention). annuity = sum_i(tau_i * P(0,T_i)) where tau is accrual fraction and P is the discount factor. Relation to lognormal: sigma_n ≈ F * sigma_ln for ATM options."
  },
  {
    id: "pyfin-20260731-b1-heston-cf-fft",
    language: "python",
    title: "Heston characteristic function for FFT option pricing",
    tag: "stochastic-vol",
    code: `import numpy as np

def heston_char_fn(u: complex, S0: float, T: float, r: float,
                    kappa: float, theta: float, xi: float,
                    rho: float, v0: float) -> complex:
    """
    Heston (1993) characteristic function of log(S_T) under risk-neutral measure.
    E[exp(i*u*log(S_T))] = exp(C + D*v0 + i*u*log(S0))
    """
    i   = 1j
    b   = kappa - rho * xi * i * u
    d   = np.sqrt(b**2 + xi**2 * u * (u + i))
    g   = (b - d) / (b + d)
    exp_dT = np.exp(-d * T)
    C = (r * i * u * T
         + (kappa * theta / xi**2)
         * ((b - d) * T - 2 * np.log((1 - g * exp_dT) / (1 - g))))
    D = ((b - d) / xi**2) * (1 - exp_dT) / (1 - g * exp_dT)
    return np.exp(C + D * v0 + i * u * np.log(S0))`,
    explanation: "The Heston CF uses the square-root form of d (not the original Heston 1993 form) to avoid branch-cut discontinuities (Lord-Kahl 2006 rotation correction). Vectorise u over a grid of N values, multiply by the Carr-Madan damping factor, then FFT to get N option prices at once."
  },
  {
    id: "pyfin-20260731-b1-vanna-volga",
    language: "python",
    title: "Vanna-Volga FX option smile adjustment",
    tag: "vol-surface",
    code: `import numpy as np
from scipy.stats import norm

def bs_price(S, K, T, r, q, vol, flag="call"):
    d1 = (np.log(S / K) + (r - q + 0.5 * vol**2) * T) / (vol * np.sqrt(T))
    d2 = d1 - vol * np.sqrt(T)
    phi = 1 if flag == "call" else -1
    return phi * (S * np.exp(-q * T) * norm.cdf(phi * d1)
                  - K * np.exp(-r * T) * norm.cdf(phi * d2))

def rr_bf_to_vols(sigma_atm, rr_25, bf_25):
    """Convert 25-delta RR/BF quotes to wing vols (FX market convention)."""
    return {
        "sigma_25c": sigma_atm + bf_25 + 0.5 * rr_25,
        "sigma_25p": sigma_atm + bf_25 - 0.5 * rr_25,
        "sigma_atm": sigma_atm,
    }

# Vanna-Volga price adjustment:
# P_VV = P_BS(sigma_atm) + x1*(P_BS(s25c) - P_BS(s_atm))
#                         + x2*(P_BS(s25p) - P_BS(s_atm))
# x1, x2 are weights from 3x3 vanna/volga linear system (Castagna-Mercurio 2007)`,
    explanation: "Vanna-Volga pricing hedges an exotic option's vanna and volga risks using three market-quoted instruments: ATM, 25-delta call, 25-delta put. It produces a smile-consistent price without a full stochastic-vol model. Standard for first-generation FX exotics (barrier options, one-touch)."
  },
  {
    id: "pyfin-20260731-b1-rough-bergomi",
    language: "python",
    title: "Rough Bergomi Monte Carlo (fractional Brownian motion)",
    tag: "stochastic-vol",
    code: `import numpy as np

def rough_bergomi_terminal(S0: float, xi0: float, eta: float,
                            H: float, rho: float,
                            T: float, N: int, M: int,
                            seed: int = 42) -> np.ndarray:
    """
    Bayer-Friz-Gatheral (2016) rough Bergomi: V_t = xi0 * exp(eta * W^H_t - 0.5*eta^2*t^{2H})
    Simulates S_T via Euler discretisation of the log-price.
    H in (0,0.5) gives rough (negatively autocorrelated) vol.
    """
    rng = np.random.default_rng(seed)
    dt  = T / N
    t   = np.linspace(dt, T, N)

    dW1 = rng.standard_normal((M, N)) * np.sqrt(dt)   # vol Brownian increments
    dW2 = rho * dW1 + np.sqrt(1 - rho**2) * rng.standard_normal((M, N)) * np.sqrt(dt)

    # Fractional kernel weights: K(t_i, t_j) = (t_i - t_j)^{H-0.5}
    # Approximate: variance process (rough vol) is built as a weighted sum of past shocks
    log_V = np.zeros((M, N))
    for i in range(N):
        if i > 0:
            kernel = (t[i] - t[:i]) ** (H - 0.5)
            kernel /= kernel.sum() if kernel.sum() > 0 else 1.0
            log_V[:, i] = eta * (dW1[:, :i] @ kernel)
        log_V[:, i] -= 0.5 * eta**2 * t[i] ** (2 * H)

    V     = xi0 * np.exp(log_V)
    log_S = np.cumsum(-0.5 * V * dt + np.sqrt(np.maximum(V, 0)) * dW2, axis=1)
    return S0 * np.exp(log_S[:, -1])`,
    explanation: "Rough Bergomi uses fractional Brownian motion (H < 0.5) to generate rough (negatively autocorrelated) volatility paths, matching the steep ATM skew term structure observed in equity markets. The kernel (t-s)^{H-0.5} introduces long-range memory in the vol process."
  },
  {
    id: "pyfin-20260731-b1-bipower-var",
    language: "python",
    title: "Bipower variation and Barndorff-Nielsen jump test",
    tag: "time-series",
    code: `import numpy as np

def bipower_variation(log_ret: np.ndarray) -> dict:
    """
    Barndorff-Nielsen & Shephard (2004) bipower variation for jump detection.
    BPV = (pi/2) * sum |r_t| * |r_{t-1}|  (consistent estimator of integrated variance)
    RV  = sum r_t^2  (includes jumps)
    Jump component = max(RV - BPV, 0)
    """
    mu1  = np.sqrt(2 / np.pi)   # E[|N(0,1)|]
    rv   = float(np.sum(log_ret ** 2))
    bpv  = mu1**(-2) * float(np.sum(np.abs(log_ret[1:]) * np.abs(log_ret[:-1])))
    jump = max(rv - bpv, 0.0)
    ratio = jump / rv if rv > 0 else 0.0
    # Zt stat ~ N(0,1) under no-jump null; reject if |Zt| > 1.96
    return {"RV": rv, "BPV": bpv, "jump_component": jump, "jump_ratio": ratio}`,
    explanation: "RV = integrated variance + jump variance. BPV is robust to jumps because |r_t|*|r_{t-1}| zeroes out when either return is a jump. The ratio RV/BPV tests the null of no jumps; use the Zt statistic from the paper for formal testing. Applied daily to intraday 5-min returns."
  },
  {
    id: "pyfin-20260731-b1-har-rv",
    language: "python",
    title: "HAR-RV model (Corsi 2009) for volatility forecasting",
    tag: "time-series",
    code: `import numpy as np
import statsmodels.api as sm

def fit_har_rv(rv: np.ndarray) -> dict:
    """
    HAR-RV: RV_{t+1} ~ b0 + b_d*RV_t + b_w*RV^(5)_t + b_m*RV^(22)_t
    rv: daily realised variance series.
    """
    T    = len(rv)
    rv_w = np.array([rv[max(0, i-5):i].mean()  for i in range(T)])
    rv_m = np.array([rv[max(0, i-22):i].mean() for i in range(T)])

    start = 22   # need 22 days of history
    y = rv[start:]
    X = sm.add_constant(np.column_stack([
        rv[start - 1:-1],    # daily lag
        rv_w[start - 1:-1],  # weekly average
        rv_m[start - 1:-1],  # monthly average
    ]))
    res = sm.OLS(y, X).fit(cov_type="HAC", cov_kwds={"maxlags": 5})
    return {"params": res.params, "r2": res.rsquared,
            "t_stats": res.tvalues, "aic": res.aic}`,
    explanation: "HAR-RV (Heterogeneous Autoregressive RV) uses daily, weekly, and monthly realised variance to forecast next-day RV. The different horizons capture short-term traders (daily), medium-term (weekly), and slow-moving institutional effects (monthly). Outperforms GARCH on out-of-sample RMSE."
  },
  {
    id: "pyfin-20260731-b1-perpetual-american",
    language: "python",
    title: "Perpetual American put closed-form solution",
    tag: "derivatives",
    code: `import numpy as np

def perpetual_american_put(S: float, K: float, r: float,
                            q: float, sigma: float) -> tuple:
    """
    Closed-form price for a perpetual (infinite-horizon) American put.
    Optimal exercise boundary: S* = K * beta / (beta - 1)
    Value: A * S^beta  for S > S*,  K - S  for S <= S*
    """
    s2   = sigma ** 2
    nu   = r - q - 0.5 * s2
    beta = (-nu - np.sqrt(nu ** 2 + 2 * r * s2)) / s2   # negative root
    S_star = K * beta / (beta - 1)                        # exercise boundary
    A      = (K - S_star) * S_star ** (-beta)

    if S <= S_star:
        return K - S, S_star            # exercise immediately
    return A * (S ** beta), S_star      # hold: power-law value function`,
    explanation: "The perpetual American put has an exact solution because the optimal stopping time is the first passage of S below S*. beta is the negative root of the quadratic 0.5*s^2*b*(b-1) + nu*b - r = 0. As T → ∞, the European put price converges to 0 while the American put retains value."
  },
  {
    id: "pyfin-20260731-b1-liquidity-var",
    language: "python",
    title: "Liquidity-adjusted VaR (LVAR) — Bangia et al.",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def liquidity_adjusted_var(value: float, vol: float,
                            spread_mean: float, spread_std: float,
                            alpha: float = 0.99,
                            horizon_days: int = 10) -> dict:
    """
    LVAR = Market VaR + Liquidity Cost (Bangia et al. 1999).
    spread_mean, spread_std: bid-ask spread as fraction of price.
    Assumes spread and returns are independent.
    """
    z = norm.ppf(alpha)
    market_var = value * vol * np.sqrt(horizon_days / 252) * z
    # Worst-case spread cost at confidence alpha
    liq_cost   = 0.5 * value * (spread_mean + z * spread_std)
    lvar       = market_var + liq_cost
    return {
        "market_var": market_var,
        "liquidity_cost": liq_cost,
        "lvar": lvar,
        "lvar_bps": lvar / value * 1e4,
    }`,
    explanation: "LVAR adds an explicit liquidity cost (half the bid-ask spread) to the market VaR. The spread is modelled as a random variable with its own confidence-level worst case. Important for illiquid assets: a 10% spread on a 1M position adds 50k liquidity cost on top of the market VaR."
  },
  {
    id: "pyfin-20260731-b1-ohlcv-resample",
    language: "python",
    title: "pandas OHLCV resampling with VWAP from tick data",
    tag: "market-data",
    code: `import pandas as pd

def resample_ohlcv(ticks: pd.DataFrame,
                   freq: str = "1min") -> pd.DataFrame:
    """
    Resample tick data to OHLCV bars with VWAP.
    ticks index: DatetimeIndex (UTC)
    ticks columns: price (float), volume (float)
    """
    ticks = ticks.sort_index()
    ohlcv = ticks["price"].resample(freq).ohlc()
    ohlcv["volume"] = ticks["volume"].resample(freq).sum()
    dollar_vol      = (ticks["price"] * ticks["volume"]).resample(freq).sum()
    share_vol       = ticks["volume"].resample(freq).sum()
    ohlcv["vwap"]   = dollar_vol / share_vol
    return ohlcv.dropna(subset=["open"])   # drop empty bars`,
    explanation: "resample().ohlc() vectorises bar construction over timestamps. VWAP = sum(price*volume) / sum(volume) per bar. dropna(subset=['open']) removes empty bars without dropping bars that merely have NaN volume. For large tick files, read in chunks or use Dask."
  },
  {
    id: "pyfin-20260731-b1-commodity-fwd-curve",
    language: "python",
    title: "Commodity forward curve fitting (Samuelson effect)",
    tag: "commodities",
    code: `import numpy as np
from scipy.optimize import curve_fit

def fit_fwd_curve(tenors: np.ndarray,
                  fwd_prices: np.ndarray) -> dict:
    """
    Fit F(T) = L + B * exp(-kappa * T)
    L = long-run equilibrium, B = basis (front-month premium/discount),
    kappa = mean-reversion speed (Samuelson effect: vol decays with tenor).
    """
    def model(T, L, B, kappa):
        return L + B * np.exp(-kappa * T)

    p0   = (fwd_prices[-1], fwd_prices[0] - fwd_prices[-1], 0.5)
    popt, pcov = curve_fit(model, tenors, fwd_prices, p0=p0, maxfev=5000)
    L, B, kappa = popt
    return {
        "long_run": L, "basis": B, "kappa": kappa,
        "half_life_months": np.log(2) / kappa if kappa > 0 else np.inf,
        "fitted": model(tenors, *popt),
        "rmse": float(np.sqrt(np.mean((fwd_prices - model(tenors, *popt))**2))),
    }`,
    explanation: "The Samuelson (1965) effect: commodity price volatility increases as contracts approach delivery. The exponential decay model F(T) = L + B*exp(-kappa*T) captures the convergence from spot to long-run equilibrium. kappa^{-1} is the mean-reversion time in the same units as tenors."
  },
  {
    id: "pyfin-20260731-b1-bhb-attribution",
    language: "python",
    title: "Brinson-Hood-Beebower performance attribution",
    tag: "portfolio-analytics",
    code: `import numpy as np

def brinson_attribution(
    w_p: np.ndarray, w_b: np.ndarray,
    r_p: np.ndarray, r_b: np.ndarray,
) -> dict:
    """
    Brinson-Hood-Beebower (1986) 3-effect attribution.
    w_p, w_b: portfolio / benchmark sector weights (sum to 1)
    r_p, r_b: portfolio / benchmark sector returns
    """
    allocation   = (w_p - w_b) * r_b               # active weight * bmk return
    selection    = w_b * (r_p - r_b)                # bmk weight * active return
    interaction  = (w_p - w_b) * (r_p - r_b)       # joint active effects
    active_return = float(w_p @ r_p - w_b @ r_b)
    return {
        "allocation":    float(allocation.sum()),
        "selection":     float(selection.sum()),
        "interaction":   float(interaction.sum()),
        "active_return": active_return,
        "residual": active_return
                   - allocation.sum() - selection.sum() - interaction.sum(),
    }`,
    explanation: "BHB decomposes active return into: Allocation (bet on sectors relative to benchmark), Selection (stock picking within sectors), and Interaction (their joint effect). Allocation + Selection + Interaction = total active return. Positive allocation means overweighting sectors that outperformed."
  },
  {
    id: "pyfin-20260731-b1-variance-gamma",
    language: "python",
    title: "Variance Gamma process Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np

def variance_gamma_mc(S0: float, T: float, r: float,
                       sigma: float, theta: float, nu: float,
                       N: int, seed: int = 42) -> np.ndarray:
    """
    Madan-Carr-Chang (1998) Variance Gamma: X_T = theta*G_T + sigma*W(G_T)
    G_T ~ Gamma(T/nu, nu) is the stochastic time change.
    Risk-neutral via: omega = log(1 - theta*nu - 0.5*sigma^2*nu) / nu
    """
    rng   = np.random.default_rng(seed)
    G     = rng.gamma(shape=T / nu, scale=nu, size=N)  # time change
    Z     = rng.standard_normal(N)
    omega = np.log(1.0 - theta * nu - 0.5 * sigma**2 * nu) / nu
    log_S = (r + omega) * T + theta * G + sigma * np.sqrt(G) * Z
    return S0 * np.exp(log_S)`,
    explanation: "VG is a pure-jump process with finite activity and infinite variation. The Gamma subordinator G_T introduces stochastic volatility AND skew. theta controls skewness (negative for equity puts), nu controls excess kurtosis. VG has semi-analytic option prices via the CF and Carr-Madan FFT."
  },
  {
    id: "pyfin-20260731-b1-rr-bf-vol",
    language: "python",
    title: "FX smile from risk-reversal and butterfly quotes",
    tag: "vol-surface",
    code: `import numpy as np
from scipy.optimize import brentq
from scipy.stats import norm

def bs_delta(S, K, T, r, q, vol, flag="call"):
    d1 = (np.log(S / K) + (r - q + 0.5 * vol**2) * T) / (vol * np.sqrt(T))
    return np.exp(-q * T) * norm.cdf(d1) * (1 if flag == "call" else -1)

def strike_from_delta(S, delta, T, r, q, vol, flag="call"):
    """Invert BS delta to find the strike K."""
    target = abs(delta)
    f = lambda K: abs(bs_delta(S, K, T, r, q, vol, flag)) - target
    return brentq(f, S * 0.01, S * 10.0)

def rr_bf_to_smile(S, T, r, q, sigma_atm, rr_25, bf_25):
    """Build 3-point vol smile from ATM/RR/BF FX quotes."""
    s25c = sigma_atm + bf_25 + 0.5 * rr_25
    s25p = sigma_atm + bf_25 - 0.5 * rr_25
    K_25c = strike_from_delta(S, 0.25, T, r, q, s25c, "call")
    K_25p = strike_from_delta(S, 0.25, T, r, q, s25p, "put")
    K_atm = S * np.exp((r - q) * T)  # ATM forward
    return {"K_25p": K_25p, "s_25p": s25p,
            "K_atm": K_atm, "s_atm": sigma_atm,
            "K_25c": K_25c, "s_25c": s25c}`,
    explanation: "FX vol surfaces are quoted as ATM straddle vol, 25-delta risk-reversal (RR = vol_25c - vol_25p), and butterfly (BF = 0.5*(vol_25c + vol_25p) - vol_atm). These three quotes anchor the smile; interpolate with SABR or cubic spline between the three (K, vol) points."
  },
  {
    id: "pyfin-20260731-b1-quantlib-zcurve",
    language: "python",
    title: "QuantLib zero-coupon curve bootstrap from deposit/swap rates",
    tag: "rates",
    code: `import QuantLib as ql

def bootstrap_zero_curve(settle: ql.Date, tenors: list, rates: list,
                          day_count=None) -> ql.ZeroSpreadedTermStructure:
    """
    Build a piecewise-linear zero curve from deposit rates.
    tenors: list of ql.Period, e.g. [ql.Period('1M'), ql.Period('3M'), ...]
    rates:  corresponding annualised rates as decimals
    """
    if day_count is None:
        day_count = ql.Actual365Fixed()
    ql.Settings.instance().evaluationDate = settle
    cal = ql.TARGET()

    helpers = [
        ql.DepositRateHelper(
            ql.QuoteHandle(ql.SimpleQuote(r)),
            t, 2, cal,
            ql.ModifiedFollowing, True, day_count,
        )
        for t, r in zip(tenors, rates)
    ]
    curve = ql.PiecewiseLinearZero(settle, helpers, day_count)
    curve.enableExtrapolation()
    return curve`,
    explanation: "QuantLib's PiecewiseLinearZero bootstraps the zero curve by finding discount factors that reprice each deposit exactly. DepositRateHelper converts a simple rate to a price. Use PiecewiseFlatForward or PiecewiseCubicZero for smoother forward curves. Call curve.zeroRate(date, dc, compounding) to extract rates."
  },
  {
    id: "pyfin-20260731-b1-quantile-regression",
    language: "python",
    title: "Quantile regression for tail-risk modelling with statsmodels",
    tag: "risk",
    code: `import statsmodels.formula.api as smf
import pandas as pd

def multi_quantile_regression(
    df: pd.DataFrame,
    formula: str,
    taus: list = None,
) -> pd.DataFrame:
    """
    Fit quantile regressions at multiple tau levels.
    formula: Patsy formula, e.g. 'loss ~ factor1 + factor2'
    taus:    quantile levels, e.g. [0.05, 0.25, 0.5, 0.75, 0.95]
    Returns a DataFrame indexed by tau with one column per coefficient.
    """
    if taus is None:
        taus = [0.05, 0.25, 0.5, 0.75, 0.95]
    rows = []
    for tau in taus:
        res = smf.quantreg(formula, df).fit(q=tau, max_iter=2000)
        rows.append({"tau": tau,
                     **dict(zip(res.params.index, res.params.values))})
    return pd.DataFrame(rows).set_index("tau")`,
    explanation: "Quantile regression estimates the conditional quantile of y given X, without distributional assumptions. tau=0.05 gives the expected loss in the worst 5% of scenarios — a non-parametric VaR model. Coefficient paths across tau reveal which factors matter in tails vs the median."
  },
  {
    id: "pyfin-20260731-b1-collar-strategy",
    language: "python",
    title: "Collar strategy P&L decomposition at expiry",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_price(S, K, T, r, q, vol, flag="call"):
    d1 = (np.log(S / K) + (r - q + 0.5 * vol**2) * T) / (vol * np.sqrt(T))
    d2 = d1 - vol * np.sqrt(T)
    phi = 1 if flag == "call" else -1
    return phi * (S * np.exp(-q * T) * norm.cdf(phi * d1)
                  - K * np.exp(-r * T) * norm.cdf(phi * d2))

def collar_pnl(S0: float, K_put: float, K_call: float,
               T: float, r: float, q: float, sigma: float,
               S_range: np.ndarray) -> dict:
    """
    Collar = long stock + long put(K_put) + short call(K_call).
    Net cost = put premium - call premium received.
    """
    put_prem  = bs_price(S0, K_put,  T, r, q, sigma, "put")
    call_prem = bs_price(S0, K_call, T, r, q, sigma, "call")
    net_cost  = put_prem - call_prem      # positive = net debit

    stock = S_range - S0
    put   = np.maximum(K_put  - S_range, 0) - put_prem
    call  = -(np.maximum(S_range - K_call, 0) - call_prem)
    return {
        "pnl":      stock + put + call,
        "net_cost": net_cost,
        "floor":    K_put  - S0 - net_cost,   # worst-case return
        "cap":      K_call - S0 - net_cost,   # best-case return
    }`,
    explanation: "A collar caps upside (short call) and floors downside (long put). If call premium > put premium, the collar generates a net credit (zero-cost collar). The floor = K_put - S0 - net_cost and cap = K_call - S0 - net_cost bound the range of outcomes at expiry."
  },
];
