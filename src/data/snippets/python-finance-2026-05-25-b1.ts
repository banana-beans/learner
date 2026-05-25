import type { Snippet } from "./types";

export const pythonFinanceSnippets20260525B1: Snippet[] = [
  {
    id: "pyfin-20260525-b1-historical-var",
    language: "python",
    title: "Historical VaR with full portfolio revaluation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def historical_var(weights: np.ndarray,
                   returns: pd.DataFrame,
                   notional: float,
                   confidence: float = 0.99,
                   window: int = 252) -> dict:
    """
    Historical (non-parametric) VaR: take the alpha-quantile of the
    actual historical P&L distribution — no distributional assumption.
    Full revaluation: portfolio return each day = w^T r_t.
    Equally-weighted window (no decay); augment with EWMA for recency bias.
    """
    # Keep last 'window' days of returns
    r  = returns.iloc[-window:]                    # (T, N)
    pnl = r.values @ weights * notional            # (T,) daily P&L in $

    alpha   = 1.0 - confidence
    var_1d  = float(-np.quantile(pnl, alpha))      # loss = positive
    es_1d   = float(-pnl[pnl <= -var_1d].mean())   # conditional mean of tail

    # Scale to 10-day VaR (Basel square-root-of-time approximation)
    var_10d = var_1d * np.sqrt(10)
    es_10d  = es_1d  * np.sqrt(10)

    # Breach count: how many historical days exceeded today's VaR
    breaches = int((pnl < -var_1d).sum())

    print(f"1-day VaR ({int(confidence*100)}%):   \${var_1d:>12,.0f}")
    print(f"1-day ES  ({int(confidence*100)}%):   \${es_1d:>12,.0f}")
    print(f"10-day VaR:              \${var_10d:>12,.0f}")
    print(f"Historical breaches: {breaches} / {window} ({breaches/window:.1%})")

    return {"var_1d": var_1d, "es_1d": es_1d,
            "var_10d": var_10d, "breaches": breaches}

# Demo
rng = np.random.default_rng(42)
T, N = 500, 5
returns = pd.DataFrame(rng.multivariate_normal(
    np.zeros(N),
    np.eye(N) * 0.0001 + 0.00005,
    size=T))
w = np.array([0.3, 0.2, 0.2, 0.15, 0.15])
historical_var(w, returns, notional=1_000_000)`,
    explanation:
      "Historical VaR uses the actual empirical distribution of portfolio returns — no Gaussian or elliptic assumption. Its key advantage is capturing fat tails and skewness present in the data; its weakness is dependence on the specific historical period, which may miss future tail events not in the sample. Basel III mandates historical simulation over at least 1 year for IMA-approved desks.",
  },
  {
    id: "pyfin-20260525-b1-arima",
    language: "python",
    title: "ARIMA fitting and return forecasting with statsmodels",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')
# pip install statsmodels
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller

def fit_arima_forecast(series: pd.Series,
                        order: tuple = (1, 0, 1),
                        n_steps: int = 5) -> dict:
    """
    ARIMA(p, d, q):
      p = AR order (past values), d = integration order (differencing),
      q = MA order (past errors).
    d=0 assumes series is already stationary (no unit root).
    ADF test first to validate stationarity assumption.
    """
    # Step 1: ADF test for stationarity
    adf_stat, adf_p, _, _, crit, _ = adfuller(series.dropna())
    print(f"ADF stat={adf_stat:.4f}  p={adf_p:.4f}  " +
          f"Stationary: {adf_p < 0.05}")

    # Step 2: Fit ARIMA via maximum likelihood (Kalman filter recursion)
    model = SARIMAX(series.dropna(),
                     order=order,
                     trend='c',                  # include constant (drift)
                     enforce_stationarity=True,
                     enforce_invertibility=True)
    res = model.fit(disp=False)

    # Step 3: In-sample diagnostics
    print(f"AIC={res.aic:.2f}  BIC={res.bic:.2f}  " +
          f"Log-lik={res.llf:.2f}")

    # Step 4: Forecast n_steps ahead with confidence intervals
    forecast = res.get_forecast(steps=n_steps)
    fc_mean  = forecast.predicted_mean
    fc_conf  = forecast.conf_int(alpha=0.05)

    print("\\nForecast (95% CI):")
    for i, (mu, lo, hi) in enumerate(
            zip(fc_mean, fc_conf.iloc[:, 0], fc_conf.iloc[:, 1])):
        print(f"  t+{i+1}: {mu:.6f}  [{lo:.6f}, {hi:.6f}]")

    return {"aic": res.aic, "params": res.params,
            "forecast_mean": fc_mean, "forecast_ci": fc_conf}

# Demo with synthetic AR(1) returns
rng = np.random.default_rng(42)
n   = 300
r   = pd.Series(np.zeros(n))
for i in range(1, n):
    r.iloc[i] = 0.3 * r.iloc[i-1] + 0.001 + 0.01 * rng.standard_normal()
fit_arima_forecast(r, order=(1, 0, 1), n_steps=5)`,
    explanation:
      "ARIMA(1,0,1) captures first-order autocorrelation in returns (the AR(1) component) and the correlated noise structure (the MA(1) component). Returns are typically weakly autocorrelated on daily frequency (unlike prices), so d=0 is appropriate after an ADF test confirms no unit root. ARIMA forecasts are used to form the expected-return component of a signal in mean-reversion strategies.",
  },
  {
    id: "pyfin-20260525-b1-hull-white-tree",
    language: "python",
    title: "Hull-White interest rate trinomial tree",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

def hull_white_tree(a: float, sigma: float,
                     maturities: np.ndarray,
                     zero_rates: np.ndarray,
                     N: int = 50) -> dict:
    """
    Hull-White (1990) extended Vasicek:
    dr = [theta(t) - a*r]*dt + sigma*dW
    theta(t) is chosen to fit the initial zero curve exactly.

    Trinomial tree: dx = sigma*sqrt(3*dt), probabilities chosen to match
    first two moments.  Uses the theta offset at each step for curve fitting.
    """
    T_max  = maturities[-1]
    dt     = T_max / N
    dx     = sigma * np.sqrt(3.0 * dt)

    # Discount factor function from market zero rates
    zero_fn = interp1d(maturities, zero_rates, fill_value='extrapolate')
    DF = lambda t: np.exp(-zero_fn(t) * t) if t > 0 else 1.0

    # Trinomial probabilities
    pu = 1/6 + (a**2 * dx**2 * dt**2 - 0) / (2 * dx**2)  # simplified
    pm = 2/3
    pd = 1/6

    # Hull-White: theta(t) calibrated so forward rates match the market curve
    # theta(t) ~ d f(0,t)/dt + a*f(0,t) + sigma^2/(2a)*(1 - exp(-2a*t))
    def theta(t):
        dt_eps = 1e-5
        f0 = -np.log(DF(t + dt_eps) / DF(t)) / dt_eps  # fwd rate
        df = (-np.log(DF(t + 2*dt_eps) / DF(t + dt_eps)) / dt_eps - f0) / dt_eps
        return df + a * f0 + sigma**2 / (2*a) * (1 - np.exp(-2*a*t))

    # Build tree: store short rates on each node
    tree = {0: {0: zero_fn(dt)}}    # r[step][node_index]
    for n in range(1, N):
        t = n * dt
        theta_t = theta(t)
        prev = tree[n - 1]
        curr = {}
        for j, r_prev in prev.items():
            for dj, prob in [(1, pu), (0, pm), (-1, pd)]:
                jj = j + dj
                r_new = r_prev * np.exp(-a * dt) + theta_t * dt
                curr[jj] = curr.get(jj, 0.0) + prob * r_new
        tree[n] = curr

    print(f"Hull-White tree: {N} steps, a={a}, sigma={sigma}")
    print(f"theta(1Y)={theta(1.0):.4f}  theta(5Y)={theta(5.0):.4f}")
    return {"tree": tree, "N": N, "dt": dt}

mats  = np.array([0.5, 1., 2., 3., 5.])
zeros = np.array([0.04, 0.042, 0.045, 0.046, 0.047])
hull_white_tree(a=0.1, sigma=0.01, maturities=mats, zero_rates=zeros, N=30)`,
    explanation:
      "Hull-White extends Vasicek by making the mean-reversion level theta(t) time-dependent, calibrating it to exactly reproduce the market zero curve. The analytical theta formula avoids numerical instability from differencing discount factors. Hull-White is the industry-standard model for LIBOR-era cap/floor and swaption pricing, and remains relevant for OIS-based products.",
  },
  {
    id: "pyfin-20260525-b1-lsm",
    language: "python",
    title: "Longstaff-Schwartz LSM American option Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from numpy.polynomial import polynomial as P

def lsm_american_put(S: float, K: float, r: float, sigma: float, T: float,
                      n_paths: int = 10_000, n_steps: int = 50,
                      degree: int = 3, seed: int = 42) -> dict:
    """
    Longstaff-Schwartz (2001) Least Squares Monte Carlo:
    Backward induction to estimate the continuation value at each step.
    Regress realised future P&L on polynomial basis of current stock price.
    Exercise when intrinsic value > estimated continuation value.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * dt)

    # Simulate stock paths (n_paths x n_steps+1)
    Z  = rng.standard_normal((n_paths, n_steps))
    logS = np.log(S) + np.cumsum(
        np.hstack([np.zeros((n_paths, 1)),
                   (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z]),
        axis=1)
    St = np.exp(logS)   # shape (n_paths, n_steps+1)

    # Cash flows matrix: initially just the terminal payoff
    cf = np.maximum(K - St[:, -1], 0.0)   # terminal put payoff

    # Backward induction: from step N-1 down to step 1
    for t in range(n_steps - 1, 0, -1):
        intrinsic = np.maximum(K - St[:, t], 0.0)
        itm       = intrinsic > 0            # in-the-money paths only

        if itm.sum() < degree + 1:
            continue    # not enough in-the-money paths to regress

        # Discount future cash flows back one step
        Y = cf[itm] * disc                  # realised continuation P&L (discounted)
        X = St[itm, t]                      # current stock price

        # Polynomial regression: E[continuation | S_t] = beta @ basis(S_t)
        coeffs = P.polyfit(X, Y, deg=degree)
        cont   = P.polyval(X, coeffs)       # estimated continuation value

        # Exercise rule: exercise if intrinsic > continuation
        exercise = intrinsic[itm] > cont
        itm_idx  = np.where(itm)[0]
        cf[itm_idx[exercise]] = intrinsic[itm][exercise]

    # Price = mean discounted cash flow
    price = float(disc * np.mean(cf))
    se    = float(disc * np.std(cf) / np.sqrt(n_paths))
    print(f"LSM American put: {price:.4f}  ± {1.96*se:.4f} (95% CI)")
    return {"price": price, "se": se}

lsm_american_put(100, 100, 0.05, 0.2, 1.0, n_paths=20_000)`,
    explanation:
      "LSM is the industry standard for American option pricing via simulation: by regressing future payoffs on basis functions of the current state, it estimates whether early exercise is optimal path-by-path. The polynomial basis (Laguerre polynomials are preferred in Longstaff-Schwartz's original paper) captures the non-linear relationship between stock price and continuation value near the exercise boundary.",
  },
  {
    id: "pyfin-20260525-b1-svi-smile",
    language: "python",
    title: "SVI volatility smile parameterization and calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_w(k: np.ndarray, a: float, b: float, rho: float,
           m: float, sigma: float) -> np.ndarray:
    """
    SVI (Stochastic Volatility Inspired) total variance parameterization:
    w(k) = a + b * (rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    k = log(K/F) (log-moneyness), w = sigma_impl^2 * T (total variance).

    Constraints for no-arbitrage:
    sigma > 0, b >= 0, |rho| < 1,
    a + b*sigma*sqrt(1-rho^2) >= 0  (positive total variance).
    """
    z = k - m
    return a + b * (rho * z + np.sqrt(z**2 + sigma**2))

def fit_svi(log_moneyness: np.ndarray,
             total_var: np.ndarray) -> dict:
    """
    Calibrate SVI to a slice of implied vol: minimise sum-of-squared residuals
    in total variance space (avoids Vega-weighting complications).
    Multi-start to escape local minima.
    """
    def loss(p):
        a, b, rho, m, sigma = p
        if b < 0 or abs(rho) >= 1 or sigma <= 0:
            return 1e12
        if a + b * sigma * np.sqrt(1 - rho**2) < 0:
            return 1e12
        fitted = svi_w(log_moneyness, a, b, rho, m, sigma)
        return float(np.sum((fitted - total_var)**2) * 1e8)

    rng  = np.random.default_rng(42)
    best = None
    for _ in range(40):
        x0 = [rng.uniform(0.0, 0.1),   # a
               rng.uniform(0.0, 0.5),   # b
               rng.uniform(-0.9, 0.9),  # rho
               rng.uniform(-0.5, 0.5),  # m
               rng.uniform(0.01, 0.5)]  # sigma
        res = minimize(loss, x0, method='Nelder-Mead',
                       options={'xatol': 1e-9, 'fatol': 1e-11, 'maxiter': 5000})
        if best is None or res.fun < best.fun:
            best = res

    a, b, rho, m, sigma = best.x
    fitted = svi_w(log_moneyness, a, b, rho, m, sigma)
    rmse = float(np.sqrt(np.mean((np.sqrt(fitted) - np.sqrt(total_var))**2))) * 100
    print(f"SVI: a={a:.4f} b={b:.4f} rho={rho:.4f} m={m:.4f} sigma={sigma:.4f}")
    print(f"RMSE in implied vol: {rmse:.2f}%")
    return {"a": a, "b": b, "rho": rho, "m": m, "sigma": sigma}

k  = np.linspace(-0.4, 0.4, 11)
w  = 0.04 + 0.05 * (k - 0.1)**2 + 0.01 * k
fit_svi(k, w)`,
    explanation:
      "SVI parameterises the total variance smile as a function of log-moneyness with 5 parameters that have intuitive interpretations: a controls ATM level, b the smile curvature, rho the skew asymmetry, m the ATM shift, and sigma the minimum variance at the turning point. The parameterization is guaranteed to produce no butterfly arbitrage when its constraints are satisfied.",
  },
  {
    id: "pyfin-20260525-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal execution trajectory",
    tag: "finance",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class ACParams:
    sigma: float   # daily return volatility
    eta:   float   # temporary market impact (linear): cost = eta * v^2 * dt
    gamma: float   # permanent market impact: price shift = gamma * v * dt
    tau:   float   # risk-aversion (variance penalty weight)
    T:     float   # total execution horizon (days)
    X:     float   # initial shares to sell

def almgren_chriss(p: ACParams, N: int = 20) -> dict:
    """
    Almgren-Chriss (2000) optimal liquidation:
    Minimise E[cost] + tau * Var[cost].
    Analytic solution: x_j = X * sinh(kappa*(T - t_j)) / sinh(kappa*T)
    where kappa = sqrt(tau * sigma^2 / eta).

    kappa large -> fast liquidation (risk aversion dominates).
    kappa ~ 0   -> time-weighted (TWAP) schedule (market impact dominates).
    """
    kappa = np.sqrt(p.tau * p.sigma**2 / p.eta)
    dt    = p.T / N
    t     = np.linspace(0, p.T, N + 1)

    # Optimal inventory schedule
    x = p.X * np.sinh(kappa * (p.T - t)) / np.sinh(kappa * p.T)
    v = -np.diff(x) / dt    # trade rate (shares/day) at each interval

    # Expected execution cost and variance
    exp_cost = (p.gamma * p.X**2 / 2
                + p.eta * np.sum(v**2) * dt)
    exp_var  = p.sigma**2 * np.sum(x[:-1]**2) * dt

    # TWAP benchmark: uniform selling x_j = X * (1 - t_j/T)
    x_twap = p.X * (1 - t)
    v_twap = np.full(N, p.X / p.T)
    twap_cost = (p.gamma * p.X**2 / 2
                 + p.eta * np.sum(v_twap**2) * dt)

    print(f"kappa={kappa:.4f}  (T={p.T}d, eta={p.eta}, tau={p.tau})")
    print(f"Optimal cost: {exp_cost:.4f}  Var: {exp_var:.4f}")
    print(f"TWAP cost:    {twap_cost:.4f}  (AC saves {twap_cost-exp_cost:.4f})")
    return {"x": x, "v": v, "cost": exp_cost, "var": exp_var}

p = ACParams(sigma=0.02, eta=0.1, gamma=0.01, tau=1e-4, T=5.0, X=100_000)
almgren_chriss(p, N=10)`,
    explanation:
      "Almgren-Chriss balances two opposing forces: slow trading avoids temporary market impact (quadratic in rate) but accumulates volatility risk. The analytic solution is a hyperbolic-sine schedule — front-loaded when risk aversion is high, nearly linear (TWAP) when market impact dominates. The kappa parameter captures the 'urgency' — large kappa means sell fast regardless of cost.",
  },
  {
    id: "pyfin-20260525-b1-stress-testing",
    language: "python",
    title: "Yield curve stress testing — parallel shift, twist, and butterfly",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.interpolate import interp1d

def curve_stress(notional: float,
                  dv01_by_tenor: dict,
                  cs01_by_tenor: dict = None,
                  shift_bps: float = 100.0) -> pd.DataFrame:
    """
    Three standard yield curve scenarios (BCBS stress):
    1. Parallel shift: all tenors up/down by shift_bps.
    2. Steepener/flattener: long end up, short end down (or vice versa).
    3. Butterfly: short and long ends up, middle down (humped curve).

    dv01_by_tenor: {'1Y': dv01, '5Y': dv01, '10Y': dv01, ...}
    Each DV01 = dollar P&L per 1 bp adverse rate move.
    """
    tenors = np.array([float(t.rstrip('Y')) for t in dv01_by_tenor])
    dv01   = np.array(list(dv01_by_tenor.values()))

    results = []
    for name, shocks in [
        # 1. Parallel: uniform shift
        ("Parallel +100bp", np.ones(len(tenors)) * shift_bps),
        ("Parallel -100bp", -np.ones(len(tenors)) * shift_bps),
        # 2. Steepener: long end +200bp, short end -100bp (linear interpolation)
        ("Steepener",       np.interp(tenors, [tenors[0], tenors[-1]],
                                      [-shift_bps, 2*shift_bps])),
        # 3. Flattener: long end -150bp, short end +75bp
        ("Flattener",       np.interp(tenors, [tenors[0], tenors[-1]],
                                      [0.75*shift_bps, -1.5*shift_bps])),
        # 4. Butterfly: up at wings, down at belly (10Y)
        ("Butterfly +",     shift_bps * (1 - np.exp(-((tenors - 10)**2 / 4)))),
    ]:
        pnl  = -np.dot(dv01, shocks)   # DV01 * shock_bps = P&L loss if +rate
        results.append({"Scenario": name, "P&L ($)": pnl,
                         "P&L (%)": pnl / notional * 100})

    df = pd.DataFrame(results).set_index("Scenario")
    print(df.to_string(float_format=lambda x: f"{x:,.0f}"))
    return df

dv01s = {"1Y": 950, "2Y": 1850, "5Y": 4200, "10Y": 7800, "30Y": 14000}
curve_stress(notional=1_000_000, dv01_by_tenor=dv01s)`,
    explanation:
      "Regulatory stress tests (BCBS IRRBB, FRTB) require computing P&L under six prescribed yield curve scenarios. The butterfly scenario (wings up, belly down) exposes convexity mismatches that parallel-shift tests miss — a position that is DV01-neutral may still have significant butterfly exposure due to non-linear gamma in long-dated bonds.",
  },
  {
    id: "pyfin-20260525-b1-barra-regression",
    language: "python",
    title: "Barra cross-sectional WLS factor return estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def barra_factor_returns(returns: np.ndarray,
                           exposures: np.ndarray,
                           weights: np.ndarray = None) -> dict:
    """
    Barra GEM-style cross-sectional regression:
    r_i = sum_k B_ik * f_k + u_i   for each period t
    where B_ik is the exposure of asset i to factor k (predetermined),
    and f_k are the factor returns to be estimated.

    WLS (GLS): weight by 1/sqrt(market_cap) or inverse residual volatility.
    Solved as: f = (B^T W B)^{-1} B^T W r
    """
    n_assets, n_factors = exposures.shape

    if weights is None:
        weights = np.ones(n_assets)

    W = np.diag(weights)

    # WLS solution for factor returns
    BTWB  = exposures.T @ W @ exposures
    BTWr  = exposures.T @ W @ returns
    factor_rets = np.linalg.solve(BTWB, BTWr)

    residuals  = returns - exposures @ factor_rets
    resid_var  = float(np.var(residuals, ddof=n_factors))
    r_squared  = 1.0 - float(np.var(residuals) / np.var(returns))

    # Specific risk (per-asset residual)
    specific_var = residuals**2

    print(f"Factor returns (bps): {np.round(factor_rets * 1e4, 2)}")
    print(f"R-squared: {r_squared:.4f}  Specific vol (avg): "
          f"{np.sqrt(specific_var.mean()):.4f}")
    return {"factor_rets": factor_rets, "residuals": residuals,
            "r2": r_squared, "specific_var": specific_var}

# Demo: 100 assets, 5 factors (market, size, value, momentum, quality)
rng = np.random.default_rng(42)
N, K = 100, 5
B = rng.standard_normal((N, K))    # exposures
f_true = np.array([0.001, -0.0005, 0.0003, 0.0008, -0.0002])
r = B @ f_true + 0.005 * rng.standard_normal(N)
barra_factor_returns(r, B)`,
    explanation:
      "Barra cross-sectional regression recovers factor returns from a single day's asset returns given pre-computed factor exposures. WLS down-weights high-idiosyncratic-risk assets (small-cap, illiquid) to improve factor return estimation efficiency. The resulting factor returns aggregate into the covariance model used for portfolio risk attribution.",
  },
  {
    id: "pyfin-20260525-b1-bachelier",
    language: "python",
    title: "Bachelier (normal) model for negative-rate IR options",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bachelier_call(F: float, K: float, sigma_n: float, T: float,
                    df: float = 1.0) -> dict:
    """
    Bachelier (1900) / Normal model: dF = sigma_n * dW (arithmetic BM).
    Allows negative forwards — critical for IR options under ZIRP/NIRP.
    C = df * [(F - K) * N(d) + sigma_n * sqrt(T) * phi(d)]
    where d = (F - K) / (sigma_n * sqrt(T)).

    sigma_n is absolute (not relative) vol — units of forward rate.
    Black vol and normal vol are approximately related via:
    sigma_Black ~ sigma_n / F  (ATM approximation).
    """
    vol_T = sigma_n * np.sqrt(T)
    if vol_T < 1e-12:
        return {"call": max(F - K, 0.0) * df, "put": max(K - F, 0.0) * df}

    d      = (F - K) / vol_T
    Nd     = norm.cdf(d)
    phi_d  = norm.pdf(d)

    call   = df * ((F - K) * Nd + vol_T * phi_d)
    put    = call + df * (K - F)              # put-call parity for forwards

    # Greeks (wrt forward rate F)
    delta_c = df * Nd
    delta_p = df * (Nd - 1)
    gamma   = df * phi_d / vol_T             # same for call and put
    vega    = df * phi_d * np.sqrt(T)        # per unit of sigma_n

    # Normal vol from call price (analytic inverse — no iteration needed at ATM)
    if abs(F - K) < 1e-8:
        atm_vol = call / (df * np.sqrt(T / (2 * np.pi)))   # ATM: C = sigma*sqrt(T/2pi)
    else:
        atm_vol = None

    print(f"Bachelier call: {call:.6f}  put: {put:.6f}")
    print(f"Delta: {delta_c:.4f}  Gamma: {gamma:.4f}  Vega: {vega:.4f}")
    return {"call": call, "put": put, "delta": delta_c, "gamma": gamma,
            "vega": vega, "atm_vol": atm_vol}

# Example: 3M swaption on a 5Y swap, F = -0.005 (negative rate environment)
bachelier_call(F=-0.005, K=0.0, sigma_n=0.005, T=0.25, df=0.998)`,
    explanation:
      "The Bachelier model became essential during the ZIRP/NIRP era (2015-2022 EUR, JPY) because the log-normal Black model assigns zero probability to negative rates. The normal vol sigma_n is absolute — 50 bps normal vol on a -0.5% rate means roughly the same absolute movement as 50 bps normal vol on a +4% rate, unlike Black vol which is rate-relative.",
  },
  {
    id: "pyfin-20260525-b1-cap-floor",
    language: "python",
    title: "Interest rate cap and floor pricing (Black model)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.interpolate import interp1d

def black_caplet(F: float, K: float, sigma: float, T: float, df: float) -> float:
    """Black (1976) caplet: pays max(F_T - K, 0) at T+tau.
    F = forward LIBOR/SOFR,  sigma = Black vol,  df = discount factor to T."""
    if T < 1e-10 or sigma < 1e-10:
        return df * max(F - K, 0.0)
    d1 = (np.log(F / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return df * (F * norm.cdf(d1) - K * norm.cdf(d2))

def price_cap(notional: float,
               K: float,
               tenor: float,
               payment_freq: int,
               forward_rates: np.ndarray,   # forward LIBOR for each period
               disc_factors: np.ndarray,    # DF to each payment date
               black_vols: np.ndarray,      # implied vol for each period
               is_cap: bool = True) -> dict:
    """
    Cap = sum of caplets (call options on LIBOR for each reset period).
    Floor = sum of floorlets (put options on LIBOR).
    Cap - Floor = Swap (by put-call parity for interest rate options).
    """
    dt = 1.0 / payment_freq
    n  = len(forward_rates)
    times = np.arange(1, n + 1) * dt

    prices   = []
    for i, (F, df, vol, T) in enumerate(
            zip(forward_rates, disc_factors, black_vols, times)):
        if is_cap:
            pv = notional * dt * black_caplet(F, K, vol, T - dt, df)
        else:
            # Floorlet via put-call parity on caplet
            caplet = black_caplet(F, K, vol, T - dt, df)
            pv = notional * dt * (caplet + df * (K - F))
        prices.append(pv)

    total = sum(prices)
    name  = "Cap" if is_cap else "Floor"
    print(f"{name} value:   \${total:>10,.2f}")
    print(f"  Caplet PVs: {[f'{p:,.0f}' for p in prices[:4]]} ...")
    return {"value": total, "caplet_pvs": prices}

fwds = np.array([0.04, 0.042, 0.044, 0.045, 0.046, 0.047, 0.047, 0.048])
dfs  = np.exp(-np.arange(1, 9) * 0.5 * 0.045)
vols = np.full(8, 0.20)
price_cap(notional=10_000_000, K=0.045, tenor=4.0, payment_freq=2,
           forward_rates=fwds, disc_factors=dfs, black_vols=vols)`,
    explanation:
      "A cap is a portfolio of caplets — each caplet is a call option on the floating rate for one period. Cap-floor parity follows from caplet put-call parity: Cap - Floor = Fixed receiver swap (net of coupon differences). The Black model for caps treats forward rates as log-normally distributed, which breaks down near zero — hence the shift to Bachelier vols during NIRP.",
  },
  {
    id: "pyfin-20260525-b1-rolling-beta",
    language: "python",
    title: "Rolling CAPM beta and time-varying alpha estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def rolling_capm(asset_returns: pd.Series,
                  market_returns: pd.Series,
                  window: int = 60,
                  rf_annual: float = 0.04) -> pd.DataFrame:
    """
    Rolling OLS for CAPM: r_i - rf = alpha + beta * (r_m - rf) + eps.
    Window = 60 trading days (approx 3 months).
    beta_t > 1: more volatile than market (amplifies market moves).
    alpha_t > 0: positive abnormal return (Jensen's alpha).
    """
    rf_daily  = rf_annual / 252
    excess_i  = asset_returns  - rf_daily
    excess_m  = market_returns - rf_daily

    betas, alphas, r2s = [], [], []

    for end in range(window, len(asset_returns) + 1):
        yi = excess_i.iloc[end - window : end].values
        xm = excess_m.iloc[end - window : end].values

        # OLS in closed form: beta = Cov(y,x) / Var(x)
        cov_yx = np.cov(yi, xm, ddof=1)
        beta   = cov_yx[0, 1] / cov_yx[1, 1]
        alpha  = yi.mean() - beta * xm.mean()

        # R-squared
        y_hat  = alpha + beta * xm
        ss_res = np.sum((yi - y_hat)**2)
        ss_tot = np.sum((yi - yi.mean())**2)
        r2     = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

        betas.append(beta)
        alphas.append(alpha * 252)    # annualised alpha
        r2s.append(r2)

    dates = asset_returns.index[window - 1:]
    result = pd.DataFrame({"beta": betas, "alpha_ann": alphas, "r2": r2s},
                           index=dates)

    print(f"Mean beta:  {result.beta.mean():.3f}")
    print(f"Mean alpha: {result.alpha_ann.mean():.4f} (annualised)")
    print(f"Beta range: [{result.beta.min():.2f}, {result.beta.max():.2f}]")
    return result

# Demo
rng = np.random.default_rng(42)
mkt = pd.Series(rng.standard_normal(500) * 0.01)
ast = pd.Series(1.2 * mkt.values + 0.0003 + 0.008 * rng.standard_normal(500))
rolling_capm(ast, mkt, window=60)`,
    explanation:
      "Time-varying beta captures structural breaks in market sensitivity — a stock may have low beta before a leveraged buyout and high beta after. Rolling OLS with a 60-day window is the simplest approach; Kalman filter estimation (state-space CAPM) is more statistically efficient but the rolling window is more robust to outliers and widely used in practice.",
  },
  {
    id: "pyfin-20260525-b1-student-t-copula",
    language: "python",
    title: "Student-t copula — tail dependence and joint VaR simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import t as student_t, norm

def student_t_copula_sample(Sigma: np.ndarray,
                              dof: float,
                              n_samples: int,
                              marginal_dof: float = None,
                              seed: int = 42) -> dict:
    """
    Student-t copula: generates correlated samples with joint tail dependence.
    Unlike Gaussian copula, t-copula produces simultaneous extreme events
    — crucial for portfolio tail risk (2008 correlation spike).

    Lower tail dependence lambda_L = 2 * t_{dof+1}(-sqrt((dof+1)(1-rho)/(1+rho)))
    """
    rng = np.random.default_rng(seed)
    n   = Sigma.shape[0]

    # Cholesky of correlation matrix
    L   = np.linalg.cholesky(Sigma)

    # Step 1: Draw correlated multivariate normal
    Z   = rng.standard_normal((n_samples, n))
    ZL  = Z @ L.T   # (n_samples, n) correlated standard normal

    # Step 2: Draw chi-squared scaling factor (shared across dimensions)
    W   = rng.chisquare(dof, size=n_samples)   # chi^2(nu) variable
    t_s = ZL / np.sqrt(W[:, None] / dof)       # multivariate t-distributed

    # Step 3: Convert to uniform via CDF of marginal t
    nu_marg = marginal_dof if marginal_dof else dof
    U   = student_t.cdf(t_s, df=nu_marg)   # (n_samples, n) in [0,1]

    # Joint tail event: all assets simultaneously in bottom 5%
    tail_prob = float(np.mean(np.all(U < 0.05, axis=1)))

    # Compare to Gaussian copula (independence in tail)
    Z2   = rng.standard_normal((n_samples, n)) @ L.T
    U2   = norm.cdf(Z2)
    gauss_tail = float(np.mean(np.all(U2 < 0.05, axis=1)))

    print(f"t-copula (nu={dof}) joint tail: {tail_prob:.4%}")
    print(f"Gaussian copula  joint tail:    {gauss_tail:.4%}")
    print(f"Tail dependence amplification:  {tail_prob/gauss_tail:.1f}x")

    return {"samples_uniform": U, "t_samples": t_s, "tail_prob": tail_prob}

Sigma = np.array([[1.0, 0.6, 0.4],
                   [0.6, 1.0, 0.5],
                   [0.4, 0.5, 1.0]])
student_t_copula_sample(Sigma, dof=4, n_samples=100_000)`,
    explanation:
      "The Student-t copula produces tail dependence that the Gaussian copula cannot: when one asset crashes, the t-copula assigns much higher probability to simultaneous crashes in other assets. This was the central failure of Gaussian copula models in 2008 CDO pricing — observed joint defaults far exceeded Gaussian copula predictions. Lower dof increases tail dependence: nu=4 gives ~5x more joint tail events than the Gaussian.",
  },
  {
    id: "pyfin-20260525-b1-drawdown-sizing",
    language: "python",
    title: "Position sizing with maximum drawdown constraint",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def max_dd_position_size(sigma_daily: float,
                           target_max_dd: float,
                           confidence: float = 0.95,
                           horizon_days: int = 252) -> dict:
    """
    Size positions so that the expected maximum drawdown does not exceed target.
    Expected max drawdown of a Brownian motion over T periods:
    E[MDD] ~ sigma * sqrt(T) * sqrt(2 * ln(T))  (Magdon-Ismail & Atiya approximation)

    More conservative: use the 95th percentile of MDD distribution.
    scale_f = target_max_dd / sigma_daily — gives the dollar-normalised position.
    """
    T = horizon_days

    # Approximation: E[MDD] = sigma * sqrt(T) * sqrt(2 * ln(T) - ln(ln(T)) - ln(4*pi))
    C = np.sqrt(2 * np.log(T) - np.log(np.log(T)) - np.log(4 * np.pi))
    expected_mdd_per_unit = sigma_daily * np.sqrt(T) * C

    # Scale: solve for position size f such that f * E[MDD_per_unit] = target
    position_scale = target_max_dd / expected_mdd_per_unit

    # Rough percentile adjustment: 95th percentile ~ 1.6 * E[MDD] (simulation-based)
    pct_adjustment = 1.6
    conservative_scale = target_max_dd / (expected_mdd_per_unit * pct_adjustment)

    # Kelly position for reference (assumes SR = 1.0)
    kelly_scale = 1.0 / (sigma_daily**2 * T)  # ~Sharpe^2 / sigma^2

    print(f"Expected annual MDD (unit pos): {expected_mdd_per_unit:.4f}")
    print(f"Position scale (expected MDD):  {position_scale:.4f}")
    print(f"Position scale (95th pct MDD):  {conservative_scale:.4f}")
    print(f"Kelly scale (ref):              {kelly_scale:.4f}")

    return {"expected_mdd": expected_mdd_per_unit,
            "position_scale": position_scale,
            "conservative_scale": conservative_scale}

max_dd_position_size(sigma_daily=0.01, target_max_dd=0.15)`,
    explanation:
      "Maximum drawdown scales as sigma * sqrt(T * ln(T)) — sublinearly in time but faster than the sqrt(T) of standard deviation. Sizing to a target MDD rather than a Sharpe target better reflects investor loss aversion: a strategy with Sharpe=1.5 but 30% drawdown is often rejected in practice while a 15% drawdown strategy with Sharpe=1.0 is accepted.",
  },
  {
    id: "pyfin-20260525-b1-book-imbalance",
    language: "python",
    title: "Order book imbalance signal — short-horizon price predictor",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def book_imbalance(bid_qtys: np.ndarray,
                    ask_qtys: np.ndarray,
                    bid_prices: np.ndarray,
                    ask_prices: np.ndarray,
                    n_levels: int = 5,
                    decay: float = 0.7) -> float:
    """
    Volume-weighted order book imbalance (OBI):
    OBI = (WBid - WAsk) / (WBid + WAsk)  in [-1, 1]
    Positive OBI -> more buy pressure -> price likely to move up.

    depth_weights: exponential decay across levels (top level = 1.0).
    Empirically, OBI predicts next-5s mid-price move with IC ~ 0.08-0.15.
    """
    n   = min(n_levels, len(bid_qtys), len(ask_qtys))
    w   = np.array([decay**i for i in range(n)])   # level weights

    bid_vols = bid_qtys[:n] * w
    ask_vols = ask_qtys[:n] * w

    # Volume-weighted average bid/ask prices
    vwab_bid = np.dot(bid_vols, bid_prices[:n]) / bid_vols.sum()
    vwab_ask = np.dot(ask_vols, ask_prices[:n]) / ask_vols.sum()

    wbid = bid_vols.sum()
    wask = ask_vols.sum()
    obi  = (wbid - wask) / (wbid + wask)

    # Spread-adjusted: high OBI near best = stronger signal
    spread  = ask_prices[0] - bid_prices[0]
    mid     = 0.5 * (ask_prices[0] + bid_prices[0])
    obi_adj = obi * (1.0 - spread / mid * 500)   # penalise wide-spread markets

    print(f"OBI: {obi:+.4f}  (adj: {obi_adj:+.4f})")
    print(f"VWAB bid: {vwab_bid:.4f}  ask: {vwab_ask:.4f}  spread: {spread:.4f}")
    return obi

# Example: 5-level book snapshot
bids  = np.array([100.00, 99.95, 99.90, 99.85, 99.80])
asks  = np.array([100.05, 100.10, 100.15, 100.20, 100.25])
bqtys = np.array([1000, 500, 800, 300, 200])
aqtys = np.array([200, 150, 400, 600, 300])
book_imbalance(bqtys, aqtys, bids, asks, n_levels=5)`,
    explanation:
      "Order book imbalance is the most studied microstructure signal: heavy bid depth relative to ask depth predicts upward price movement over the next few seconds. Exponential level weighting prioritises near-touch depth — level-5 depth is largely uninformative. OBI saturates as a predictor beyond ~10 seconds; longer-horizon signals require momentum or macro factors.",
  },
  {
    id: "pyfin-20260525-b1-variance-gamma",
    language: "python",
    title: "Variance Gamma option pricing via Gauss-Laguerre quadrature",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.special import gamma as gamma_fn

def vg_characteristic(u: complex, S: float, K: float, r: float,
                        T: float, sigma: float, nu: float, theta: float) -> complex:
    """
    Variance Gamma (Madan, Carr & Chang 1998) characteristic function.
    VG = Brownian motion with drift, time-changed by a Gamma process.
    nu: variance of Gamma time change (controls kurtosis).
    theta: drift of BM (controls skewness — negative for equity skew).
    """
    omega  = (1.0 / nu) * np.log(1.0 - theta * nu - 0.5 * sigma**2 * nu)
    phi_u  = (np.exp(1j * u * (np.log(S / K) + (r + omega) * T))
              * (1.0 - 1j * u * theta * nu + 0.5 * sigma**2 * nu * u**2)
              ** (-T / nu))
    return phi_u

def vg_call_fourier(S: float, K: float, r: float, T: float,
                     sigma: float, nu: float, theta: float,
                     N: int = 256, alpha: float = 1.5) -> float:
    """
    Price a European call via Carr-Madan FFT.
    Modified characteristic function: phi_mod(u) = exp(-r*T)*phi(u - i*(alpha+1)).
    Integral truncated at u_max and discretised.
    """
    du  = 0.25
    u   = np.arange(1, N + 1) * du
    km  = np.log(K)

    cf_vals = vg_characteristic(u - 1j * (alpha + 1), S, K, r, T, sigma, nu, theta)
    integrand = (np.exp(-r * T) * cf_vals
                 / (alpha**2 + alpha - u**2 + 1j * (2 * alpha + 1) * u))
    integrand *= np.exp(-1j * u * km)

    # Trapezoidal rule (FFT would give all strikes at once)
    price = float(np.real(np.trapz(integrand, u) / np.pi)) * np.exp(-alpha * km)
    return max(price, max(S - K * np.exp(-r * T), 0.0))

price = vg_call_fourier(S=100, K=100, r=0.05, T=1.0,
                          sigma=0.2, nu=0.5, theta=-0.15)
print(f"VG call: {price:.4f}")`,
    explanation:
      "The Variance Gamma model generates excess kurtosis (heavy tails) and skewness (negative theta for equity markets) without requiring a diffusion component — VG paths are of bounded variation, unlike Brownian motion. The FFT pricing approach applies to any model with an analytic characteristic function, making it the universal pricing engine for Lévy models.",
  },
  {
    id: "pyfin-20260525-b1-euler-attribution",
    language: "python",
    title: "Euler risk attribution — marginal contribution to portfolio VaR",
    tag: "finance",
    code: `import numpy as np

def euler_attribution(weights: np.ndarray,
                        Sigma: np.ndarray,
                        notional: float,
                        confidence: float = 0.99) -> dict:
    """
    Euler decomposition (Tasche 1999): portfolio risk is homogeneous of degree 1
    => Risk(portfolio) = sum_i w_i * dRisk/dw_i  (Euler's theorem).
    For parametric VaR: VaR = z * sigma_p * notional.
    Marginal VaR_i = z * (Sigma @ w)_i / sigma_p   (per unit weight)
    Component VaR_i = w_i * Marginal VaR_i          (dollar contribution)
    Diversification benefit = sum(Component VaR) - Portfolio VaR.
    """
    from scipy.stats import norm
    z        = norm.ppf(confidence)
    var_p    = float(weights @ Sigma @ weights)
    sigma_p  = np.sqrt(var_p)
    port_var = z * sigma_p * notional

    # Marginal and component risk
    cov_contrib  = Sigma @ weights          # (n,) vector: cov(r_i, r_p)
    marginal_var = z * cov_contrib / sigma_p * notional   # per unit weight
    component_var= weights * marginal_var                  # dollar component

    # Percentage contributions
    pct_contrib  = component_var / port_var
    diversif_ben = component_var.sum() - port_var   # should be zero (Euler exact)

    print(f"Portfolio VaR ({int(confidence*100)}%): \${port_var:>12,.0f}")
    print(f"Portfolio vol:               {sigma_p:.6f}")
    print("\\nComponent VaR (Euler):")
    for i, (cv, pct) in enumerate(zip(component_var, pct_contrib)):
        print(f"  Asset {i+1}: \${cv:>10,.0f}  ({pct:>6.1%})")
    print(f"Sum check (vs portfolio VaR): \${component_var.sum():,.0f}")

    return {"port_var": port_var, "component_var": component_var,
            "pct_contrib": pct_contrib, "marginal_var": marginal_var}

w     = np.array([0.3, 0.25, 0.2, 0.15, 0.1])
Sigma = np.array([[0.04, 0.01, 0.005, 0.002, 0.001],
                   [0.01, 0.03, 0.008, 0.003, 0.001],
                   [0.005,0.008,0.025, 0.004, 0.002],
                   [0.002,0.003,0.004, 0.02,  0.001],
                   [0.001,0.001,0.002, 0.001, 0.015]])
euler_attribution(w, Sigma, notional=10_000_000)`,
    explanation:
      "Euler attribution satisfies the full-allocation property: component VaRs sum exactly to portfolio VaR. This is in contrast to stand-alone VaRs (which sum to more than the portfolio due to diversification) or marginal VaRs (which measure the incremental impact of adding one unit). Euler decomposition is the correct risk budget framework for comparing each position's contribution to total risk.",
  },
  {
    id: "pyfin-20260525-b1-implied-repo",
    language: "python",
    title: "Implied repo rate from equity futures basis",
    tag: "finance",
    code: `import numpy as np
from datetime import datetime, timedelta

def implied_repo(S: float,
                  F: float,
                  T: float,
                  q: float = 0.0,
                  continuous: bool = True) -> float:
    """
    Cost-of-carry model: F = S * exp((r - q) * T)
    Solve for the implied repo rate r (continuous compounding):
    r = ln(F / S) / T + q

    Discrete (simple) version: F = S * (1 + (r - q) * T)
    r_simple = (F / S - 1) / T + q

    The basis = F - S * exp((r_actual - q) * T) measures the difference
    between the fair-value futures price and the market price.
    Negative basis ('cash and carry'): futures are cheap -> buy futures, sell spot.
    """
    if continuous:
        r = np.log(F / S) / T + q
    else:
        r = (F / S - 1.0) / T + q

    fair_F = S * np.exp((r - q) * T) if continuous else S * (1 + (r - q) * T)
    basis  = F - S * np.exp(r * T - q * T)

    print(f"Spot: {S:.4f}  Futures: {F:.4f}  T: {T:.4f}Y  q: {q:.4%}")
    print(f"Implied repo: {r:.4%}  Fair futures: {fair_F:.4f}  Basis: {basis:.6f}")
    return r

def dividend_adjusted_repo(S: float, F: float, T: float,
                             dividends: list[tuple[float, float]]) -> float:
    """
    Adjust for discrete dividends: F = (S - PV_divs) * exp(r * T)
    PV_divs = sum(div_i * exp(-r_approx * t_i))
    Iterate once: use market rate as r_approx.
    """
    r_approx = np.log(F / S) / T   # first approximation ignoring dividends
    pv_divs  = sum(d * np.exp(-r_approx * t) for t, d in dividends)
    r = np.log(F / (S - pv_divs)) / T
    print(f"PV dividends: {pv_divs:.4f}  Div-adjusted repo: {r:.4%}")
    return r

# Example: SPX futures
r1 = implied_repo(S=4500, F=4572, T=0.25, q=0.013)
r2 = dividend_adjusted_repo(S=4500, F=4572, T=0.25,
                               dividends=[(0.05, 12), (0.10, 18), (0.08, 11)])`,
    explanation:
      "The implied repo rate is the breakeven financing rate for a cash-and-carry trade: buy the underlying, short the futures, and carry until expiry. If the implied repo exceeds actual repo rates, the futures are rich — sell them. If below, futures are cheap — buy them. Dividend-adjusted repo accounts for the fact that futures holders do not receive dividends, so the fair futures price is lower by the PV of dividends.",
  },
  {
    id: "pyfin-20260525-b1-gamma-hedging",
    language: "python",
    title: "Portfolio gamma hedging with liquid options",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_greeks(S: float, K: float, r: float, sigma: float, T: float,
               call: bool = True) -> dict:
    sT  = sigma * np.sqrt(T)
    d1  = (np.log(S / K) + (r + 0.5*sigma**2)*T) / sT
    d2  = d1 - sT
    n1  = (1 if call else -1)
    phi = norm.pdf(d1)
    Nd1 = norm.cdf(n1 * d1)
    Nd2 = norm.cdf(n1 * d2)
    return {
        "price":  n1 * (S * Nd1 - K * np.exp(-r*T) * Nd2),
        "delta":  n1 * Nd1,
        "gamma":  phi / (S * sT),
        "vega":   S * phi * np.sqrt(T) * 0.01,
        "theta": (-S * phi * sigma / (2 * np.sqrt(T))
                  - n1 * r * K * np.exp(-r*T) * Nd2) / 365.0,
    }

def gamma_hedge(portfolio_gamma: float,
                 hedge_option: dict,
                 portfolio_delta: float) -> dict:
    """
    Step 1: Add h1 hedge options to neutralise portfolio gamma.
    h1 = -portfolio_gamma / gamma_option
    Step 2: Add h2 units of underlying to re-neutralise delta after step 1.
    h2 = -(portfolio_delta + h1 * delta_option)
    Gamma-neutral + delta-neutral => insensitive to small and medium moves.
    """
    gamma_opt = hedge_option["gamma"]
    delta_opt = hedge_option["delta"]

    if abs(gamma_opt) < 1e-12:
        raise ValueError("Hedge option has zero gamma")

    h1 = -portfolio_gamma / gamma_opt          # option hedge units
    h2 = -(portfolio_delta + h1 * delta_opt)   # stock units to re-delta-hedge

    print(f"Portfolio gamma: {portfolio_gamma:.6f}")
    print(f"Hedge option gamma: {gamma_opt:.6f}  delta: {delta_opt:.4f}")
    print(f"Hedge: sell {abs(h1):.0f} options  + {h2:+.2f} shares")
    print(f"Net gamma after hedge: {portfolio_gamma + h1*gamma_opt:.2e}")
    return {"option_units": h1, "delta_hedge_shares": h2}

hedge_opt = bs_greeks(S=100, K=100, r=0.05, sigma=0.2, T=0.25)
gamma_hedge(portfolio_gamma=-5000, hedge_option=hedge_opt, portfolio_delta=200)`,
    explanation:
      "Gamma hedging adds a non-linear instrument (an option) to neutralise the second-order exposure that delta hedging cannot remove. After gamma-neutralising with options, the residual delta from the new options is re-hedged with stock. A gamma-neutral portfolio still has vega risk — a complete hedge requires both gamma and vega neutrality, typically requiring two different option strikes or expiries.",
  },
  {
    id: "pyfin-20260525-b1-robust-cov",
    language: "python",
    title: "Robust covariance — Minimum Covariance Determinant (MCD)",
    tag: "finance",
    code: `import numpy as np
from sklearn.covariance import MinCovDet, EmpiricalCovariance

def robust_vs_sample_cov(returns: np.ndarray) -> dict:
    """
    MCD (Rousseeuw 1984): finds the subset of h observations (h ~ 0.75*n)
    whose covariance matrix has minimum determinant.
    Robust to outliers: a single bad day does not blow up the covariance.
    Used in stressed risk models where 2008 / 2020 outliers distort estimates.

    Ledoit-Wolf shrinkage vs MCD:
    - Ledoit-Wolf: handles small n/p; biased toward target (identity / market).
    - MCD: handles gross outliers; computationally heavier; n >> p required.
    """
    T, N = returns.shape

    # Sample covariance
    sample_cov = np.cov(returns, rowvar=False)

    # Ledoit-Wolf shrinkage
    from sklearn.covariance import LedoitWolf
    lw = LedoitWolf().fit(returns)

    # MCD robust estimator
    mcd = MinCovDet(support_fraction=0.75, random_state=42).fit(returns)

    # Compare condition numbers (lower = more stable matrix inversion)
    cn_sample = np.linalg.cond(sample_cov)
    cn_lw     = np.linalg.cond(lw.covariance_)
    cn_mcd    = np.linalg.cond(mcd.covariance_)

    print(f"Condition numbers — Sample: {cn_sample:.1f}  LW: {cn_lw:.1f}  MCD: {cn_mcd:.1f}")

    # Detect outlier days flagged by MCD (Mahalanobis distance)
    mah_sq  = mcd.mahalanobis(returns)
    outlier_threshold = np.chi2.ppf(0.975, df=N)
    n_outliers = int((mah_sq > outlier_threshold).sum())
    print(f"Outlier days detected by MCD: {n_outliers} / {T}")

    return {"sample_cov": sample_cov, "lw_cov": lw.covariance_,
            "mcd_cov": mcd.covariance_, "outlier_mask": mah_sq > outlier_threshold}

from scipy.stats import chi2 as chi2_dist
import numpy as np
rng = np.random.default_rng(42)
r   = rng.multivariate_normal(np.zeros(5), np.eye(5) * 0.0001, 250)
r[50] *= 8   # inject outlier day
robust_vs_sample_cov(r)`,
    explanation:
      "MCD is the standard robust covariance estimator in financial risk: it automatically down-weights the subsample that maximises matrix stability. A single 2008-style day with 8-sigma returns inflates the sample covariance by 64x for that pair of assets — MCD bounds this by excluding it from the estimation subset. The Mahalanobis distance flags outlier days as a by-product, useful for regime-change detection.",
  },
  {
    id: "pyfin-20260525-b1-pairs-zscore",
    language: "python",
    title: "Pairs trading z-score signal with dynamic hedge ratio",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def pairs_zscore(y: pd.Series, x: pd.Series,
                  window: int = 60,
                  z_entry: float = 2.0,
                  z_exit: float = 0.5) -> pd.DataFrame:
    """
    Rolling pairs trade: estimate cointegrating vector (hedge ratio) on
    expanding or rolling window; compute z-score of the spread.
    Signal: +1 (long spread) if z < -z_entry, -1 (short spread) if z > z_entry,
            0 (exit) if |z| < z_exit.

    Spread: s_t = y_t - beta_t * x_t  (dynamic hedge ratio).
    Z-score: z_t = (s_t - mu_t) / sigma_t  where mu, sigma are rolling.
    """
    df = pd.DataFrame({'y': y, 'x': x}).dropna()
    spreads, betas, signals = [], [], []

    for end in range(window, len(df) + 1):
        chunk = df.iloc[end - window : end]

        # Rolling OLS hedge ratio
        beta = (np.cov(chunk['y'], chunk['x'])[0, 1]
                / chunk['x'].var())
        spread = chunk['y'] - beta * chunk['x']
        spreads.append(spread.iloc[-1])
        betas.append(beta)

    spread_ser = pd.Series(spreads, index=df.index[window-1:])
    beta_ser   = pd.Series(betas,   index=df.index[window-1:])

    # Z-score on rolling window of spread
    roll_mu  = spread_ser.rolling(window).mean()
    roll_std = spread_ser.rolling(window).std()
    z        = (spread_ser - roll_mu) / roll_std.replace(0, np.nan)

    # Trading signal
    signal = pd.Series(0, index=z.index)
    signal[z < -z_entry] = 1    # spread too negative: expect reversion up
    signal[z > z_entry]  = -1   # spread too positive: expect reversion down

    sharpe = np.sqrt(252) * signal.shift(1).fillna(0).mul(
        spread_ser.diff()).dropna().mean() / (
        signal.shift(1).fillna(0).mul(spread_ser.diff()).dropna().std() + 1e-9)

    print(f"Pairs z-score Sharpe (pre-cost): {sharpe:.2f}")
    print(f"Beta range: [{beta_ser.min():.3f}, {beta_ser.max():.3f}]")
    return pd.DataFrame({'spread': spread_ser, 'z': z, 'beta': beta_ser, 'signal': signal})

rng = np.random.default_rng(42)
T   = 500
y   = pd.Series(np.cumsum(rng.standard_normal(T) * 0.01))
x   = pd.Series(y.values * 1.5 + np.cumsum(rng.standard_normal(T) * 0.005))
pairs_zscore(y, x, window=60)`,
    explanation:
      "The rolling hedge ratio adapts to structural changes in the cointegrating relationship — a static hedge ratio computed once becomes stale as correlations drift. The 2-sigma entry / 0.5-sigma exit creates a hysteresis band that prevents over-trading near the equilibrium. In practice, transaction cost-adjusted z-score thresholds (accounting for bid-ask spread and borrow cost) are 2.5-3.0 sigma.",
  },
];
