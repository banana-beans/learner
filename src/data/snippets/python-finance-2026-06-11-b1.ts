import type { Snippet } from "./types";

export const pythonFinanceSnippets20260611B1: Snippet[] = [
  {
    id: "pyfin-20260611-b1-heston-mc",
    language: "python",
    tag: "finance",
    title: "Heston stochastic vol MC — Euler-Maruyama with full truncation",
    code: `import numpy as np

def heston_mc_call(S0: float, K: float, r: float,
                   v0: float, kappa: float, theta: float,
                   xi: float, rho: float, T: float,
                   n_paths: int = 200_000, n_steps: int = 252,
                   seed: int = 42) -> dict:
    """
    Heston (1993) stochastic vol MC via Euler-Maruyama.
    dS = r*S dt + sqrt(v)*S dW_S
    dv = kappa*(theta-v) dt + xi*sqrt(v) dW_v,  corr(dW_S, dW_v) = rho
    Full truncation: use max(v, 0) in diffusion to avoid sqrt(negative).
    Milstein correction for v reduces strong-order bias.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    sqdt = np.sqrt(dt)
    disc = np.exp(-r * T)

    # Cholesky: W_v = rho*Z1 + sqrt(1-rho^2)*Z2
    rho2 = np.sqrt(1.0 - rho**2)

    S = np.full(n_paths, S0, dtype=np.float64)
    v = np.full(n_paths, v0, dtype=np.float64)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rng.standard_normal(n_paths)
        Wv = rho * Z1 + rho2 * Z2

        v_pos = np.maximum(v, 0.0)   # full truncation
        sq_v  = np.sqrt(v_pos)

        # Milstein correction for variance: +0.25*xi^2*(Wv^2 - 1)*dt
        dv = (kappa * (theta - v_pos) * dt
              + xi * sq_v * sqdt * Wv
              + 0.25 * xi**2 * dt * (Wv**2 - 1.0))
        v  = v_pos + dv

        S  *= np.exp((r - 0.5 * v_pos) * dt + sq_v * sqdt * Z1)

    payoffs = np.maximum(S - K, 0.0)
    price   = disc * payoffs.mean()
    se      = disc * payoffs.std(ddof=1) / np.sqrt(n_paths)

    return {
        "price":    round(float(price), 6),
        "se":       round(float(se),    6),
        "ci_95":    (round(float(price - 1.96*se), 6), round(float(price + 1.96*se), 6)),
        "feller":   bool(2 * kappa * theta > xi**2),
    }`,
    explanation:
      "The Feller condition (2κθ > ξ²) ensures the CIR variance process stays strictly positive — when it fails, full truncation (clipping v at 0) prevents complex arithmetic while introducing a slight upward bias in the drift. The Milstein correction adds the ¼ξ²(W²−1)dt term that exactly cancels the leading-order bias of the Euler scheme for the square-root diffusion, matching the strong convergence rate of 1.0 versus 0.5 for plain Euler.",
  },
  {
    id: "pyfin-20260611-b1-nss-fitting",
    language: "python",
    tag: "finance",
    title: "Nelson-Siegel-Svensson fitting — 6-parameter yield curve calibration",
    code: `import numpy as np
from scipy.optimize import minimize

def nss_yield(T: float, b0: float, b1: float, b2: float, b3: float,
              tau1: float, tau2: float) -> float:
    """
    Svensson (1994) extension of Nelson-Siegel: adds a second hump term.
    y(T) = b0 + b1*f(T/tau1) + b2*g(T/tau1) + b3*g(T/tau2)
    where f(x) = (1-e^{-x})/x, g(x) = f(x) - e^{-x}.
    6 parameters: b0=long-run level, b1=slope, b2/b3=humps, tau1/tau2=time constants.
    """
    if T < 1e-7:
        return b0 + b1

    def loading(x):
        if abs(x) < 1e-7:
            return 1.0, 0.0
        ex  = np.exp(-x)
        fx  = (1.0 - ex) / x
        gx  = fx - ex
        return fx, gx

    x1   = T / tau1
    x2   = T / tau2
    f1, g1 = loading(x1)
    f2, g2 = loading(x2)

    return b0 + b1*f1 + b2*g1 + b3*g2

def fit_nss(tenors: np.ndarray, yields: np.ndarray) -> dict:
    """
    Fit NSS parameters by minimising sum of squared yield errors.
    Initial guess: b0=long end, b1=short - long, b2=b3=0, tau1=1, tau2=4.
    """
    b0_init = float(yields[-1])
    b1_init = float(yields[0] - yields[-1])

    def obj(params):
        b0, b1, b2, b3, tau1, tau2 = params
        if tau1 <= 0.01 or tau2 <= 0.01 or tau1 == tau2:
            return 1e10
        fitted = np.array([nss_yield(T, b0, b1, b2, b3, tau1, tau2) for T in tenors])
        return float(np.sum((fitted - yields)**2))

    x0 = [b0_init, b1_init, 0.0, 0.0, 1.5, 4.0]
    bounds = [(0.0, 0.20), (-0.20, 0.20), (-0.20, 0.20),
              (-0.20, 0.20), (0.01, 10.0), (0.01, 10.0)]

    res = minimize(obj, x0, method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-12, "gtol": 1e-9})
    b0, b1, b2, b3, tau1, tau2 = res.x
    fitted = np.array([nss_yield(T, b0, b1, b2, b3, tau1, tau2) for T in tenors])

    return {
        "b0": round(b0, 6), "b1": round(b1, 6),
        "b2": round(b2, 6), "b3": round(b3, 6),
        "tau1": round(tau1, 4), "tau2": round(tau2, 4),
        "rmse_bps": round(float(np.sqrt(np.mean((fitted - yields)**2))) * 10000, 2),
        "fitted":   fitted.round(6).tolist(),
    }`,
    explanation:
      "Svensson extended Nelson-Siegel with a second hump term (b3, tau2) to handle yield curves with two inflection points — common in markets with distorted mid-curve pricing (e.g. from quantitative easing). The ECB and many central banks use NSS for official yield curve publication; the additional parameters reduce RMSE from ~5 bps (NS) to ~1 bps (NSS) for complex shapes.",
  },
  {
    id: "pyfin-20260611-b1-hazard-bootstrap",
    language: "python",
    tag: "finance",
    title: "CDS hazard rate bootstrap — piecewise-constant hazard from market spreads",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(
    cds_spreads_bps: dict,     # {tenor: spread_bps}, e.g. {1: 50, 3: 80, 5: 120}
    disc_factors: dict,         # {tenor: discount_factor}, e.g. {0.5: 0.99, 1: 0.98, ...}
    recovery: float = 0.40,
    coupon_freq: int = 4,
) -> dict:
    """
    Bootstrap piecewise-constant hazard rates from par CDS spreads.
    For each tenor T_n, solve for h_n such that:
    spread * RPV01(h_1..h_n) = protection_pv(h_1..h_n)
    where earlier hazard rates h_1..h_{n-1} are already calibrated.
    """
    tenors  = sorted(cds_spreads_bps.keys())
    hazards = {}       # {tenor: h}  calibrated so far
    dt      = 1.0 / coupon_freq

    def compute_legs(h_new: float, target_tenor: float) -> tuple:
        """Compute (rpv01, prot_pv) for a CDS up to target_tenor."""
        t_grid = np.arange(dt, target_tenor + dt/2, dt)
        rpv01  = 0.0
        prot   = 0.0
        Q_prev = 1.0
        t_prev = 0.0

        for t in t_grid:
            # Find which hazard segment
            h = h_new   # default to the current segment's rate
            for seg_t in sorted(hazards.keys()):
                if t <= seg_t + dt / 2:
                    h = hazards[seg_t]
                    break

            Q = Q_prev * np.exp(-h * (t - t_prev))
            D = disc_factors.get(t, np.exp(-0.03 * t))   # fallback flat 3%

            rpv01 += dt * D * Q
            prot  += (1 - recovery) * D * (Q_prev - Q)
            Q_prev = Q
            t_prev = t

        return rpv01, prot

    result = {}
    for tenor in tenors:
        spread = cds_spreads_bps[tenor] / 10_000.0   # bps -> decimal

        def obj(h):
            rpv01, prot = compute_legs(h, tenor)
            return prot - spread * rpv01

        # Hazard rate range: 1bp to 100%
        h_cal = brentq(obj, 1e-4, 10.0, xtol=1e-8)
        hazards[tenor] = h_cal
        result[tenor]  = round(float(h_cal), 6)

    return result`,
    explanation:
      "Hazard rate bootstrapping is the CDS equivalent of bootstrapping a risk-free discount curve from swap rates: each CDS quote adds one equation that pins down the marginal hazard rate in its time bucket, with previously calibrated rates held fixed. The piecewise-constant hazard h(t) means the survival probability between calibration dates follows Q(t) = exp(-h×Δt), which has a closed-form expression that avoids integration.",
  },
  {
    id: "pyfin-20260611-b1-fama-french",
    language: "python",
    tag: "finance",
    title: "Fama-French 3-factor regression — alpha, beta, SMB, HML exposure",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def fama_french_3factor(
    portfolio_returns: pd.Series,    # daily or monthly excess returns
    ff3_factors: pd.DataFrame,       # columns: Mkt-RF, SMB, HML, RF
    annualise_factor: float = 252,   # 252 for daily, 12 for monthly
) -> dict:
    """
    Estimate Fama-French 3-factor model:
    R_p - RF = alpha + beta*(Mkt-RF) + s*SMB + h*HML + epsilon
    SMB = Small Minus Big (size premium)
    HML = High Minus Low (value premium)
    Alpha: annualised risk-adjusted excess return vs FF3 risk factors.
    """
    # Align indices
    data = pd.DataFrame({"port": portfolio_returns}).join(ff3_factors, how="inner")
    data = data.dropna()

    # Excess portfolio return
    y = data["port"] - data["RF"]
    X = sm.add_constant(data[["Mkt-RF", "SMB", "HML"]])

    result = sm.OLS(y, X).fit(cov_type="HAC", cov_kwds={"maxlags": 5})

    alpha_daily    = result.params["const"]
    beta           = result.params["Mkt-RF"]
    smb_loading    = result.params["SMB"]
    hml_loading    = result.params["HML"]

    # Annualise alpha and compute t-statistic
    alpha_ann = alpha_daily * annualise_factor
    t_alpha   = result.tvalues["const"]
    p_alpha   = result.pvalues["const"]

    # Information ratio: alpha / tracking error
    residuals     = result.resid
    tracking_err  = float(residuals.std() * np.sqrt(annualise_factor))
    ir            = alpha_ann / tracking_err if tracking_err > 0 else 0.0

    return {
        "alpha_ann":    round(float(alpha_ann), 6),
        "alpha_t_stat": round(float(t_alpha), 3),
        "alpha_p_val":  round(float(p_alpha), 4),
        "beta":         round(float(beta), 4),
        "smb_loading":  round(float(smb_loading), 4),
        "hml_loading":  round(float(hml_loading), 4),
        "r_squared":    round(float(result.rsquared), 4),
        "tracking_err": round(float(tracking_err), 4),
        "info_ratio":   round(float(ir), 3),
        "n_obs":        int(len(y)),
    }`,
    explanation:
      "The Fama-French 3-factor model separates returns attributable to market exposure (beta), small-cap tilt (SMB loading s), and value tilt (HML loading h) — alpha is only what remains after controlling for these three systematic risks. HAC (Newey-West) standard errors correct for autocorrelation in the residuals, which is critical for monthly factor data where momentum creates serial dependence in returns.",
  },
  {
    id: "pyfin-20260611-b1-kalman-pairs",
    language: "python",
    tag: "finance",
    title: "Kalman filter pairs — dynamic hedge ratio and spread estimation",
    code: `import numpy as np
import pandas as pd

def kalman_pairs_filter(
    y: np.ndarray,          # log price of asset Y (dependent)
    x: np.ndarray,          # log price of asset X (independent)
    delta: float = 1e-5,    # state noise variance (controls adaptation speed)
    R: float = 1e-3,        # observation noise variance
) -> dict:
    """
    Kalman filter for time-varying beta in pairs trading: y_t = beta_t * x_t + alpha_t + eps.
    State vector: [beta, alpha].
    State equation:  theta_t = theta_{t-1} + w_t,  w_t ~ N(0, Q)
    Observation:     y_t = H_t * theta_t + eps_t,   eps_t ~ N(0, R)
    Q = delta/(1-delta) * I  (random walk state noise).
    """
    n     = len(y)
    # State: [beta, alpha]; observation matrix H_t = [x_t, 1]
    theta = np.zeros(2)                     # initial state [beta=0, alpha=0]
    P     = np.eye(2)                       # initial state covariance
    Q     = delta / (1.0 - delta) * np.eye(2)  # state noise covariance

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spreads = np.zeros(n)
    e_vars  = np.zeros(n)   # innovation variance (for signal normalisation)

    for t in range(n):
        H = np.array([x[t], 1.0])

        # Predict
        # (state equation is random walk: no F matrix needed, P += Q)
        P_pred = P + Q

        # Innovation
        y_hat   = H @ theta
        innov   = y[t] - y_hat
        S       = H @ P_pred @ H + R    # innovation variance
        K_gain  = P_pred @ H / S        # Kalman gain vector

        # Update
        theta  = theta + K_gain * innov
        P      = (np.eye(2) - np.outer(K_gain, H)) @ P_pred

        betas[t]   = theta[0]
        alphas[t]  = theta[1]
        spreads[t] = innov           # one-step-ahead prediction error = spread signal
        e_vars[t]  = S

    z_spread = spreads / np.sqrt(np.maximum(e_vars, 1e-12))   # standardised signal

    return {
        "betas":     betas,
        "alphas":    alphas,
        "spreads":   spreads,
        "z_spread":  z_spread,
        "final_beta":  round(float(betas[-1]), 4),
        "final_alpha": round(float(alphas[-1]), 6),
    }`,
    explanation:
      "The Kalman filter estimates the time-varying hedge ratio beta_t as a random-walk state variable: a small delta (1e-5) makes beta nearly constant, while a large delta (1e-3) allows it to adapt quickly. The innovation (y_t - H_t theta_{t-1}) serves as the pairs trading spread signal because it represents the portion of Y's movement unexplained by the current hedge ratio — a large positive innovation means Y is rich relative to X.",
  },
  {
    id: "pyfin-20260611-b1-garch-mle",
    language: "python",
    tag: "finance",
    title: "GARCH(1,1) MLE — volatility clustering and persistence estimation",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_mle(returns: np.ndarray, annualise: bool = True) -> dict:
    """
    GARCH(1,1): sigma_t^2 = omega + alpha*r_{t-1}^2 + beta*sigma_{t-1}^2.
    Stationarity: alpha + beta < 1.
    Long-run vol: sqrt(omega / (1 - alpha - beta)).
    MLE via negative log-likelihood under Gaussian innovations.
    """
    r = np.asarray(returns, dtype=np.float64)
    n = len(r)

    def neg_log_likelihood(params):
        omega, alpha, beta = params
        # Parameter constraints
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1.0:
            return 1e10
        sigma2 = np.empty(n)
        sigma2[0] = np.var(r, ddof=1)    # initialise at sample variance

        for t in range(1, n):
            sigma2[t] = omega + alpha * r[t-1]**2 + beta * sigma2[t-1]

        # Gaussian log-likelihood: -0.5 * sum(log(2pi) + log(sigma2) + r^2/sigma2)
        ll = -0.5 * np.sum(np.log(sigma2) + r**2 / sigma2)
        return -float(ll)   # minimise negative LL

    # Initial guess from method of moments
    var_r  = float(np.var(r, ddof=1))
    x0     = [var_r * 0.05, 0.10, 0.85]   # omega, alpha, beta
    bounds = [(1e-8, None), (1e-6, 0.999), (1e-6, 0.999)]

    res = minimize(neg_log_likelihood, x0, method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-10, "gtol": 1e-8})
    omega, alpha, beta = res.x

    persistence   = alpha + beta
    long_run_var  = omega / (1.0 - persistence) if persistence < 1 else var_r
    long_run_vol  = float(np.sqrt(long_run_var))
    half_life_days = np.log(0.5) / np.log(persistence) if 0 < persistence < 1 else np.inf

    factor = np.sqrt(252 if annualise else 1)
    return {
        "omega":            round(float(omega), 8),
        "alpha":            round(float(alpha), 6),
        "beta":             round(float(beta), 6),
        "persistence":      round(float(persistence), 6),
        "long_run_vol_ann": round(float(long_run_vol * factor), 4),
        "half_life_days":   round(float(half_life_days), 1),
        "aic":              round(float(2*3 + 2*res.fun), 2),   # 3 parameters
    }`,
    explanation:
      "The persistence parameter alpha+beta measures how quickly volatility mean-reverts: for equity indices it is typically 0.97-0.99, implying a half-life of 22-69 trading days. The GARCH log-likelihood is an autoregressive state-space model — each observation's variance depends on the previous residual squared, which is why the likelihood must be computed sequentially rather than vectorised.",
  },
  {
    id: "pyfin-20260611-b1-kelly-sizing",
    language: "python",
    tag: "finance",
    title: "Kelly criterion sizing — full Kelly, fractional Kelly, multi-asset",
    code: `import numpy as np
from scipy.optimize import minimize

def kelly_single(mu: float, sigma: float, rf: float = 0.0) -> dict:
    """
    Kelly fraction for a single asset with normal returns.
    f* = (mu - rf) / sigma^2  (continuous-time Kelly).
    Edge = mu - rf; Variance = sigma^2.
    Full Kelly maximises log-wealth growth but can draw down 50%+.
    Half-Kelly (fractional Kelly) is commonly used in practice.
    """
    edge         = mu - rf
    f_full       = edge / sigma**2 if sigma > 0 else 0.0
    g_full       = rf + f_full * edge - 0.5 * f_full**2 * sigma**2  # growth rate
    g_half_kelly = rf + 0.5*f_full*edge - 0.5*(0.5*f_full)**2*sigma**2

    return {
        "full_kelly":     round(float(f_full), 4),
        "half_kelly":     round(float(0.5 * f_full), 4),
        "quarter_kelly":  round(float(0.25 * f_full), 4),
        "growth_rate_full": round(float(g_full), 6),
        "growth_rate_half": round(float(g_half_kelly), 6),
        "max_drawdown_approx": round(float(0.5 / f_full if f_full > 0 else np.inf), 4),
    }

def kelly_multi(mu: np.ndarray, Sigma: np.ndarray, rf: float = 0.0,
                fractional: float = 0.5) -> dict:
    """
    Multi-asset Kelly: maximise E[log(1 + w^T r)] over weights w.
    Analytical solution: w* = Sigma^{-1} * (mu - rf).
    Scales linearly: fractional Kelly = fractional * w*.
    Subject to no-leverage constraint via normalisation.
    """
    N     = len(mu)
    excess = mu - rf

    try:
        w_full = np.linalg.solve(Sigma, excess)   # Sigma^{-1} * (mu - rf)
    except np.linalg.LinAlgError:
        w_full = np.zeros(N)

    w_frac  = fractional * w_full
    port_mu  = float(mu @ w_frac)
    port_var = float(w_frac @ Sigma @ w_frac)
    growth   = rf + port_mu - 0.5 * port_var

    return {
        "kelly_weights":    w_full.round(4).tolist(),
        "fractional_weights": w_frac.round(4).tolist(),
        "fractional":       fractional,
        "portfolio_mu":     round(port_mu, 6),
        "portfolio_vol":    round(float(np.sqrt(port_var)), 6),
        "growth_rate":      round(float(growth), 6),
    }`,
    explanation:
      "The continuous-time Kelly fraction f* = (μ-r)/σ² is the leverage that maximises the long-run growth rate of a log-normal portfolio — it is the mean-variance efficient portfolio scaled to unit risk exposure. In practice, fractional Kelly (typically 0.25-0.5) is preferred because full Kelly maximises asymptotic growth but produces extreme drawdowns (50% drawdown in the worst case before recovery) and is highly sensitive to estimation error in μ.",
  },
  {
    id: "pyfin-20260611-b1-impl-shortfall",
    language: "python",
    tag: "finance",
    title: "Implementation shortfall — arrival price vs executed price decomposition",
    code: `import numpy as np
import pandas as pd

def implementation_shortfall(
    trades: pd.DataFrame,      # columns: timestamp, shares, exec_price, side (1=buy,-1=sell)
    arrival_price: float,      # mid price at decision time
    market_returns: pd.Series, # contemporaneous market returns during execution
    notional: float = 1.0,
) -> dict:
    """
    Perold (1988) implementation shortfall = paper portfolio return - actual return.
    IS = delay cost + market impact + timing cost + commission.
    Measured relative to arrival mid-price.
    side: +1=buy (higher exec price = worse), -1=sell (lower exec price = worse).
    """
    trades  = trades.copy()
    side    = int(np.sign(trades["side"].iloc[0]))  # +1 buy, -1 sell

    # VWAP
    total_shares = float(trades["shares"].sum())
    vwap         = float((trades["shares"] * trades["exec_price"]).sum() / total_shares)

    # Slippage vs arrival price
    slippage_bps = side * (vwap - arrival_price) / arrival_price * 10_000

    # Market-adjusted impact: remove broad market move from measured slippage
    mkt_ret      = float(market_returns.sum()) if len(market_returns) > 0 else 0.0
    mkt_adj_slip = slippage_bps - side * mkt_ret * 10_000  # market noise removed

    # Participation rate (assume market volume data available)
    # Here we compute participation as a fraction of notional
    trade_notional = total_shares * arrival_price

    # Almgren-Chriss permanent impact estimate: gamma * total_shares / ADV
    # (no ADV data here; report as relative slippage only)
    total_is_bps = slippage_bps
    total_is_usd = total_is_bps / 10_000 * trade_notional

    # Timing cost: price drift from first to last execution relative to arrival
    first_px = float(trades["exec_price"].iloc[0])
    last_px  = float(trades["exec_price"].iloc[-1])
    timing_bps = side * (last_px - first_px) / arrival_price * 10_000

    return {
        "arrival_price":     round(float(arrival_price), 4),
        "vwap":              round(float(vwap), 4),
        "slippage_bps":      round(float(slippage_bps), 2),
        "mkt_adj_slippage":  round(float(mkt_adj_slip), 2),
        "timing_cost_bps":   round(float(timing_bps), 2),
        "is_usd":            round(float(total_is_usd), 2),
        "total_shares":      float(total_shares),
        "trade_notional":    round(float(trade_notional), 2),
    }`,
    explanation:
      "Implementation shortfall separates execution quality into components: the market-adjusted slippage isolates the trading desk's contribution by removing the systematic market move (which the desk cannot control), and the timing cost measures the price drift caused by spreading execution over time. A tight spread between market-adjusted slippage and timing cost indicates efficient execution with minimal unnecessary footprint.",
  },
  {
    id: "pyfin-20260611-b1-johansen-coint",
    language: "python",
    tag: "finance",
    title: "Johansen cointegration test — trace statistic and cointegration rank",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.vector_ar.vecm import coint_johansen

def johansen_cointegration(prices: pd.DataFrame,
                            det_order: int = 0,   # -1=no constant, 0=restricted constant, 1=unrestricted
                            k_ar_diff: int = 1) -> dict:
    """
    Johansen (1988) cointegration test for n time series.
    Null H0(r): at most r cointegrating vectors.
    Trace stat > critical value -> reject H0(r), at least r+1 cointegrating vectors.
    Useful for finding stable long-run relationships between correlated assets.
    """
    data = prices.dropna()
    result = coint_johansen(data, det_order, k_ar_diff)

    n = data.shape[1]
    # Trace statistics and 95% critical values
    trace_stats = result.lr1       # trace statistic for H0(r=0,1,...,n-1)
    trace_cvs   = result.cvt[:, 1] # 95% critical values

    # Determine cointegration rank (number of cointegrating vectors)
    rank = 0
    for i in range(n):
        if trace_stats[i] > trace_cvs[i]:
            rank += 1
        else:
            break

    # Cointegrating vectors (columns of result.evec)
    coint_vectors = result.evec[:, :rank] if rank > 0 else np.array([])

    # First cointegrating vector: normalise to first asset = 1
    spread = None
    if rank > 0:
        v        = result.evec[:, 0]
        v_norm   = v / v[0]
        spread   = pd.Series(data.values @ v_norm, index=data.index)

    return {
        "rank":             rank,
        "trace_stats":      trace_stats.round(4).tolist(),
        "trace_cvs_95":     trace_cvs.round(4).tolist(),
        "coint_vectors":    coint_vectors.round(4).tolist() if rank > 0 else [],
        "spread":           spread,
        "eigenvalues":      result.eig[:rank].round(4).tolist() if rank > 0 else [],
        "n_series":         n,
    }`,
    explanation:
      "Johansen tests for cointegration via reduced-rank regression of a VECM, estimating the rank r of the long-run impact matrix Pi — r > 0 means there are r stable linear combinations of the price series that are stationary (the cointegrating vectors). Unlike Engle-Granger, Johansen handles multiple cointegrating relationships simultaneously, which matters for baskets of stocks where multiple pairs may be cointegrated independently.",
  },
  {
    id: "pyfin-20260611-b1-gpd-evt",
    language: "python",
    tag: "finance",
    title: "GPD extreme value tail fitting — Pareto tail for VaR/CVaR beyond sample",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(returns: np.ndarray,
                 threshold_quantile: float = 0.05,
                 min_exceedances: int = 50) -> dict:
    """
    Peaks Over Threshold (POT) method with Generalised Pareto Distribution.
    Fit GPD to exceedances |r| > u for the left tail (losses).
    GPD: F(x) = 1 - (1 + xi*x/sigma)^{-1/xi}
    xi > 0: heavy tail (Frechet); xi = 0: exponential; xi < 0: bounded tail.
    """
    losses = -returns[returns < 0]   # convert to positive losses
    losses = np.sort(losses)[::-1]   # descending

    # Choose threshold u as quantile of observed losses
    u = np.quantile(losses, 1.0 - threshold_quantile)
    exceedances = losses[losses > u] - u   # excess over threshold

    if len(exceedances) < min_exceedances:
        raise ValueError(f"Too few exceedances ({len(exceedances)}): lower threshold")

    # MLE fit of GPD (scipy uses loc=0 for POT)
    xi, loc, sigma = genpareto.fit(exceedances, floc=0)

    n_total = len(returns)
    n_above = len(exceedances)
    prob_u  = n_above / n_total      # empirical P(loss > u)

    def gpd_var(alpha: float) -> float:
        """VaR at confidence level alpha via GPD extrapolation."""
        # P(L > VaR) = (1-alpha)
        # P(L > x) = P(L > u) * (1 + xi*(x-u)/sigma)^{-1/xi}
        p = (1.0 - alpha) / prob_u
        if xi == 0:
            return u - sigma * np.log(p)
        return u + sigma / xi * (p**(-xi) - 1.0)

    def gpd_cvar(alpha: float) -> float:
        """CVaR via closed-form GPD formula."""
        var = gpd_var(alpha)
        if xi >= 1.0:
            return np.inf
        return (var + sigma - xi * u) / (1.0 - xi)

    var_99   = gpd_var(0.99)
    var_999  = gpd_var(0.999)
    cvar_99  = gpd_cvar(0.99)

    return {
        "xi":          round(float(xi), 4),
        "sigma":       round(float(sigma), 6),
        "threshold_u": round(float(u), 6),
        "n_exceedances": int(n_above),
        "prob_exceed": round(float(prob_u), 4),
        "VaR_99":      round(float(var_99), 6),
        "VaR_99.9":    round(float(var_999), 6),
        "CVaR_99":     round(float(cvar_99), 6),
        "heavy_tail":  bool(xi > 0),
    }`,
    explanation:
      "The Peaks Over Threshold approach fits a GPD to the exceedances above a threshold u, concentrating all observations where the data is most extreme — this is more efficient than block-maxima methods. The shape parameter xi determines tail heaviness: for equity returns xi ≈ 0.2-0.4 (heavy Pareto tail), which causes VaR and CVaR to grow faster than the normal model predicts, explaining why normal-based VaR systematically underestimates extreme losses.",
  },
  {
    id: "pyfin-20260611-b1-hull-white-mc",
    language: "python",
    tag: "finance",
    title: "Hull-White short-rate MC — time-varying theta fitted to initial curve",
    code: `import numpy as np
from scipy.interpolate import interp1d

def hull_white_mc(
    r0: float,
    a: float,             # mean reversion speed
    sigma: float,         # short rate volatility
    market_zcb: dict,     # {tenor: price} market zero coupon bond prices
    T_horizon: float,
    n_paths: int = 50_000,
    n_steps: int = 252,
    seed: int = 42,
) -> dict:
    """
    Hull-White (1990): dr = (theta(t) - a*r) dt + sigma * dW
    theta(t) calibrated to exactly fit the initial term structure.
    Exact formula: theta(t) = dF(0,t)/dt + a*F(0,t) + sigma^2/(2a)*(1-e^{-2at})
    where F(0,t) = instantaneous forward rate at time t.
    """
    rng = np.random.default_rng(seed)

    # Extract instantaneous forward rates from ZCB prices via -d/dt log P(0,t)
    tenors = sorted(market_zcb.keys())
    prices = [market_zcb[t] for t in tenors]
    yields = [-np.log(p)/t for t, p in zip(tenors, prices)]

    # Interpolate yield curve for forward rate
    y_interp = interp1d(tenors, yields, kind="cubic", fill_value="extrapolate")

    def forward_rate(t, eps=0.001):
        """Instantaneous forward rate f(0,t) = -d/dt log P(0,t)"""
        return (y_interp(t) + t * (y_interp(t + eps) - y_interp(t - eps)) / (2 * eps))

    def theta(t):
        """Hull-White theta(t): time-dependent drift for term structure fit."""
        f  = forward_rate(t)
        df = (forward_rate(t + 0.001) - forward_rate(t - 0.001)) / 0.002
        return df + a * f + sigma**2 / (2*a) * (1.0 - np.exp(-2*a*t))

    dt   = T_horizon / n_steps
    sqdt = np.sqrt(dt)
    r    = np.full(n_paths, r0)
    bank = np.ones(n_paths)   # money market account: exp(int r dt)

    t = 0.0
    for _ in range(n_steps):
        t    += dt
        th    = theta(t)
        dW    = rng.standard_normal(n_paths)
        dr    = (th - a * r) * dt + sigma * sqdt * dW
        r    += dr
        bank *= np.exp(r * dt)

    # ZCB price P(0, T_horizon) = E[1/bank_T] (risk-neutral MC)
    zcb_mc = float(np.mean(1.0 / bank))

    return {
        "zcb_mc":        round(float(zcb_mc), 6),
        "zcb_market":    round(float(market_zcb.get(T_horizon, np.nan)), 6),
        "mean_short_rate": round(float(r.mean()), 6),
        "std_short_rate":  round(float(r.std()), 6),
        "min_short_rate":  round(float(r.min()), 6),
    }`,
    explanation:
      "Hull-White extends Vasicek by making the drift theta(t) time-dependent, allowing exact calibration to any initial yield curve — the Vasicek model with constant theta can only match one point on the curve. The theta(t) formula involves the derivative of the forward rate curve, which must be computed numerically; this is why a smooth interpolation of the initial term structure is essential for accurate calibration.",
  },
  {
    id: "pyfin-20260611-b1-ljung-box",
    language: "python",
    tag: "finance",
    title: "Ljung-Box test — autocorrelation significance for alpha signal validation",
    code: `import numpy as np
import pandas as pd
from scipy import stats

def ljung_box_alpha_test(
    returns_or_signal: pd.Series,
    max_lags: int = 20,
    alpha_level: float = 0.05,
) -> dict:
    """
    Ljung-Box Q-test for serial autocorrelation.
    H0: no autocorrelation up to lag h.
    Q(h) = n*(n+2) * sum_{k=1}^{h} rho_k^2 / (n-k) ~ chi2(h) under H0.
    Use on: strategy returns (test for alpha persistence),
            GARCH residuals (check model adequacy),
            trading signals (test for mean reversion vs momentum).
    """
    r = returns_or_signal.dropna().values
    n = len(r)

    acfs   = []   # autocorrelation at each lag
    q_stats = []
    p_vals  = []

    for h in range(1, max_lags + 1):
        # Sample autocorrelation at lag h
        rho_h = float(np.corrcoef(r[h:], r[:-h])[0, 1])
        acfs.append(rho_h)

        # Ljung-Box Q statistic up to lag h
        q = float(n * (n + 2) * sum(
            ac**2 / (n - k)
            for k, ac in enumerate(acfs, start=1)
        ))
        p = float(1.0 - stats.chi2.cdf(q, df=h))
        q_stats.append(q)
        p_vals.append(p)

    # Significant lags: reject H0 at alpha_level
    sig_lags = [k+1 for k, p in enumerate(p_vals) if p < alpha_level]

    # First significant lag (momentum if lag 1, mean-reversion if negative rho_1)
    pattern = "none"
    if acfs[0] > 0.02 and p_vals[0] < alpha_level:
        pattern = "momentum"
    elif acfs[0] < -0.02 and p_vals[0] < alpha_level:
        pattern = "mean-reversion"

    return {
        "acf":              [round(a, 4) for a in acfs],
        "q_stats":          [round(q, 2) for q in q_stats],
        "p_values":         [round(p, 4) for p in p_vals],
        "significant_lags": sig_lags,
        "pattern":          pattern,
        "n_obs":            n,
        "reject_whitenoise": bool(any(p < alpha_level for p in p_vals)),
    }`,
    explanation:
      "The Ljung-Box Q statistic tests whether the first h autocorrelations are jointly zero — rejecting the null on raw returns indicates momentum (positive ACF) or mean-reversion (negative ACF) that a strategy could exploit. Applying it to squared returns tests for ARCH effects (volatility clustering); applying it to GARCH model residuals checks whether the model has adequately captured the volatility dynamics.",
  },
  {
    id: "pyfin-20260611-b1-vix-replication",
    language: "python",
    tag: "finance",
    title: "VIX replication — model-free implied variance from options strip",
    code: `import numpy as np

def vix_replication(
    call_strikes: np.ndarray,   # OTM call strikes, K > F
    call_prices: np.ndarray,    # undiscounted call prices
    put_strikes: np.ndarray,    # OTM put strikes, K < F
    put_prices: np.ndarray,     # undiscounted put prices
    F: float,                   # forward price
    r: float,                   # risk-free rate
    T: float,                   # expiry in years
) -> dict:
    """
    CBOE VIX methodology (2003): model-free implied variance.
    sigma^2 = (2/T) * [sum_i (dK_i/K_i^2) * e^{rT} * Q(K_i)] - (1/T)*(F/K_0 - 1)^2
    Q(K) = put price for K < F, call price for K >= F.
    dK = spacing between consecutive strikes.
    """
    disc   = np.exp(-r * T)

    # Combine put and call strips; K_0 = first strike below forward
    all_K   = np.concatenate([put_strikes, call_strikes])
    all_Q   = np.concatenate([put_prices,  call_prices ])
    order   = np.argsort(all_K)
    strikes = all_K[order]
    prices  = all_Q[order]

    # Compute delta-K weights: trapezoidal spacing
    dK = np.zeros(len(strikes))
    dK[1:-1] = (strikes[2:] - strikes[:-2]) / 2.0
    dK[0]    =  strikes[1]  - strikes[0]
    dK[-1]   =  strikes[-1] - strikes[-2]

    # VIX sum: (dK/K^2) * e^{rT} * Q  (undiscounted prices already provided)
    contrib     = dK / (strikes**2) * np.exp(r * T) * prices
    sigma2_raw  = (2.0 / T) * contrib.sum()

    # Adjustment for F not being exactly at a strike grid point
    K0_idx  = np.searchsorted(strikes, F) - 1
    K0_idx  = max(0, min(K0_idx, len(strikes)-1))
    K0      = strikes[K0_idx]
    adj     = (1.0 / T) * (F / K0 - 1.0)**2

    sigma2  = sigma2_raw - adj
    vix_pct = 100.0 * np.sqrt(max(sigma2, 0.0))

    return {
        "vix_pct":       round(float(vix_pct), 2),
        "sigma2_annual": round(float(sigma2), 6),
        "n_strikes":     len(strikes),
        "K_range":       (round(float(strikes[0]), 2), round(float(strikes[-1]), 2)),
        "forward":       round(float(F), 4),
    }`,
    explanation:
      "The VIX is model-free — it does not assume Black-Scholes or any other distribution. The formula integrates the entire OTM options strip weighted by 1/K², which places more weight on out-of-the-money strikes. This weighting emerges from the log-contract replication identity: the variance of log returns can be replicated by a portfolio of options with weights 1/K², connecting implied variance directly to option prices without specifying the underlying dynamics.",
  },
  {
    id: "pyfin-20260611-b1-barrier-mc-py",
    language: "python",
    tag: "finance",
    title: "Barrier option MC — down-and-out call with Brownian bridge correction",
    code: `import numpy as np

def down_out_call_mc(
    S0: float, K: float, H: float,   # H < S0: down-and-out barrier
    r: float, sigma: float, T: float,
    n_paths: int = 200_000,
    n_steps: int = 252,
    seed: int = 42,
    use_bridge: bool = True,
) -> dict:
    """
    Down-and-out call: zero payoff if S ever touches H (from above).
    Brownian bridge correction (BGK 1997): given S_t = a > H and S_{t+dt} = b > H,
    probability of touching H in (t, t+dt) = exp(-2 * ln(a/H) * ln(b/H) / (sigma^2*dt)).
    Removes the discrete-monitoring bias from discrete MC.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    drift = (r - 0.5 * sigma**2) * dt
    vol   = sigma * np.sqrt(dt)
    disc  = np.exp(-r * T)

    payoffs = np.zeros(n_paths)
    u_draw  = rng.random((n_paths, n_steps)) if use_bridge else None

    for i in range(n_paths):
        S       = S0
        knocked = False

        for t in range(n_steps):
            S_prev = S
            Z      = rng.standard_normal()
            S      = S_prev * np.exp(drift + vol * Z)

            if S <= H:
                knocked = True
                break

            if use_bridge and S_prev > H:
                la = np.log(S_prev / H)
                lb = np.log(S / H)
                if la > 0 and lb > 0:
                    p_cross = np.exp(-2.0 * la * lb / (sigma**2 * dt))
                    if u_draw[i, t] < p_cross:
                        knocked = True
                        break

        if not knocked:
            payoffs[i] = max(S - K, 0.0)

    price = disc * payoffs.mean()
    se    = disc * payoffs.std(ddof=1) / np.sqrt(n_paths)
    frac_knocked = float(np.mean(payoffs == 0))

    return {
        "price":          round(float(price), 6),
        "se":             round(float(se), 6),
        "frac_knocked":   round(float(frac_knocked), 4),
        "n_paths":        n_paths,
        "bridge_used":    use_bridge,
    }`,
    explanation:
      "Without the Brownian bridge correction, discrete monitoring systematically underestimates the knockout probability because it only checks the barrier at discrete time points, missing intra-period crossings. The BGK correction adds the conditional probability of touching the barrier between two monitored points, converging to the continuous barrier price at O(1/N) versus O(1/√N) for plain discrete monitoring.",
  },
  {
    id: "pyfin-20260611-b1-asian-mc-cv",
    language: "python",
    tag: "finance",
    title: "Asian option MC — geometric average control variate",
    code: `import numpy as np
from scipy.stats import norm

def asian_arith_call_cv(
    S0: float, K: float, r: float, sigma: float, T: float,
    n_steps: int = 252,
    n_paths: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    Asian arithmetic call with geometric average as control variate.
    Geometric average Asian has a closed-form price (Kemna-Vorst 1990).
    Reduction: if geometric and arithmetic prices are correlated (they are),
    estimator = arith_price + beta*(geom_closed_form - geom_MC) has lower variance.
    beta_opt = Cov(arith, geom) / Var(geom).
    """
    rng   = np.random.default_rng(seed)
    dt    = T / n_steps
    drift = (r - 0.5 * sigma**2) * dt
    vol   = sigma * np.sqrt(dt)
    disc  = np.exp(-r * T)

    # Closed-form for geometric average Asian call (Kemna-Vorst 1990)
    sigma_g = sigma * np.sqrt((2*n_steps + 1) / (6*(n_steps + 1)))
    b       = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    d1g     = (np.log(S0/K) + (b + 0.5*sigma_g**2)*T) / (sigma_g * np.sqrt(T))
    d2g     = d1g - sigma_g * np.sqrt(T)
    geom_cf = disc * (S0 * np.exp(b*T) * norm.cdf(d1g) - K * norm.cdf(d2g))

    # MC: simulate both arithmetic and geometric average payoffs
    payoff_arith = np.zeros(n_paths)
    payoff_geom  = np.zeros(n_paths)

    for i in range(n_paths):
        log_S = np.log(S0) + np.cumsum(drift + vol * rng.standard_normal(n_steps))
        S_path = np.exp(log_S)
        payoff_arith[i] = max(S_path.mean() - K, 0.0)
        payoff_geom[i]  = max(np.exp(np.log(S_path).mean()) - K, 0.0)

    # Control variate estimator
    beta = np.cov(payoff_arith, payoff_geom)[0, 1] / np.var(payoff_geom, ddof=1)
    cv_payoffs = payoff_arith - beta * (payoff_geom - geom_cf / disc)
    price = disc * cv_payoffs.mean()
    se    = disc * cv_payoffs.std(ddof=1) / np.sqrt(n_paths)

    plain_se = disc * payoff_arith.std(ddof=1) / np.sqrt(n_paths)
    var_reduction = (plain_se / se)**2 if se > 0 else np.inf

    return {
        "price_cv":        round(float(price), 6),
        "se_cv":           round(float(se), 6),
        "geom_closed":     round(float(geom_cf), 6),
        "var_reduction":   round(float(var_reduction), 2),
        "beta_cv":         round(float(beta), 4),
    }`,
    explanation:
      "The geometric average Asian option serves as an almost-perfect control variate for the arithmetic version because their payoffs are highly correlated (both measure the path average) and the geometric case has a closed-form price under log-normal dynamics. The optimal beta coefficient captures the regression slope between the two estimators, and typical variance reductions are 90-99% — reducing standard error by 3-10× versus plain Monte Carlo.",
  },
  {
    id: "pyfin-20260611-b1-gaussian-copula",
    language: "python",
    tag: "finance",
    title: "Gaussian copula — joint default probability and CDO tranche pricing",
    code: `import numpy as np
from scipy.stats import norm
from scipy.linalg import cholesky

def gaussian_copula_defaults(
    hazard_rates: np.ndarray,   # annual hazard rate per obligor
    correlation_rho: float,     # single-factor Gaussian copula correlation
    T: float,                   # horizon in years
    n_sims: int = 100_000,
    seed: int = 42,
) -> dict:
    """
    Li (2000) Gaussian copula for correlated defaults.
    Single-factor: X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i
    Default if X_i < Phi^{-1}(Q_i(T)) where Q_i(T) = 1 - exp(-h_i*T).
    Used for CDO tranche pricing; famous for underestimating tail correlation.
    """
    rng = np.random.default_rng(seed)
    n   = len(hazard_rates)

    # Default thresholds (inverse normal of marginal default probability)
    surv_probs  = np.exp(-hazard_rates * T)
    def_probs   = 1.0 - surv_probs
    thresholds  = norm.ppf(def_probs)   # Phi^{-1}(Q_i)

    # Simulate default indicators
    M       = rng.standard_normal(n_sims)              # systematic factor
    Z       = rng.standard_normal((n_sims, n))         # idiosyncratic
    X       = (np.sqrt(correlation_rho) * M[:, None]
               + np.sqrt(1.0 - correlation_rho) * Z)   # (n_sims, n)

    defaults   = (X < thresholds[None, :]).astype(float)  # 1 if defaulted
    n_defaults = defaults.sum(axis=1)    # number of defaults per simulation

    # Loss distribution (assume equal notionals, zero recovery)
    loss_rate = n_defaults / n

    # Tranche loss function (e.g. [0-3%, 3-7%, 7-10%, ...])
    tranches = [(0.0, 0.03), (0.03, 0.07), (0.07, 0.10), (0.10, 0.15), (0.15, 1.0)]
    tranche_losses = {}
    for lo, hi in tranches:
        tranche_l = np.clip(loss_rate - lo, 0, hi - lo) / (hi - lo)
        tranche_losses[f"{int(lo*100)}-{int(hi*100)}%"] = round(float(tranche_l.mean()), 4)

    return {
        "expected_loss_pct":   round(float(loss_rate.mean() * 100), 4),
        "loss_std_pct":        round(float(loss_rate.std() * 100), 4),
        "loss_99th_pct":       round(float(np.percentile(loss_rate, 99) * 100), 4),
        "tranche_expected_loss": tranche_losses,
        "rho":                 correlation_rho,
        "n_obligors":          n,
        "horizon_years":       T,
    }`,
    explanation:
      "The single-factor Gaussian copula was the standard CDO pricing model in the 2000s but proved catastrophically wrong in 2008 because the Gaussian copula has tail independence — correlated defaults only through the single systematic factor M, but extreme joint defaults are far more likely in practice (fat-tailed dependence). The correlation parameter rho is the key calibration input: equity tranches are most sensitive to it, while senior tranches are most sensitive to the assumed recovery rate.",
  },
  {
    id: "pyfin-20260611-b1-black-capfloor",
    language: "python",
    tag: "finance",
    title: "Black's formula for caps and floors — caplet decomposition",
    code: `import numpy as np
from scipy.stats import norm

def black_caplet(F: float, K: float, sigma: float, T_fix: float,
                  T_pay: float, notional: float, disc_T_pay: float) -> dict:
    """
    Black (1976) caplet: option on LIBOR/SOFR forward rate F.
    Caplet payoff at T_pay: notional * tau * max(F(T_fix) - K, 0)
    where tau = T_pay - T_fix (accrual fraction).
    Under Black's model, F is lognormal under the T_pay forward measure.
    """
    tau = T_pay - T_fix
    sqT = np.sqrt(T_fix)
    d1  = (np.log(F / K) + 0.5 * sigma**2 * T_fix) / (sigma * sqT)
    d2  = d1 - sigma * sqT

    # Black formula: disc * tau * notional * (F*N(d1) - K*N(d2))
    caplet  = disc_T_pay * tau * notional * (F * norm.cdf(d1) - K * norm.cdf(d2))
    floorlet = disc_T_pay * tau * notional * (K * norm.cdf(-d2) - F * norm.cdf(-d1))
    delta   = disc_T_pay * tau * notional * norm.cdf(d1)   # dCaplet/dF

    return {
        "caplet":    round(float(caplet), 6),
        "floorlet":  round(float(floorlet), 6),
        "delta":     round(float(delta), 6),
        "parity_check": round(float(caplet - floorlet - disc_T_pay*tau*notional*(F-K)), 8),
    }

def black_cap(forward_rates: list,   # [F_1, F_2, ..., F_n] per caplet
               K: float, sigma: float,
               reset_dates: list,     # [T_1, ..., T_n]
               pay_dates: list,       # [T_1+tau, ..., T_n+tau]
               disc_pay: list,        # discount factors at payment dates
               notional: float = 1_000_000) -> dict:
    """
    Cap = sum of caplets. Floor = sum of floorlets.
    Each caplet uses the same Black vol sigma (flat vol convention).
    """
    cap_pv   = 0.0
    floor_pv = 0.0
    for F, T_fix, T_pay, D in zip(forward_rates, reset_dates, pay_dates, disc_pay):
        r = black_caplet(F, K, sigma, T_fix, T_pay, notional, D)
        cap_pv   += r["caplet"]
        floor_pv += r["floorlet"]

    return {
        "cap_pv":   round(float(cap_pv), 2),
        "floor_pv": round(float(floor_pv), 2),
        "n_caplets": len(forward_rates),
        "strike":   K,
        "flat_vol": sigma,
    }`,
    explanation:
      "Black's formula for caplets applies lognormal dynamics to the forward rate under the payment date T-forward measure, which eliminates the need to discount within the option formula — the discount factor appears only as a multiplicative prefactor. Flat vol is the market convention for quoting caps: a single sigma applies to all caplets, though in practice each caplet has its own implied vol (the 'caplet strip'), and stripping these from market cap prices requires bootstrapping.",
  },
  {
    id: "pyfin-20260611-b1-iv-arb-check",
    language: "python",
    tag: "finance",
    title: "Implied vol surface no-arbitrage checks — butterfly and calendar spread",
    code: `import numpy as np
from scipy.stats import norm

def check_surface_arbitrage(
    strikes: np.ndarray,    # sorted ascending
    expiries: np.ndarray,   # sorted ascending
    iv_surface: np.ndarray, # shape (n_expiries, n_strikes)
    S: float, r: float, q: float = 0.0,
) -> dict:
    """
    Check two necessary no-arbitrage conditions on an implied vol surface:
    1. Butterfly (static): call spread prices must be non-negative.
       d^2 C / dK^2 >= 0 equivalent to density >= 0 (Breeden-Litzenberger).
    2. Calendar spread: call prices must increase with expiry (for same strike).
       C(K, T1) <= C(K, T2) for T1 < T2 (no-storage cost: options are monotone in T).
    """
    from scipy.stats import norm

    def bs_call(S, K, r, q, sigma, T):
        if T < 1e-6 or sigma < 1e-6:
            return max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    n_T, n_K = iv_surface.shape
    butterfly_viols = []
    calendar_viols  = []

    # Build call price matrix
    C = np.array([[bs_call(S, strikes[j], r, q, iv_surface[i, j], expiries[i])
                   for j in range(n_K)]
                  for i in range(n_T)])

    # 1. Butterfly: second finite difference in K must be >= 0
    for i in range(n_T):
        for j in range(1, n_K - 1):
            dK_lo = strikes[j]   - strikes[j-1]
            dK_hi = strikes[j+1] - strikes[j]
            butterfly = (C[i,j-1]/dK_lo - C[i,j]*(1/dK_lo + 1/dK_hi) + C[i,j+1]/dK_hi)
            if butterfly < -1e-4:
                butterfly_viols.append((float(expiries[i]), float(strikes[j]),
                                        round(float(butterfly), 6)))

    # 2. Calendar spread: call prices must not decrease with expiry
    for j in range(n_K):
        for i in range(n_T - 1):
            if C[i, j] > C[i+1, j] + 1e-4:
                calendar_viols.append((float(strikes[j]),
                                       float(expiries[i]), float(expiries[i+1]),
                                       round(float(C[i,j] - C[i+1,j]), 6)))

    return {
        "butterfly_violations": butterfly_viols,
        "calendar_violations":  calendar_viols,
        "n_butterfly_viols":    len(butterfly_viols),
        "n_calendar_viols":     len(calendar_viols),
        "is_arbitrage_free":    len(butterfly_viols) == 0 and len(calendar_viols) == 0,
    }`,
    explanation:
      "Butterfly arbitrage in the strike dimension corresponds to a negative risk-neutral density (call price curve is not convex in K), which would imply negative probabilities — a model-free violation detectable without any pricing model. Calendar spread arbitrage in the time dimension is more subtle: it only holds for non-dividend-paying assets since dividends can cause the call price to decrease with time, making this check dividend-adjusted.",
  },
  {
    id: "pyfin-20260611-b1-carry-trade",
    language: "python",
    tag: "finance",
    title: "FX carry trade signal — forward premium and UIP deviation",
    code: `import numpy as np
import pandas as pd

def fx_carry_signal(
    spot_rates: pd.DataFrame,       # columns: currency pairs, rows: dates (e.g. USD/EUR)
    forward_rates: pd.DataFrame,    # 1-month forward rates
    rf_rates: pd.DataFrame,         # short-term risk-free rates per currency (annualised)
    holding_period: int = 21,       # days
) -> dict:
    """
    FX Carry: borrow in low-yield currency, invest in high-yield currency.
    Forward premium = (F - S) / S ≈ r_d - r_f (covered interest parity).
    UIP deviation (carry P&L): high-yielding currencies tend to appreciate
    or stay flat rather than depreciate as UIP predicts.
    Signal: rank currencies by forward discount; long top, short bottom.
    """
    # Compute forward premium (annualised)
    forward_premium = (forward_rates - spot_rates) / spot_rates * (252 / holding_period)

    # Rank currencies by forward premium (ascending = sell low-yield, buy high-yield)
    ranks = forward_premium.rank(axis=1, ascending=True)
    n_ccy = forward_premium.shape[1]

    # Long top-tercile, short bottom-tercile (equal weight)
    long_signal  = (ranks >= 2*n_ccy/3).astype(float)
    short_signal = (ranks <= n_ccy/3).astype(float)
    long_signal  /= long_signal.sum(axis=1).values[:, None]   # normalise
    short_signal /= short_signal.sum(axis=1).values[:, None]

    # Realised carry return: rf_differential + spot_change
    rf_diff    = rf_rates.diff(holding_period).shift(-holding_period) / (252/holding_period)
    spot_chg   = spot_rates.pct_change(holding_period).shift(-holding_period)
    carry_ret  = rf_diff + spot_chg   # uncovered return

    # Portfolio return
    port_ret   = ((long_signal - short_signal) * carry_ret).sum(axis=1).dropna()

    ann_factor = 252 / holding_period
    ann_ret    = float(port_ret.mean() * ann_factor)
    ann_vol    = float(port_ret.std()  * np.sqrt(ann_factor))
    sharpe     = ann_ret / ann_vol if ann_vol > 0 else 0.0

    return {
        "ann_return":   round(ann_ret, 4),
        "ann_vol":      round(ann_vol, 4),
        "sharpe_ratio": round(sharpe, 3),
        "n_periods":    int(len(port_ret)),
        "max_drawdown": round(float(_max_drawdown(port_ret.cumsum())), 4),
    }

def _max_drawdown(cum_ret: pd.Series) -> float:
    """Rolling maximum drawdown from cumulative returns."""
    roll_max = cum_ret.expanding().max()
    drawdown = cum_ret - roll_max
    return float(drawdown.min())`,
    explanation:
      "The FX carry trade exploits the persistent failure of uncovered interest parity (UIP): UIP predicts that high-yield currencies depreciate by exactly the interest differential, but empirically they tend to appreciate (or stay flat) on average — the 'forward premium puzzle'. The carry premium is a compensation for crash risk: high-yield currencies experience sharp sudden depreciations during risk-off episodes, creating the negative skewness that makes carry strategies prone to periodic large losses.",
  },
];
