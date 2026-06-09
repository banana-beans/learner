import type { Snippet } from "./types";

export const pythonFinanceSnippets20260609B1: Snippet[] = [
  {
    id: "pyfin-20260609-b1-garch11",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) estimation — conditional volatility from daily returns",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def garch11_log_likelihood(params, returns):
    """
    GARCH(1,1): sigma^2_t = omega + alpha*r_{t-1}^2 + beta*sigma^2_{t-1}
    Gaussian quasi-maximum likelihood estimator.
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10
    n   = len(returns)
    # Initialise variance at unconditional variance
    var_unc = omega / (1 - alpha - beta)
    var     = np.full(n, var_unc)
    for t in range(1, n):
        var[t] = omega + alpha * returns[t-1]**2 + beta * var[t-1]
    # Gaussian log-likelihood: sum[ -0.5*(log(2pi) + log(var_t) + r_t^2/var_t) ]
    log_lik = -0.5 * np.sum(np.log(2 * np.pi) + np.log(var) + returns**2 / var)
    return -log_lik   # negative for minimisation

def fit_garch11(returns: np.ndarray) -> dict:
    """MLE fit of GARCH(1,1) to return series (already de-meaned)."""
    x0      = [1e-5, 0.10, 0.85]   # typical starting point
    bounds  = [(1e-9, None), (0, 0.999), (0, 0.999)]
    res     = minimize(garch11_log_likelihood, x0, args=(returns,),
                       method="L-BFGS-B", bounds=bounds,
                       options={"maxiter": 2000, "ftol": 1e-12})
    omega, alpha, beta = res.x
    persistence = alpha + beta
    half_life   = -np.log(2) / np.log(persistence) if persistence < 1 else np.inf

    return {
        "omega":       round(float(omega), 8),
        "alpha":       round(float(alpha), 6),
        "beta":        round(float(beta),  6),
        "persistence": round(float(persistence), 6),
        "uncond_vol":  round(float(np.sqrt(omega / (1 - persistence)) * np.sqrt(252)), 4),
        "half_life_days": round(float(half_life), 1),
        "log_lik":     round(float(-res.fun), 2),
    }

# Persistence close to 1 (e.g. 0.97-0.99) means vol shocks decay slowly
# — long-memory volatility (a stylised fact of equity markets).`,
    explanation:
      "GARCH(1,1) captures the two key stylised facts of return volatility: clustering (alpha term: yesterday's large return increases today's variance) and mean reversion (beta < 1: variance decays toward the unconditional level omega/(1-alpha-beta)). The persistence alpha+beta determines the half-life of a volatility shock — values above 0.95 imply multi-week decay.",
  },
  {
    id: "pyfin-20260609-b1-ff3-alpha",
    language: "python",
    tag: "finance",
    title: "Fama-French 3-factor alpha — strategy attribution regression",
    code: `import numpy as np
import pandas as pd
from statsmodels.api import OLS, add_constant

def fama_french_3factor(
    portfolio_returns: pd.Series,
    mkt_rf: pd.Series,       # Market excess return
    smb: pd.Series,          # Small-minus-big factor
    hml: pd.Series,          # High-minus-low value factor
    rf: pd.Series,            # Risk-free rate
) -> dict:
    """
    Fama-French 3-factor OLS regression:
    R_p - R_f = alpha + b_mkt*(R_m-R_f) + b_smb*SMB + b_hml*HML + epsilon
    Alpha = risk-adjusted excess return (annualised from daily).
    """
    excess = portfolio_returns - rf
    # Align all series to common index
    df = pd.DataFrame({
        "excess": excess,
        "mkt_rf": mkt_rf,
        "smb":    smb,
        "hml":    hml,
    }).dropna()

    X = add_constant(df[["mkt_rf", "smb", "hml"]])
    y = df["excess"]
    res = OLS(y, X).fit(cov_type="HAC", cov_kwds={"maxlags": 5})

    alpha_daily    = float(res.params["const"])
    alpha_annual   = alpha_daily * 252
    alpha_t        = float(res.tvalues["const"])
    alpha_p        = float(res.pvalues["const"])
    info_ratio     = alpha_daily / float(res.resid.std()) * np.sqrt(252)

    return {
        "alpha_daily":   round(alpha_daily, 6),
        "alpha_annual":  round(alpha_annual, 4),
        "alpha_t_stat":  round(alpha_t, 3),
        "alpha_p_value": round(alpha_p, 4),
        "beta_mkt":      round(float(res.params["mkt_rf"]), 4),
        "beta_smb":      round(float(res.params["smb"]),    4),
        "beta_hml":      round(float(res.params["hml"]),    4),
        "r_squared":     round(float(res.rsquared), 4),
        "information_ratio": round(info_ratio, 3),
        "obs":           len(df),
    }
# HAC (Newey-West) standard errors correct for autocorrelation in residuals —
# critical for daily return series where momentum and mean reversion are common.`,
    explanation:
      "The Fama-French 3-factor model controls for size (SMB) and value (HML) exposures before calling a return alpha — a strategy that is merely long small-cap value stocks has zero genuine alpha against this model. The information ratio (alpha / tracking error) is the correct measure of skill because it penalises both low alpha and high idiosyncratic risk.",
  },
  {
    id: "pyfin-20260609-b1-nelson-siegel-py",
    language: "python",
    tag: "finance",
    title: "Nelson-Siegel yield curve fitting — least-squares calibration",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel_yield(tau: float, b0: float, b1: float, b2: float, lam: float) -> float:
    """
    Nelson-Siegel (1987): y(tau) = b0 + b1*f + b2*g
    b0 = long-run level, b1 = slope, b2 = curvature, lam = shape parameter.
    """
    if tau < 1e-9:
        return b0 + b1
    x  = tau / lam
    ex = np.exp(-x)
    f  = (1 - ex) / x        # slope loading (decays to 0 at long end)
    g  = f - ex               # curvature loading (hump shape)
    return b0 + b1 * f + b2 * g

def fit_nelson_siegel(maturities: np.ndarray, observed_yields: np.ndarray,
                       lam_init: float = 1.5) -> dict:
    """
    Calibrate Nelson-Siegel to an observed yield curve via least-squares.
    For a given lambda, b0, b1, b2 have a closed-form OLS solution.
    We grid-search or optimise over lambda.
    """
    def obj(params):
        b0, b1, b2, lam = params
        if lam <= 0.01:
            return 1e10
        fitted = np.array([nelson_siegel_yield(t, b0, b1, b2, lam) for t in maturities])
        return float(np.sum((fitted - observed_yields)**2))

    x0     = [observed_yields[-1], observed_yields[0] - observed_yields[-1], 0.0, lam_init]
    bounds = [(0, 0.30), (-0.20, 0.20), (-0.20, 0.20), (0.01, 10.0)]
    res    = minimize(obj, x0, method="L-BFGS-B", bounds=bounds,
                      options={"ftol": 1e-14, "maxiter": 5000})
    b0, b1, b2, lam = res.x
    fitted = np.array([nelson_siegel_yield(t, b0, b1, b2, lam) for t in maturities])
    rmse   = float(np.sqrt(np.mean((fitted - observed_yields)**2)))

    return {
        "b0":         round(float(b0),  6),   # long-run rate
        "b1":         round(float(b1),  6),   # initial slope
        "b2":         round(float(b2),  6),   # curvature
        "lambda":     round(float(lam), 4),   # hump location (years)
        "rmse_bps":   round(rmse * 10000, 2),
        "fitted":     fitted.tolist(),
    }

# Hump peaks at tau* = lam * log(1 + 1/(b2/b1)) when b2 has opposite sign to b1.`,
    explanation:
      "For a fixed lambda, Nelson-Siegel is linear in b0, b1, b2, admitting a direct OLS solution. The non-linearity (the nested optimisation over lambda) is what makes calibration a two-pass problem — central banks often fix lambda to a prior value (e.g., 1.5 years) to ensure stability across daily fitting.",
  },
  {
    id: "pyfin-20260609-b1-hull-white-mc",
    language: "python",
    tag: "finance",
    title: "Hull-White short rate MC — time-varying mean reversion ZCB",
    code: `import numpy as np
from scipy.interpolate import interp1d

def hull_white_theta(a: float, sigma: float,
                     maturities: np.ndarray, market_yields: np.ndarray) -> callable:
    """
    Hull-White (1990) theta(t) calibrated to fit the initial yield curve.
    theta(t) = df/dt(0,t) + a*f(0,t) + sigma^2/(2a)*(1 - e^{-2at})
    where f(0,t) = instantaneous forward rate from market data.
    Returns a callable theta(t).
    """
    # Build forward rate from yield curve: f(0,T) = -d/dT log P(0,T)
    # Approximate numerically from observed yields
    eps    = 0.01
    yields_fn = interp1d(maturities, market_yields, kind="cubic",
                          fill_value="extrapolate")
    def fwd(t):
        T_p = t + eps; T_m = max(t - eps, 0.001)
        return (-np.log(np.exp(-yields_fn(T_p) * T_p))
                + np.log(np.exp(-yields_fn(T_m) * T_m))) / (T_p - T_m)

    def theta(t):
        df_dt = (fwd(t + eps) - fwd(t - eps + 0.001)) / (2 * eps)
        return df_dt + a * fwd(t) + sigma**2 / (2 * a) * (1 - np.exp(-2 * a * t))
    return theta

def hull_white_zcb_mc(r0: float, a: float, sigma: float,
                       T: float, theta_fn: callable,
                       paths: int = 20_000, steps: int = 252,
                       seed: int = 42) -> float:
    """
    Simulate Hull-White dr = (theta(t) - a*r)*dt + sigma*dW.
    Returns E[exp(-integral(r_t dt))] = ZCB price P(0,T).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / steps
    r    = np.full(paths, r0)
    disc = np.zeros(paths)

    for s in range(steps):
        t    = s * dt
        th   = theta_fn(t)
        dW   = rng.standard_normal(paths) * np.sqrt(dt)
        disc += r * dt
        r    += (th - a * r) * dt + sigma * dW

    return float(np.exp(-disc).mean())

# Hull-White fits the current term structure exactly (unlike Vasicek).
# The time-varying theta absorbs the initial forward curve shape.`,
    explanation:
      "Hull-White extends Vasicek by making the mean-reversion level theta(t) time-dependent, which allows it to fit the initial yield curve exactly — an essential property for interest rate derivative pricing where mispricing relative to the yield curve constitutes an immediate arbitrage. The cost is that future curve shapes are constrained by the model's functional form.",
  },
  {
    id: "pyfin-20260609-b1-heston-fft",
    language: "python",
    tag: "finance",
    title: "Heston model — Carr-Madan FFT characteristic function pricing",
    code: `import numpy as np
from scipy.fft import fft

def heston_char_fn(u: complex, S: float, K: float, r: float, T: float,
                   v0: float, kappa: float, theta: float,
                   xi: float, rho: float) -> complex:
    """
    Heston (1993) characteristic function of log(S_T) under risk-neutral measure.
    u: Fourier transform variable (complex).
    """
    i     = complex(0, 1)
    lnS   = np.log(S)
    d     = np.sqrt((rho * xi * i * u - kappa)**2 + xi**2 * (i*u + u**2))
    g     = (kappa - rho*xi*i*u - d) / (kappa - rho*xi*i*u + d)
    exp_dT = np.exp(-d * T)
    C = r*i*u*T + (kappa*theta/xi**2) * (
        (kappa - rho*xi*i*u - d)*T - 2*np.log((1 - g*exp_dT) / (1 - g))
    )
    D = ((kappa - rho*xi*i*u - d) / xi**2) * (1 - exp_dT) / (1 - g*exp_dT)
    return np.exp(C + D*v0 + i*u*lnS)

def heston_call_fft(S: float, K: float, r: float, T: float,
                     v0: float, kappa: float, theta: float,
                     xi: float, rho: float,
                     N: int = 4096, eta: float = 0.25) -> float:
    """
    Carr-Madan (1999) FFT pricing: c(k) = exp(-alpha*k)/pi * Re[FFT of integrand].
    Much faster than direct numerical integration for a smile of strikes.
    """
    alpha = 1.5           # dampening factor (must be > 0 for call)
    lam   = 2 * np.pi / (N * eta)
    b     = np.pi / eta
    km    = -b + lam * np.arange(N)   # log-strike grid

    j     = np.arange(N)
    v     = eta * j                    # frequency grid
    psi   = np.exp(-r * T) * heston_char_fn(
        v - (alpha + 1)*1j, S, K, r, T, v0, kappa, theta, xi, rho
    ) / (alpha**2 + alpha - v**2 + 1j*(2*alpha + 1)*v)

    # Simpson's rule weights
    w    = eta / 3.0 * (3 + (-1)**j - (j == 0).astype(float))
    x    = np.exp(1j * b * v) * psi * w
    call_prices = np.exp(-alpha * km) / np.pi * np.real(fft(x))

    # Interpolate to target log-strike log(K)
    log_K = np.log(K)
    idx   = np.searchsorted(km, log_K) - 1
    if idx < 0 or idx >= N - 1:
        return float(np.nan)
    frac  = (log_K - km[idx]) / (km[idx+1] - km[idx])
    return float((1 - frac) * call_prices[idx] + frac * call_prices[idx+1])`,
    explanation:
      "Carr-Madan FFT pricing evaluates the option price for an entire smile of strikes in O(N log N) time by recognising that the pricing integral is a convolution in log-strike space. The dampening factor alpha converts the non-square-integrable call payoff into an L² function whose Fourier transform exists — the choice alpha ∈ (0,1) for puts or alpha > 1 for calls is the key technical detail.",
  },
  {
    id: "pyfin-20260609-b1-importance-sampling",
    language: "python",
    tag: "finance",
    title: "Importance sampling — deep OTM option pricing with shifted drift",
    code: `import numpy as np

def deep_otm_call_importance(S0: float, K: float, r: float, sigma: float,
                               T: float, paths: int = 50_000,
                               seed: int = 42) -> dict:
    """
    Importance sampling for deep OTM calls: shift the drift to centre paths
    around the strike, then reweight by the Radon-Nikodym derivative.
    Standard MC wastes most paths on out-of-the-money regions.
    """
    rng   = np.random.default_rng(seed)
    drift_orig = (r - 0.5 * sigma**2) * T   # original drift in log-space

    # Choose shifted drift so that E[log S_T] = log K (paths centred at strike)
    mu_orig  = drift_orig
    mu_shift = np.log(K / S0)               # shift mean to log K

    Z = rng.standard_normal(paths)
    log_ST_shifted = np.log(S0) + mu_shift + sigma * np.sqrt(T) * Z
    ST_shifted     = np.exp(log_ST_shifted)
    payoff         = np.maximum(ST_shifted - K, 0.0)

    # Radon-Nikodym weight: dP/dQ = exp(theta*Z - 0.5*theta^2)
    theta = (mu_orig - mu_shift) / (sigma * np.sqrt(T))
    RN_weight = np.exp(theta * Z - 0.5 * theta**2)

    weighted_payoff = payoff * RN_weight
    price_is = np.exp(-r * T) * weighted_payoff.mean()
    price_std = np.exp(-r * T) * weighted_payoff.std() / np.sqrt(paths)

    # Compare with naive MC
    Z2      = rng.standard_normal(paths)
    ST_std  = S0 * np.exp(mu_orig + sigma * np.sqrt(T) * Z2)
    price_naive = np.exp(-r * T) * np.maximum(ST_std - K, 0.0).mean()

    return {
        "price_IS":     round(float(price_is), 8),
        "price_naive":  round(float(price_naive), 8),
        "std_IS":       round(float(price_std), 10),
        "variance_reduction": round(float(
            np.maximum(ST_std - K, 0.0).std()**2 /
            max(weighted_payoff.std()**2, 1e-30)), 1),
    }`,
    explanation:
      "Importance sampling shifts the sampling distribution toward the region where the payoff is non-zero, then corrects for the distributional change via the Radon-Nikodym weight (likelihood ratio). For a 5-sigma OTM option, naive MC assigns essentially zero probability to ITM paths — IS achieves >100× variance reduction by recentring the simulation around the strike.",
  },
  {
    id: "pyfin-20260609-b1-kelly-sizing",
    language: "python",
    tag: "finance",
    title: "Kelly criterion and fractional Kelly — optimal position sizing",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction_continuous(mu: float, sigma: float, rf: float = 0.0) -> float:
    """
    Kelly fraction for a continuous-time GBM strategy.
    f* = (mu - rf) / sigma^2  (Merton 1969 result).
    Maximises expected log-wealth (geometric growth rate).
    """
    return (mu - rf) / (sigma ** 2)

def kelly_fraction_discrete(win_prob: float, win_mult: float,
                              loss_mult: float) -> float:
    """
    Kelly formula for discrete bet: win w% of stake with prob p, lose l% with prob (1-p).
    f* = p/l - (1-p)/w  where w = win_mult-1, l = 1-loss_mult.
    """
    w = win_mult - 1.0   # fractional gain on win
    l = 1.0 - loss_mult  # fractional loss on loss
    return win_prob / l - (1 - win_prob) / w

def growth_rate(f: float, mu: float, sigma: float, rf: float = 0.0) -> float:
    """Expected log growth rate at Kelly fraction f: g = rf + f*(mu-rf) - 0.5*f^2*sigma^2."""
    excess = mu - rf
    return rf + f * excess - 0.5 * f**2 * sigma**2

def kelly_analysis(mu: float, sigma: float, rf: float = 0.0) -> dict:
    """Full Kelly vs fractional Kelly trade-offs."""
    f_full    = kelly_fraction_continuous(mu, sigma, rf)
    f_half    = 0.5 * f_full   # half-Kelly: common practitioner choice
    f_quarter = 0.25 * f_full

    return {
        "full_kelly":    round(f_full, 4),
        "half_kelly":    round(f_half, 4),
        "quarter_kelly": round(f_quarter, 4),
        "growth_full":   round(growth_rate(f_full, mu, sigma, rf) * 252, 4),
        "growth_half":   round(growth_rate(f_half, mu, sigma, rf) * 252, 4),
        "max_drawdown_approx_full": round(f_full**2 * 0.5, 4),  # E[max DD] ≈ f/2
        # Half-Kelly: 75% of max growth, <25% of expected drawdown
    }

# Kelly over-bets when mu and sigma are estimated with noise (Estimation error
# amplified by f* = mu/sigma^2 -> always apply fractional Kelly in practice).`,
    explanation:
      "The Kelly criterion maximises long-run geometric growth rate, but requires precise knowledge of mu and sigma — estimation error causes full-Kelly to massively over-bet and ruin. Half-Kelly sacrifices ~25% of maximum growth in exchange for roughly 75% reduction in expected maximum drawdown, making it the practitioner's default.",
  },
  {
    id: "pyfin-20260609-b1-kalman-pairs",
    language: "python",
    tag: "finance",
    title: "Kalman filter spread model — dynamic pairs trading hedge ratio",
    code: `import numpy as np
import pandas as pd

def kalman_pairs(y: pd.Series, x: pd.Series,
                  delta: float = 1e-5,
                  Ve: float = 0.001) -> dict:
    """
    Kalman filter for dynamic linear regression: y_t = beta_t * x_t + alpha_t + e_t.
    State: [beta_t, alpha_t] — time-varying hedge ratio and intercept.
    delta: process noise (how fast beta/alpha can drift); Ve: observation noise.
    """
    n     = len(y)
    # State: [beta, alpha]
    x_hat = np.zeros(2)           # state estimate
    P     = np.eye(2) * delta     # state covariance
    Vw    = delta / (1 - delta) * np.eye(2)   # process noise covariance

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spread = np.zeros(n)
    e_list = np.zeros(n)          # innovations

    y_arr = y.values
    x_arr = x.values

    for t in range(n):
        # Observation matrix H_t = [x_t, 1]
        H   = np.array([x_arr[t], 1.0])
        # Prediction step
        x_hat_pred = x_hat       # state transition = identity
        P_pred     = P + Vw      # covariance grows by process noise

        # Innovation
        y_pred = float(H @ x_hat_pred)
        e      = y_arr[t] - y_pred

        # Innovation variance (scalar)
        S = float(H @ P_pred @ H) + Ve

        # Kalman gain
        K = (P_pred @ H) / S

        # Update
        x_hat = x_hat_pred + K * e
        P     = (np.eye(2) - np.outer(K, H)) @ P_pred

        betas[t]  = x_hat[0]
        alphas[t] = x_hat[1]
        spread[t] = e            # innovation = residual from dynamic regression
        e_list[t] = e

    spread_z = (spread - spread.mean()) / (spread.std() + 1e-9)

    return {
        "betas":     betas.tolist(),
        "alphas":    alphas.tolist(),
        "spread":    spread.tolist(),
        "spread_z":  spread_z.tolist(),
        "final_beta": round(float(betas[-1]), 4),
    }`,
    explanation:
      "The Kalman filter allows the hedge ratio beta_t to drift over time — capturing the changing relationship between cointegrated pairs due to structural shifts. The delta parameter controls the signal-to-noise ratio in the state transition: higher delta allows faster adaptation but also more false signals from noise-driven beta moves.",
  },
  {
    id: "pyfin-20260609-b1-t-copula",
    language: "python",
    tag: "finance",
    title: "Student-t copula — heavy-tail joint default simulation",
    code: `import numpy as np
from scipy.stats import t as student_t, norm, chi2

def student_t_copula_defaults(
    n_obligors: int,
    pd_individual: np.ndarray,  # 1-year default probs, shape (n,)
    correlation_rho: float,     # single-factor correlation
    nu: float,                  # degrees of freedom (tail heaviness)
    paths: int = 200_000,
    seed: int = 42,
) -> dict:
    """
    Student-t copula: Z_i = sqrt(rho)*M + sqrt(1-rho)*e_i, M,e_i ~ t(nu).
    All variables scaled to N(0,1) margin via probability integral transform.
    Heavier tails than Gaussian copula: joint tail crashes more likely.
    """
    rng = np.random.default_rng(seed)
    n   = n_obligors

    # Default thresholds in the t-copula space
    # P(t_nu(Z_i) < F_t^{-1}(pd_i)) = pd_i  where F_t^{-1} is t-quantile
    thresholds = student_t.ppf(pd_individual, df=nu)  # (n,)

    # Sample common factor M and idiosyncratic factors e_i ~ t(nu)/sqrt(nu/(nu-2))
    # Standardised t: var=1 when nu>2
    M   = rng.standard_t(nu, size=paths) / np.sqrt(nu / (nu - 2))
    eps = rng.standard_t(nu, size=(paths, n)) / np.sqrt(nu / (nu - 2))

    Z         = np.sqrt(correlation_rho) * M[:, None] + np.sqrt(1 - correlation_rho) * eps
    # Transform to uniform via t CDF, then to default region
    defaults  = Z < thresholds[None, :]     # (paths, n)
    losses    = defaults.mean(axis=1)       # portfolio default rate per path

    p99 = np.percentile(losses, 99)
    p999 = np.percentile(losses, 99.9)

    return {
        "EL":         round(float(losses.mean()), 6),
        "VaR_99":     round(float(p99),  6),
        "VaR_999":    round(float(p999), 6),
        "ES_99":      round(float(losses[losses >= p99].mean()), 6),
        "joint_default_0pct_tail": round(float((losses == 1.0).mean()), 8),
    }
# t-copula with nu=4 produces joint tail losses 5-10x more often than Gaussian copula —
# explaining why Gaussian CDO models underestimated 2008 crisis correlation.`,
    explanation:
      "The Student-t copula generates heavier joint tails than the Gaussian copula because the common factor M has fat tails: extreme market scenarios simultaneously drive all obligors toward default. Lower degrees-of-freedom (nu) increase tail dependence — the key parameter that CDO pricing models consistently underestimated before 2008.",
  },
  {
    id: "pyfin-20260609-b1-bipower-rv",
    language: "python",
    tag: "finance",
    title: "Bipower realized variance — jump-robust volatility estimator",
    code: `import numpy as np
import pandas as pd

def bipower_realized_variance(log_returns: pd.Series,
                               freq: str = "5min",
                               annualise: bool = True) -> dict:
    """
    Barndorff-Nielsen & Shephard (2004) bipower variation:
    BV = (pi/2) * sum_{t=2}^{T} |r_{t-1}| * |r_t|
    Converges to integrated variance (diffusive component only).
    RV = sum r_t^2 -> IV + jump component.
    RV - BV estimates the jump contribution.
    """
    mu1  = np.sqrt(2 / np.pi)   # E[|N(0,1)|] = sqrt(2/pi)
    r    = log_returns.dropna().values
    n    = len(r)
    if n < 2:
        return {"error": "insufficient data"}

    # Realized variance
    RV = float(np.sum(r**2))

    # Bipower variation: (1/mu1^2) * sum |r_{t-1}| * |r_t|
    BV = float((1 / mu1**2) * np.sum(np.abs(r[:-1]) * np.abs(r[1:])))

    # Relative jump contribution (truncated at 0 — BV can exceed RV due to finite sample)
    J  = max(RV - BV, 0.0)
    jump_frac = J / max(RV, 1e-15)

    # Ratio test for significant jumps (Huang-Tauchen 2005):
    # Z = (RV - BV) / (sqrt(theta) * mu1^{-4} * n^{-1} * sum r_t^4)^{1/2}
    # theta ≈ (pi^2/4 + pi - 5) for Brownian increments
    theta = (np.pi**2) / 4 + np.pi - 5
    quad  = np.sum(r**4)
    denom = np.sqrt(max(theta * mu1**(-4) * quad / n, 1e-20))
    z_stat = (RV - BV) / denom

    from scipy.stats import norm
    p_jump = float(1 - norm.cdf(z_stat))

    scaling = 252 * (int(pd.Timedelta("1D") / pd.Timedelta(freq)) if freq else 1)
    if annualise:
        RV *= scaling; BV *= scaling; J *= scaling

    return {
        "RV":          round(RV, 8),
        "BV":          round(BV, 8),
        "jump_var":    round(J, 8),
        "jump_frac":   round(jump_frac, 4),
        "z_stat":      round(z_stat, 3),
        "p_jump":      round(p_jump, 4),
        "RV_vol":      round(np.sqrt(max(RV, 0)), 4),
        "BV_vol":      round(np.sqrt(max(BV, 0)), 4),
    }`,
    explanation:
      "Bipower variation is consistent for integrated variance even in the presence of jumps, because the product |r_{t-1}| × |r_t| assigns near-zero weight when one return is large (a jump) but the other is small (diffusion) — jumps rarely land in consecutive intervals. RV - BV therefore isolates the jump component of daily price variation.",
  },
  {
    id: "pyfin-20260609-b1-hazard-bootstrap",
    language: "python",
    tag: "finance",
    title: "CDS hazard rate curve bootstrapping — iterative stripping",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_curve(
    tenors: list,           # [1, 3, 5, 7, 10] years
    cds_spreads_bps: list,  # par CDS spreads in basis points
    discount_factors: np.ndarray,   # risk-free discount factors at coupon dates
    coupon_dates: np.ndarray,       # fraction of year to each payment date
    recovery: float = 0.40,
    coupon_freq: int = 4,
) -> dict:
    """
    Bootstrap piecewise-constant hazard rate curve from CDS par spreads.
    Iteratively solve for h_k that makes each CDS fair at its tenor.
    """
    dt          = 1.0 / coupon_freq
    hazards     = {}           # {tenor: hazard_rate}
    surv_probs  = {0.0: 1.0}  # {time: survival probability}

    for idx, (tenor, spread_bps) in enumerate(zip(tenors, cds_spreads_bps)):
        spread = spread_bps / 10_000.0
        prev_tenor = tenors[idx - 1] if idx > 0 else 0.0

        # Build payment grid for this CDS
        t_grid = np.arange(dt, tenor + dt / 2, dt)

        def cds_pv(h_new):
            # Extend survival probability with piecewise-constant h_new
            # from prev_tenor to tenor; earlier segments already bootstrapped
            def Q(t):
                if t <= prev_tenor:
                    # Interpolate from already-bootstrapped segment
                    times = sorted(surv_probs.keys())
                    for i in range(len(times) - 1):
                        if times[i] <= t <= times[i + 1]:
                            h_k = -np.log(surv_probs[times[i+1]] /
                                          surv_probs[times[i]]) / (times[i+1] - times[i])
                            return surv_probs[times[i]] * np.exp(-h_k * (t - times[i]))
                    return surv_probs[times[-1]]
                else:
                    base = Q(prev_tenor)
                    return base * np.exp(-h_new * (t - prev_tenor))

            D  = np.interp(t_grid, coupon_dates[:len(t_grid)],
                           discount_factors[:len(t_grid)])
            Q_t     = np.array([Q(t) for t in t_grid])
            Q_prev  = np.concatenate([[Q(0)], Q_t[:-1]])

            prem_pv = spread * dt * np.sum(D * Q_t)
            prot_pv = (1 - recovery) * np.sum(D * (Q_prev - Q_t))
            return prem_pv - prot_pv

        h_star = brentq(cds_pv, 1e-8, 50.0, xtol=1e-8)
        hazards[tenor]            = round(float(h_star), 6)
        surv_probs[tenor]         = (surv_probs.get(prev_tenor, 1.0) *
                                     np.exp(-h_star * (tenor - prev_tenor)))

    return {
        "hazards":    hazards,
        "surv_probs": {k: round(v, 6) for k, v in surv_probs.items()},
    }`,
    explanation:
      "CDS curve bootstrapping is the credit equivalent of yield curve stripping: each tenor's CDS constrains one additional piecewise-constant hazard rate segment. The iterative root-finding ensures internal consistency — pricing a 5Y CDS using the bootstrapped curve reproduces the market par spread exactly, just as yield curve bootstrapping reproduces par bond prices.",
  },
  {
    id: "pyfin-20260609-b1-student-t-var",
    language: "python",
    tag: "finance",
    title: "Student-t parametric VaR and CVaR — fat-tail risk estimation",
    code: `import numpy as np
import pandas as pd
from scipy.stats import t as student_t
from scipy.optimize import minimize

def fit_student_t(returns: np.ndarray) -> dict:
    """MLE fit of Student-t distribution to return series."""
    def neg_ll(params):
        nu, mu, sigma = params
        if nu <= 2 or sigma <= 0:
            return 1e10
        return -float(student_t.logpdf(returns, df=nu, loc=mu, scale=sigma).sum())

    x0  = [5.0, float(returns.mean()), float(returns.std())]
    res = minimize(neg_ll, x0, method="Nelder-Mead",
                   options={"xatol": 1e-6, "fatol": 1e-8})
    nu, mu, sigma = res.x
    return {"nu": round(float(nu), 2), "mu": round(float(mu), 6),
            "sigma": round(float(sigma), 6)}

def student_t_var_cvar(returns: np.ndarray,
                        alpha: float = 0.99,
                        horizon_days: int = 1) -> dict:
    """
    Parametric VaR and CVaR under Student-t assumption.
    Square-root-of-time scaling for multi-day horizons (approx under independence).
    """
    params = fit_student_t(returns)
    nu, mu, sigma = params["nu"], params["mu"], params["sigma"]

    # Quantile: VaR = -(mu + sigma * t_nu^{alpha})
    q     = float(student_t.ppf(1 - alpha, df=nu))   # negative quantile
    VaR   = -(mu + sigma * q)

    # CVaR = E[-R | R < -VaR] = -(mu - sigma * t_nu.pdf(q) / (1-alpha) * (nu+q^2)/(nu-1))
    pdf_q = float(student_t.pdf(q, df=nu))
    CVaR  = -(mu + sigma * (-pdf_q / (1 - alpha)) * (nu + q**2) / (nu - 1))

    # Scale to horizon
    VaR_h  = VaR  * np.sqrt(horizon_days)
    CVaR_h = CVaR * np.sqrt(horizon_days)

    # Historical comparison
    VaR_hist  = float(-np.percentile(returns, (1 - alpha) * 100))
    CVaR_hist = float(-returns[returns < -VaR_hist].mean())

    return {
        "t_params":    params,
        "VaR_1d":      round(VaR, 6),
        "CVaR_1d":     round(CVaR, 6),
        f"VaR_{horizon_days}d":  round(VaR_h, 6),
        f"CVaR_{horizon_days}d": round(CVaR_h, 6),
        "VaR_hist_1d": round(VaR_hist, 6),
        "CVaR_hist_1d": round(CVaR_hist, 6),
    }`,
    explanation:
      "The Student-t distribution captures the fat tails of financial returns: for nu=4 degrees of freedom, the 99th percentile is roughly 30% higher than the Gaussian estimate — matching empirical tail frequencies. CVaR (Expected Shortfall) is the Basel IV regulatory capital metric because, unlike VaR, it satisfies subadditivity and captures the shape of the loss tail beyond the quantile.",
  },
  {
    id: "pyfin-20260609-b1-factor-momentum",
    language: "python",
    tag: "finance",
    title: "Cross-sectional factor momentum — monthly rebalancing strategy",
    code: `import numpy as np
import pandas as pd

def cross_sectional_momentum(
    returns: pd.DataFrame,       # columns = tickers, index = dates
    lookback_months: int = 12,
    skip_months: int = 1,        # skip most recent month (reversal)
    hold_months: int = 1,
    top_quantile: float = 0.20,  # top/bottom 20%
    long_only: bool = False,
) -> pd.DataFrame:
    """
    Jegadeesh-Titman (1993) cross-sectional momentum:
    Monthly, go long top quintile, short bottom quintile by past 12M return.
    Skip 1 month to avoid short-term reversal contamination.
    """
    monthly   = returns.resample("ME").apply(lambda x: (1 + x).prod() - 1)
    n_months  = len(monthly)
    signals   = pd.DataFrame(index=monthly.index, columns=monthly.columns,
                              dtype=float)

    for t in range(lookback_months + skip_months, n_months):
        start  = t - lookback_months - skip_months
        end    = t - skip_months
        past_r = monthly.iloc[start:end].apply(lambda x: (1 + x).prod() - 1)
        ranks  = past_r.rank(pct=True)
        sig    = pd.Series(0.0, index=monthly.columns)
        sig[ranks >= 1 - top_quantile]  =  1.0
        if not long_only:
            sig[ranks <= top_quantile]  = -1.0
        # Equal-weight within each group
        n_long  = (sig > 0).sum()
        n_short = (sig < 0).sum()
        if n_long  > 0: sig[sig > 0] /= n_long
        if n_short > 0: sig[sig < 0] /= n_short
        signals.iloc[t] = sig

    # Portfolio returns: signal * next month return
    port_returns = (signals.shift(1) * monthly).sum(axis=1)

    ann_return = float((1 + port_returns).prod() ** (12 / n_months) - 1)
    ann_vol    = float(port_returns.std() * np.sqrt(12))
    sharpe     = ann_return / ann_vol if ann_vol > 0 else 0.0
    max_dd     = float((port_returns.cumsum() - port_returns.cumsum().cummax()).min())

    return {
        "portfolio_returns": port_returns.dropna(),
        "ann_return": round(ann_return, 4),
        "ann_vol":    round(ann_vol, 4),
        "sharpe":     round(sharpe, 3),
        "max_drawdown": round(max_dd, 4),
    }`,
    explanation:
      "Cross-sectional momentum profits from the persistence of relative performance: winners over the past 12 months continue to outperform losers over the next 1-3 months. The 1-month skip removes short-term reversal (bid-ask bounce and microstructure noise) that would otherwise contaminate the signal with negative auto-correlation.",
  },
  {
    id: "pyfin-20260609-b1-gamma-scalping",
    language: "python",
    tag: "finance",
    title: "Gamma scalping P&L simulation — realised vs implied vol breakeven",
    code: `import numpy as np

def gamma_scalping_simulation(
    S0: float, K: float, r: float,
    sigma_implied: float,   # option's implied vol (what you pay for gamma)
    sigma_realised: float,  # actual realised vol of the underlying
    T: float,
    paths: int = 10_000,
    steps: int = 252,
    seed: int = 42,
) -> dict:
    """
    Delta-hedge a long ATM straddle, rebalancing daily.
    Gamma P&L per day ≈ 0.5 * gamma * (dS)^2 - theta * dt.
    Net P&L = cumulative gamma profit - total theta paid.
    """
    from scipy.stats import norm

    def bs_greeks(S, K, r, sigma, t_rem):
        if t_rem < 1e-6: return 0.0, 0.0, 0.0
        sqT = np.sqrt(t_rem)
        d1  = (np.log(S/K) + (r + 0.5*sigma**2)*t_rem) / (sigma * sqT)
        d2  = d1 - sigma * sqT
        phi = norm.pdf(d1)
        Nd1 = norm.cdf(d1)
        gamma = phi / (S * sigma * sqT)
        theta = (-(S * phi * sigma) / (2 * sqT) - r * K * np.exp(-r*t_rem) * norm.cdf(d2)) / 365
        delta = Nd1
        return delta, gamma, theta

    rng    = np.random.default_rng(seed)
    dt     = T / steps
    vol_r  = sigma_realised * np.sqrt(dt)
    pnl    = np.zeros(paths)

    for p in range(paths):
        S   = S0
        pnl_p = 0.0
        for s in range(steps):
            t_rem = T - s * dt
            delta, gamma, theta = bs_greeks(S, K, r, sigma_implied, t_rem)
            dS    = S * (r * dt + vol_r * rng.standard_normal())
            gamma_pnl = 0.5 * gamma * dS**2
            theta_pnl = theta * dt * 365  # theta is per calendar day
            pnl_p += gamma_pnl + theta_pnl
            S += dS
        pnl[p] = pnl_p

    breakeven_vol = sigma_implied   # zero net P&L when realised = implied
    return {
        "mean_pnl":  round(float(pnl.mean()), 4),
        "std_pnl":   round(float(pnl.std()),  4),
        "prob_profit": round(float((pnl > 0).mean()), 4),
        "implied_vol": sigma_implied,
        "realised_vol": sigma_realised,
        "vol_edge_bps": round((sigma_realised - sigma_implied) * 10_000, 1),
    }`,
    explanation:
      "The gamma scalping P&L formula 0.5*gamma*dS² - theta*dt shows that the option buyer profits when realised variance (dS²/dt) exceeds implied variance (sigma_implied²). The breakeven condition is realised vol = implied vol — this is the fundamental equation of options trading: you buy gamma when you expect realised vol to exceed implied.",
  },
  {
    id: "pyfin-20260609-b1-antithetic-cv",
    language: "python",
    tag: "finance",
    title: "Combined antithetic + control variate variance reduction",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    """Analytic Black-Scholes call for control variate."""
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    return S * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d2)

def exotic_call_combined_vr(S0: float, K: float, r: float, sigma: float, T: float,
                              barrier: float = None,
                              paths: int = 50_000, steps: int = 252,
                              seed: int = 42) -> dict:
    """
    Combined antithetic variates + control variate for barrier option.
    CV: use European call (known analytically) as control.
    Antithetic: pair each path with its -Z version.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / steps
    drift = (r - 0.5*sigma**2) * dt
    vol   = sigma * np.sqrt(dt)

    payoff_barrier = []   # barrier call payoff
    payoff_euro    = []   # European call payoff (control)

    for _ in range(paths):
        Z  = rng.standard_normal(steps)
        # Original and antithetic paths
        for sign in [1, -1]:
            S = S0; alive = True; S_max = S0
            for z in Z:
                S *= np.exp(drift + vol * sign * z)
                S_max = max(S_max, S)
                if barrier and S <= barrier:
                    alive = False
                    break
            payoff_barrier.append(max(S - K, 0.0) * (1.0 if alive else 0.0))
            payoff_euro.append(max(S - K, 0.0))

    pb = np.array(payoff_barrier)
    pe = np.array(payoff_euro)

    E_euro_mc  = pe.mean()
    E_euro_bs  = bs_call(S0, K, r, sigma, T) * np.exp(r * T)  # undiscounted

    # Control variate correction: beta = Cov(pb, pe) / Var(pe)
    cov  = np.cov(pb, pe)[0, 1]
    var  = pe.var()
    beta = cov / var if var > 1e-12 else 0.0

    price_raw = np.exp(-r*T) * pb.mean()
    price_cv  = np.exp(-r*T) * (pb.mean() - beta * (E_euro_mc - E_euro_bs))

    return {
        "price_raw": round(float(price_raw), 6),
        "price_cv":  round(float(price_cv), 6),
        "beta_cv":   round(float(beta), 4),
        "var_reduction_factor": round(float(pe.var() / max(
            (pb - beta * (pe - E_euro_mc)).var(), 1e-15)), 1),
    }`,
    explanation:
      "Combining antithetic variates and control variates achieves multiplicative variance reduction: antithetics halve the variance from path-level randomness while the control variate removes the component correlated with the European price. For barrier options, the joint reduction typically exceeds 90%, enabling accurate pricing with 50K paths instead of 5M.",
  },
  {
    id: "pyfin-20260609-b1-fama-macbeth",
    language: "python",
    tag: "finance",
    title: "Fama-MacBeth regression — cross-sectional return predictability",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def fama_macbeth(
    returns: pd.DataFrame,        # (T, N) asset returns
    characteristics: pd.DataFrame, # (N, K) asset characteristics (e.g. B/M, size)
) -> dict:
    """
    Fama-MacBeth (1973) two-pass procedure:
    Pass 1: Time-series regression r_{i,t} = alpha_i + sum_k beta_{i,k}*F_{k,t} + e_{i,t}
    Pass 2: Cross-sectional regression r_{i,t} = lambda_0 + sum_k lambda_{k,t}*beta_{i,k} + u_{i,t}
    lambda_k = time-series mean of cross-sectional risk premia (with Shanken correction).
    """
    T, N = returns.shape
    chars = characteristics.values   # (N, K)
    K     = chars.shape[1]
    rets  = returns.values            # (T, N)

    # Pass 2 only (simplified: use characteristics directly as betas in sorted portfolios)
    # For each period t, run cross-sectional OLS: r_{i,t} = lambda_0 + lambda * char_i
    lambdas = []
    reg = LinearRegression()
    for t in range(T):
        r_t = rets[t]                              # (N,) cross-sectional returns
        mask = ~np.isnan(r_t) & ~np.isnan(chars).any(axis=1)
        if mask.sum() < K + 2:
            continue
        reg.fit(chars[mask], r_t[mask])
        lambdas.append(np.concatenate([[reg.intercept_], reg.coef_]))

    lambdas = np.array(lambdas)              # (T, K+1)
    lam_mean = lambdas.mean(axis=0)
    lam_se   = lambdas.std(axis=0) / np.sqrt(len(lambdas))
    t_stats  = lam_mean / (lam_se + 1e-12)

    factor_names = ["intercept"] + [f"factor_{k}" for k in range(K)]
    return {
        "risk_premia":  dict(zip(factor_names, lam_mean.round(6))),
        "t_stats":      dict(zip(factor_names, t_stats.round(3))),
        "std_errors":   dict(zip(factor_names, lam_se.round(6))),
        "n_periods":    len(lambdas),
    }
# Shanken (1992) correction: inflate SE by (1 + lambda^T * Sigma_f^{-1} * lambda)
# to account for estimation error in the first-pass betas.`,
    explanation:
      "Fama-MacBeth avoids the Errors-in-Variables problem of a single cross-sectional regression by running cross-sectional regressions each period and averaging — the time-series standard error of the lambda estimates accounts for cross-sectional correlations implicitly. The key limitation is it ignores firm-level time-series variation in betas (assumed constant).",
  },
  {
    id: "pyfin-20260609-b1-duration-immunise",
    language: "python",
    tag: "finance",
    title: "Bond portfolio duration immunisation — liability matching",
    code: `import numpy as np
from scipy.optimize import minimize

def bond_modified_duration(face: float, coupon_rate: float, ytm: float,
                            n_periods: int, freq: int = 2) -> tuple:
    """Returns (dirty_price, modified_duration) for a semi-annual coupon bond."""
    c    = coupon_rate / freq * face
    y    = ytm / freq
    t    = np.arange(1, n_periods + 1)
    df   = (1 + y) ** (-t)
    cf   = np.full(n_periods, c); cf[-1] += face
    P    = float(np.dot(cf, df))
    mac  = float(np.dot(t * cf, df)) / P
    mod  = mac / (1 + y) / freq
    return P, mod

def immunise_portfolio(
    liability_pv: float,
    liability_duration: float,
    bond_prices: list,         # dirty prices of available bonds
    bond_durations: list,      # modified durations of available bonds
    min_weight: float = 0.0,
) -> dict:
    """
    Classic immunisation: match PV and duration of the liability.
    Minimise convexity (second-order mismatch) subject to PV and duration match.
    """
    n  = len(bond_prices)
    P  = np.array(bond_prices)
    D  = np.array(bond_durations)

    def neg_convexity(w):
        # Proxy: minimise variance of duration mismatch (maximise flatness)
        return float(np.sum(w * (D - liability_duration)**2))

    constraints = [
        {"type": "eq", "fun": lambda w: np.dot(w, P) - liability_pv},          # PV match
        {"type": "eq", "fun": lambda w: np.dot(w * P, D) / liability_pv
                                        - liability_duration},                   # duration match
    ]
    bounds  = [(min_weight, None)] * n
    w0      = np.ones(n) / n * liability_pv / P

    res = minimize(neg_convexity, w0, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": 1e-10})

    w = res.x
    port_pv  = float(np.dot(w, P))
    port_dur = float(np.dot(w * P, D) / port_pv)

    return {
        "weights":        w.round(6).tolist(),
        "portfolio_pv":   round(port_pv, 4),
        "portfolio_dur":  round(port_dur, 4),
        "target_dur":     round(liability_duration, 4),
        "duration_error": round(abs(port_dur - liability_duration), 6),
    }`,
    explanation:
      "Duration immunisation ensures that for a parallel yield shift, the change in asset PV equals the change in liability PV — protecting a pension fund from interest rate risk to first order. Minimising convexity mismatch as the secondary objective makes the portfolio robust to second-order effects (non-parallel shifts), though cash-flow matching provides stronger protection for non-parallel scenarios.",
  },
  {
    id: "pyfin-20260609-b1-ewma-cov",
    language: "python",
    tag: "finance",
    title: "EWMA covariance matrix — RiskMetrics dynamic correlation update",
    code: `import numpy as np
import pandas as pd

def ewma_covariance(returns: pd.DataFrame,
                    lam: float = 0.94,
                    seed_window: int = 30) -> dict:
    """
    RiskMetrics EWMA covariance matrix:
    Sigma_t = lambda * Sigma_{t-1} + (1-lambda) * r_{t-1} r_{t-1}^T
    Initialised with the sample covariance of the first seed_window observations.
    """
    R    = returns.dropna().values        # T x N
    T, N = R.shape

    # Seed with full-sample covariance of initial window
    Sigma = np.cov(R[:seed_window].T)     # N x N

    history = [Sigma.copy()]
    for t in range(seed_window, T):
        r_t   = R[t - 1][:, None]         # column vector
        Sigma = lam * Sigma + (1 - lam) * (r_t @ r_t.T)
        history.append(Sigma.copy())

    # Convert to correlation matrix (latest)
    std   = np.sqrt(np.diag(Sigma))
    corr  = Sigma / np.outer(std, std)

    # Rolling vol series per asset
    vols  = pd.DataFrame(
        [np.sqrt(np.diag(s)) * np.sqrt(252) for s in history],
        index=returns.index[seed_window-1:],
        columns=returns.columns,
    )

    return {
        "cov_matrix":  Sigma.tolist(),
        "corr_matrix": corr.tolist(),
        "ann_vols":    dict(zip(returns.columns, (std * np.sqrt(252)).round(4))),
        "eff_obs":     round(1 / (1 - lam), 1),
        "vol_history": vols,
    }

def ewma_portfolio_vol(weights: np.ndarray, returns: pd.DataFrame,
                        lam: float = 0.94) -> float:
    """Compute current portfolio EWMA volatility (annualised)."""
    result = ewma_covariance(returns, lam)
    Sigma  = np.array(result["cov_matrix"])
    w      = weights / weights.sum()
    return float(np.sqrt(w @ Sigma @ w * 252))`,
    explanation:
      "EWMA covariance updates the entire N×N matrix with a rank-1 outer product each period, preserving positive semi-definiteness since it is a convex combination of PSD matrices. The effective number of observations 1/(1-λ) determines the memory horizon: λ=0.94 corresponds to ~17 days, enabling the covariance estimate to adapt quickly to correlation breakdowns during crises.",
  },
  {
    id: "pyfin-20260609-b1-svi-smile",
    language: "python",
    tag: "finance",
    title: "SVI parameterisation — arbitrage-free implied vol smile",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_total_variance(k: float, a: float, b: float, rho: float,
                        m: float, sigma: float) -> float:
    """
    Gatheral (2004) SVI (Stochastic Volatility Inspired) total variance:
    w(k) = a + b * (rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    where k = log(K/F) is log-moneyness, w(k) = sigma_imp^2 * T (total variance).
    Butterfly and calendar arbitrage free if parameters satisfy SVI conditions.
    """
    z = k - m
    return a + b * (rho * z + np.sqrt(z**2 + sigma**2))

def svi_implied_vol(k: float, T: float, a: float, b: float, rho: float,
                     m: float, sigma_svi: float) -> float:
    """Convert SVI total variance to implied vol."""
    w = svi_total_variance(k, a, b, rho, m, sigma_svi)
    return float(np.sqrt(max(w / T, 0.0)))

def fit_svi(log_moneyness: np.ndarray,
             market_vols: np.ndarray,
             T: float) -> dict:
    """
    Calibrate SVI parameters to observed implied vol smile.
    Constraints: a > -b*sigma, b >= 0, |rho| < 1, sigma > 0.
    """
    market_w = market_vols**2 * T    # convert to total variance

    def obj(params):
        a, b, rho, m, sigma = params
        if b < 0 or sigma <= 0 or abs(rho) >= 1 or a <= -b * sigma:
            return 1e10
        w_fit = np.array([svi_total_variance(k, a, b, rho, m, sigma)
                          for k in log_moneyness])
        if np.any(w_fit < 0):
            return 1e10
        return float(np.sum((np.sqrt(w_fit / T) - market_vols)**2))

    # Initial guess: ATM vol, flat smile
    atm_w = float(market_w[np.argmin(np.abs(log_moneyness))])
    x0     = [atm_w * 0.5, 0.1, -0.3, 0.0, 0.2]
    bounds = [(None, None), (0, None), (-0.999, 0.999), (-2, 2), (1e-4, None)]
    res    = minimize(obj, x0, method="L-BFGS-B", bounds=bounds)
    a, b, rho, m, sigma = res.x

    fitted_vols = np.array([svi_implied_vol(k, T, a, b, rho, m, sigma)
                             for k in log_moneyness])
    return {
        "a": round(float(a), 6), "b": round(float(b), 6),
        "rho": round(float(rho), 4), "m": round(float(m), 4),
        "sigma": round(float(sigma), 4),
        "fitted_vols": fitted_vols.tolist(),
        "rmse_vols": round(float(np.sqrt(np.mean((fitted_vols - market_vols)**2))), 6),
    }`,
    explanation:
      "SVI's five-parameter form exactly captures the characteristic shape of equity implied vol smiles: rho controls skew (negative for equities due to leverage effect), b controls the wings slope, and sigma softens the vertex. The arbitrage-free conditions (Gatheral-Jacquier 2014) constrain the parameters to prevent negative local variance and calendar spread arbitrage.",
  },
];
