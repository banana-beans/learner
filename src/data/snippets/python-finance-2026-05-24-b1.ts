import type { Snippet } from "./types";

export const pythonFinanceSnippets20260524B1: Snippet[] = [
  {
    id: "pyfin-20260524-b1-garch",
    language: "python",
    title: "GARCH(1,1) volatility forecasting with arch package",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
# pip install arch
from arch import arch_model

def fit_garch(returns: pd.Series, p: int = 1, q: int = 1) -> dict:
    """
    GARCH(p,q): sigma_t^2 = omega + sum(alpha_i * eps_{t-i}^2) + sum(beta_j * sigma_{t-j}^2)
    GARCH(1,1) captures volatility clustering: high-vol days cluster together.
    Persistence = alpha + beta; if close to 1, vol is highly persistent.
    """
    # Scale returns to percent to improve numerical conditioning
    r_pct = returns * 100.0

    model = arch_model(r_pct, vol='Garch', p=p, q=q, mean='Constant', dist='normal')
    res   = model.fit(disp='off')

    omega, alpha, beta = res.params['omega'], res.params['alpha[1]'], res.params['beta[1]']
    persistence = alpha + beta
    long_run_vol = np.sqrt(omega / (1.0 - persistence)) / 100.0  # back to decimal

    # One-step-ahead conditional vol forecast
    forecast  = res.forecast(horizon=1)
    vol_1d    = float(np.sqrt(forecast.variance.iloc[-1, 0])) / 100.0

    print(f"omega={omega:.6f}  alpha={alpha:.4f}  beta={beta:.4f}")
    print(f"Persistence: {persistence:.4f}  Long-run vol: {long_run_vol:.4f}")
    print(f"1-day conditional vol forecast: {vol_1d:.4f}")

    return {"omega": omega, "alpha": alpha, "beta": beta,
            "persistence": persistence, "vol_forecast_1d": vol_1d,
            "long_run_vol": long_run_vol}

# Quick demo with synthetic returns
rng = np.random.default_rng(42)
r   = pd.Series(rng.standard_normal(500) * 0.01)
fit_garch(r)`,
    explanation:
      "GARCH(1,1) is the workhorse volatility model: it captures clustering (high vol today → high vol tomorrow) via the beta parameter. Persistence α+β close to 1 implies slow mean reversion; for equity returns it is typically 0.97-0.99. Conditional vol forecasts drive dynamic delta-hedging and VaR band widths.",
  },
  {
    id: "pyfin-20260524-b1-cointegration",
    language: "python",
    title: "Engle-Granger cointegration test and spread construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller, coint

def test_cointegration(y: pd.Series, x: pd.Series,
                        significance: float = 0.05) -> dict:
    """
    Engle-Granger (1987) two-step procedure:
    1. Regress y on x (OLS) to find the cointegrating vector beta.
    2. ADF test on the residuals to check stationarity.
    Null hypothesis: no cointegration (residuals are unit-root).
    """
    # Step 1: OLS regression y = alpha + beta * x + e
    X   = sm.add_constant(x.values)
    ols = sm.OLS(y.values, X).fit()
    beta   = ols.params[1]
    alpha  = ols.params[0]
    spread = y - (alpha + beta * x)   # stationary if cointegrated

    # Step 2: ADF on residuals (no constant/trend — already removed by OLS)
    adf_stat, adf_pval, _, _, crit, _ = adfuller(spread, regression='nc')

    # Alternative: use statsmodels coint() for the Engle-Granger t-statistic
    coint_t, coint_p, _ = coint(y, x)

    cointegrated = coint_p < significance

    print(f"OLS beta={beta:.4f}  alpha={alpha:.4f}")
    print(f"ADF stat={adf_stat:.4f}  p-val={adf_pval:.4f}")
    print(f"Coint p-val={coint_p:.4f}  => {'COINTEGRATED' if cointegrated else 'not cointegrated'}")

    return {"beta": beta, "alpha": alpha, "spread": spread,
            "adf_pval": adf_pval, "coint_pval": coint_p,
            "cointegrated": cointegrated}`,
    explanation:
      "Cointegration is the theoretical underpinning of statistical arbitrage: two individually non-stationary series share a long-run equilibrium. The hedge ratio beta from step 1 gives the dollar-neutral spread; the ADF test on the spread validates stationarity. A lower p-value gives stronger evidence for a mean-reverting trading opportunity.",
  },
  {
    id: "pyfin-20260524-b1-local-vol",
    language: "python",
    title: "Dupire local volatility surface from implied vol surface",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(K_grid: np.ndarray, T_grid: np.ndarray,
                      sigma_iv: np.ndarray,   # (n_T, n_K) implied vol surface
                      S0: float, r: float, q: float) -> np.ndarray:
    """
    Dupire (1994) formula: sigma_L^2(K, T) numerator/denominator.
    Numerator:   dC/dT + (r - q)*K*dC/dK + q*C        [time-value growth]
    Denominator: 0.5 * K^2 * d^2C/dK^2                [gamma term]
    Computed via numerical differentiation on the call price surface.

    sigma_iv: implied vols on grid T_grid x K_grid.
    Returns local vol surface sigma_L on the same grid (interior only).
    """
    from scipy.stats import norm

    # Compute call prices from implied vols on the grid
    T2, K2 = np.meshgrid(T_grid, K_grid, indexing='ij')  # (nT, nK)

    sT     = sigma_iv * np.sqrt(T2)
    d1     = (np.log(S0 / K2) + (r - q + 0.5*sigma_iv**2)*T2) / sT
    d2     = d1 - sT
    C      = (S0*np.exp(-q*T2)*norm.cdf(d1)
              - K2*np.exp(-r*T2)*norm.cdf(d2))

    # Numerical derivatives on the call surface
    dC_dT  = np.gradient(C,  T_grid, axis=0)   # (nT, nK)
    dC_dK  = np.gradient(C,  K_grid, axis=1)
    d2C_dK = np.gradient(dC_dK, K_grid, axis=1)

    numer  = dC_dT + (r - q)*K2*dC_dK + q*C
    denom  = 0.5 * K2**2 * d2C_dK

    # Clip to avoid negative local var from numerical noise
    local_var = np.clip(numer / np.where(np.abs(denom) > 1e-8, denom, 1e-8), 1e-6, 4.0)
    return np.sqrt(local_var)   # local vol surface`,
    explanation:
      "Dupire's formula extracts a unique local volatility surface consistent with all observed European option prices — no model choice beyond Markov diffusion. The catch is numerical sensitivity: the second derivative d²C/dK² amplifies interpolation noise, so a smooth parametric vol surface (e.g. SVI) is typically used before applying Dupire.",
  },
  {
    id: "pyfin-20260524-b1-mean-variance",
    language: "python",
    title: "Mean-variance optimisation with cvxpy (long-only)",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def mean_variance_opt(mu: np.ndarray, Sigma: np.ndarray,
                       risk_aversion: float = 1.0,
                       min_wt: float = 0.0,
                       max_wt: float = 1.0) -> np.ndarray:
    """
    Markowitz mean-variance:
    max  w^T mu - (lambda/2) * w^T Sigma w
    s.t. sum(w) = 1,  min_wt <= w <= max_wt

    risk_aversion lambda: 0 = max return, inf = min variance.
    Returns optimal weights.
    """
    n = len(mu)
    w = cp.Variable(n)

    objective = cp.Maximize(
        mu @ w - (risk_aversion / 2.0) * cp.quad_form(w, Sigma)
    )
    constraints = [
        cp.sum(w) == 1.0,
        w >= min_wt,
        w <= max_wt,
    ]
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL, warm_start=True)

    if prob.status not in ("optimal", "optimal_inaccurate"):
        raise RuntimeError(f"Solver failed: {prob.status}")

    weights = np.array(w.value)
    port_ret = float(mu @ weights)
    port_vol = float(np.sqrt(weights @ Sigma @ weights))
    sharpe   = port_ret / port_vol if port_vol > 0 else 0.0

    print(f"Return={port_ret:.4f}  Vol={port_vol:.4f}  Sharpe={sharpe:.4f}")
    for i, wi in enumerate(weights):
        if abs(wi) > 1e-4:
            print(f"  Asset {i}: {wi:.4f}")
    return weights`,
    explanation:
      "cvxpy's disciplined convex programming framework guarantees the solver receives a well-formed QP — no manual KKT conditions needed. The quad_form(w, Sigma) term ensures the covariance matrix enters as a PSD matrix, which CLARABEL exploits for fast convergence. In practice, Sigma is regularised (e.g., Ledoit-Wolf shrinkage) before optimising.",
  },
  {
    id: "pyfin-20260524-b1-black-litterman",
    language: "python",
    title: "Black-Litterman model — blending views with market equilibrium",
    tag: "finance",
    code: `import numpy as np

def black_litterman(Sigma: np.ndarray,
                     w_mkt: np.ndarray,
                     P: np.ndarray,          # (k, n) view matrix
                     Q: np.ndarray,          # (k,) view returns
                     Omega: np.ndarray,      # (k, k) view uncertainty
                     delta: float = 2.5,     # risk-aversion coefficient
                     tau: float = 0.05) -> dict:
    """
    Black-Litterman (1992):
    Prior: pi = delta * Sigma @ w_mkt  (market-implied excess returns)
    Posterior: mu_BL = [(tau*Sigma)^{-1} + P^T Omega^{-1} P]^{-1}
                      @ [(tau*Sigma)^{-1} pi + P^T Omega^{-1} Q]

    P rows encode views: [1, -1, 0, ...] = asset i outperforms asset j by Q[k].
    Omega diagonal uncertainty: large = weak view, small = strong conviction.
    """
    pi  = delta * Sigma @ w_mkt   # market equilibrium expected returns

    tSigma     = tau * Sigma
    tSigma_inv = np.linalg.inv(tSigma)
    Omega_inv  = np.linalg.inv(Omega)

    # Posterior precision matrix
    M     = tSigma_inv + P.T @ Omega_inv @ P
    M_inv = np.linalg.inv(M)

    # Posterior mean
    mu_BL = M_inv @ (tSigma_inv @ pi + P.T @ Omega_inv @ Q)

    # Posterior covariance
    Sigma_BL = Sigma + M_inv

    print("Market-implied returns (pi):", np.round(pi, 4))
    print("BL posterior returns:       ", np.round(mu_BL, 4))
    return {"mu_BL": mu_BL, "Sigma_BL": Sigma_BL, "pi": pi}`,
    explanation:
      "Black-Litterman solves the problem of instability in pure MVO: tiny changes in expected returns produce wild weight swings. By Bayesian-updating from the market equilibrium prior, BL produces diversified portfolios that only deviate from the market cap weights in proportion to the investor's view strength (controlled by Omega).",
  },
  {
    id: "pyfin-20260524-b1-cds-bootstrap",
    language: "python",
    title: "CDS hazard rate bootstrapping from quoted spreads",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard(tenors: np.ndarray,
                      spreads_bps: np.ndarray,
                      lgd: float = 0.60,
                      r: float = 0.04) -> np.ndarray:
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    CDS par spread: S = (LGD * sum(h_i * DF_i * dt)) / (sum(DF_i * survival_i * dt))
    where DF(t) = exp(-r*t) and survival(t) = exp(-H(t)), H = cumulative hazard.
    Bootstraps sequentially: h_1 from 1Y spread, h_2 from 2Y given h_1, etc.
    """
    n_tenors  = len(tenors)
    hazards   = np.zeros(n_tenors)
    cum_haz   = np.zeros(n_tenors + 1)

    def pv_premium(t, h_flat):
        """PV of premium leg per unit notional."""
        dt  = t / 100
        ts  = np.linspace(dt, t, 100)
        H   = h_flat * ts
        DF  = np.exp(-r * ts)
        surv= np.exp(-H)
        return float(np.sum(DF * surv * dt))

    def pv_protection(t, h_flat):
        """PV of protection leg = LGD * integral(h * survival * DF)."""
        dt  = t / 100
        ts  = np.linspace(dt, t, 100)
        H   = h_flat * ts
        DF  = np.exp(-r * ts)
        surv= np.exp(-H)
        return float(lgd * np.sum(h_flat * surv * DF * dt))

    for i, (T, s_bps) in enumerate(zip(tenors, spreads_bps)):
        s = s_bps * 1e-4
        def pnl(h):
            return pv_protection(T, h) - s * pv_premium(T, h)
        hazards[i] = brentq(pnl, 1e-6, 0.5)
        print(f"T={T:.0f}Y: spread={s_bps:.0f}bps  hazard={hazards[i]:.4%}")

    return hazards

tenors  = np.array([1., 3., 5., 7., 10.])
spreads = np.array([50., 80., 120., 150., 180.])
h = bootstrap_hazard(tenors, spreads)`,
    explanation:
      "CDS hazard bootstrapping converts market-quoted spreads into a piecewise-constant hazard (intensity) curve — the credit equivalent of bootstrapping a zero curve from swap rates. The hazard rate h represents the instantaneous default probability per unit time; integrating gives the survival probability S(t) = exp(-∫h dt).",
  },
  {
    id: "pyfin-20260524-b1-antithetic",
    language: "python",
    title: "Antithetic variates — variance reduction for European options",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_exact(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_antithetic(S: float, K: float, r: float, sigma: float, T: float,
                   n: int = 50_000, seed: int = 42) -> dict:
    """
    Antithetic variates: pair each path Z with its mirror -Z.
    Cov(f(Z), f(-Z)) < 0 for monotone f, so the pair average has lower variance.
    var(0.5*(X + X')) = 0.5*var(X) + 0.5*Cov(X, X')  -- Cov is negative.
    Requires 2x fewer paths than plain MC for the same accuracy.
    """
    rng  = np.random.default_rng(seed)
    Z    = rng.standard_normal(n)
    disc = np.exp(-r*T)
    mu   = (r - 0.5*sigma**2)*T
    vol  = sigma * np.sqrt(T)

    ST_pos  = S * np.exp(mu + vol *  Z)
    ST_neg  = S * np.exp(mu + vol * -Z)   # antithetic paths

    pay_pos  = np.maximum(ST_pos - K, 0.0)
    pay_neg  = np.maximum(ST_neg - K, 0.0)
    pair_avg = 0.5 * (pay_pos + pay_neg)  # each pair contributes one estimate

    price_anti  = float(disc * pair_avg.mean())
    price_plain = float(disc * pay_pos.mean())
    exact        = bs_call_exact(S, K, r, sigma, T)

    var_plain = pay_pos.var()
    var_anti  = pair_avg.var()
    print(f"Exact:  {exact:.4f}")
    print(f"Plain:  {price_plain:.4f}  std={np.sqrt(var_plain/n):.5f}")
    print(f"Anti:   {price_anti:.4f}  std={np.sqrt(var_anti/n):.5f}")
    print(f"Variance reduction: {var_plain/var_anti:.1f}x")
    return {"price": price_anti, "var_reduction": var_plain/var_anti}

mc_antithetic(100, 100, 0.05, 0.2, 1.0)`,
    explanation:
      "Antithetic variates exploit the negative correlation between f(Z) and f(-Z) for monotone payoffs: when one path gives a high payoff, its mirror gives a low one. The estimator uses n/2 independent pairs rather than n independent paths, typically achieving 2-10x variance reduction for European calls at zero extra computation.",
  },
  {
    id: "pyfin-20260524-b1-irs-pricing",
    language: "python",
    title: "Interest rate swap pricing (fixed vs floating)",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

def price_irs(notional: float,
               fixed_rate: float,
               tenor_years: float,
               payment_freq: int,           # payments per year
               zero_rates: np.ndarray,      # zero rates at maturities
               maturities: np.ndarray,      # maturities for zero_rates
               receive_fixed: bool = True) -> dict:
    """
    Plain vanilla interest rate swap:
    Fixed leg: pays fixed_rate every 1/freq years.
    Float leg: pays LIBOR/SOFR, valued at par on each reset date.
    Value = PV(fixed) - PV(float) for receive-fixed payer-float.
    PV(float) = notional * (1 - DF(T)) at inception.
    """
    zero_fn = interp1d(maturities, zero_rates, kind='linear',
                        fill_value='extrapolate')

    dt    = 1.0 / payment_freq
    times = np.arange(dt, tenor_years + 1e-9, dt)

    # Discount factors
    DF = np.exp(-zero_fn(times) * times)

    # PV of fixed leg: fixed_rate * notional * dt * sum(DF_i)
    pv_fixed = float(notional * fixed_rate * dt * DF.sum())

    # PV of floating leg: notional * (1 - DF(T)) [valued at par at inception]
    pv_float = float(notional * (1.0 - DF[-1]))

    # Fair swap rate (par rate): s.t. PV(fixed) = PV(float)
    annuity    = float(dt * DF.sum())
    par_rate   = (1.0 - DF[-1]) / annuity

    pv_swap = (pv_fixed - pv_float) if receive_fixed else (pv_float - pv_fixed)

    print(f"PV fixed: {pv_fixed:,.2f}  PV float: {pv_float:,.2f}")
    print(f"Swap PV:  {pv_swap:,.2f}")
    print(f"Par rate: {par_rate:.4%}  (vs fixed rate {fixed_rate:.4%})")
    return {"pv": pv_swap, "par_rate": par_rate, "annuity": annuity}

zero_rates  = np.array([0.04, 0.042, 0.045, 0.046, 0.047])
maturities  = np.array([1.0,  2.0,   3.0,   4.0,   5.0])
price_irs(notional=1e6, fixed_rate=0.044, tenor_years=5, payment_freq=2,
           zero_rates=zero_rates, maturities=maturities)`,
    explanation:
      "The floating leg of an at-market IRS is always worth par at inception — it resets to LIBOR at each payment date, so it's equivalent to investing at the floating rate. The fixed leg is a stream of cash flows discounted at the zero curve. The par swap rate equates PV(fixed) = PV(float), making the swap worth zero at inception.",
  },
  {
    id: "pyfin-20260524-b1-zero-curve-bootstrap",
    language: "python",
    title: "Zero curve bootstrapping from coupon bonds",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_zero_curve(coupon_bonds: list[dict],
                           face: float = 100.0) -> dict:
    """
    Bootstrap the zero/spot rate curve from a set of coupon bonds
    sorted by maturity.  Each bond: {'maturity': T, 'coupon': c, 'price': P, 'freq': m}
    c is annual coupon rate; m is coupons per year.

    Procedure: solve for z(T) given all previously computed z(t < T).
    Price = sum(c/m * exp(-z(t)*t)) + Face * exp(-z(T)*T)
    """
    zero_curve = {}   # maturity -> zero rate

    def df(t):
        """Interpolated discount factor from bootstrapped zeros."""
        if t in zero_curve:
            return np.exp(-zero_curve[t] * t)
        # Linear interpolation in zero rates for intermediate maturities
        ts = sorted(zero_curve.keys())
        if not ts or t < ts[0]:
            return np.exp(-list(zero_curve.values())[0] * t) if zero_curve else 1.0
        for i in range(len(ts)-1):
            if ts[i] <= t <= ts[i+1]:
                z = zero_curve[ts[i]] + (zero_curve[ts[i+1]] - zero_curve[ts[i]]) \
                    * (t - ts[i]) / (ts[i+1] - ts[i])
                return np.exp(-z * t)
        return np.exp(-zero_curve[ts[-1]] * t)

    for bond in sorted(coupon_bonds, key=lambda b: b['maturity']):
        T, c, P, m = bond['maturity'], bond['coupon'], bond['price'], bond['freq']
        dt   = 1.0 / m
        times = np.arange(dt, T, dt)  # coupon dates before maturity

        # PV of intermediate coupons using already-known zeros
        pv_coupons = sum(c/m * face/100 * df(t) for t in times)

        # Solve for the terminal zero rate
        def equation(z):
            last_df  = np.exp(-z * T)
            return pv_coupons + (c/m * face/100 + face) * last_df - P

        z_T = brentq(equation, 0.0, 0.5)
        zero_curve[T] = z_T
        print(f"T={T:.1f}Y  zero={z_T:.4%}")

    return zero_curve

bonds = [
    {'maturity': 0.5, 'coupon': 0.00, 'price': 97.8,  'freq': 2},
    {'maturity': 1.0, 'coupon': 0.02, 'price': 98.5,  'freq': 2},
    {'maturity': 2.0, 'coupon': 0.03, 'price': 98.2,  'freq': 2},
    {'maturity': 5.0, 'coupon': 0.04, 'price': 97.5,  'freq': 2},
]
zc = bootstrap_zero_curve(bonds)`,
    explanation:
      "Zero curve bootstrapping extracts spot rates from coupon bond prices sequentially: the shortest maturity gives z(T1) directly, and each longer maturity uses the previously bootstrapped discount factors to strip the coupon cash flows. The resulting zero curve is used for OIS discounting in derivative pricing.",
  },
  {
    id: "pyfin-20260524-b1-cross-sectional-momentum",
    language: "python",
    title: "Cross-sectional momentum factor construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def cs_momentum_factor(returns: pd.DataFrame,
                         lookback: int = 252,
                         skip: int = 21,
                         top_pct: float = 0.2) -> pd.DataFrame:
    """
    Jegadeesh-Titman (1993) cross-sectional momentum:
    Rank assets by cumulative return over (lookback to skip) days.
    Long top_pct, short bottom_pct by equal-weighting within each group.
    skip=21 avoids the short-term reversal anomaly (first month).
    Returns daily factor portfolio weights: (T, N).
    """
    # Cumulative return from skip to lookback days ago
    cum_ret = (1 + returns.shift(skip)).rolling(lookback - skip).apply(
        np.prod, raw=True
    ) - 1.0   # (T, N)

    n_assets = returns.shape[1]
    n_long   = max(1, int(n_assets * top_pct))

    weights_list = []
    for date in returns.index:
        if date not in cum_ret.index or cum_ret.loc[date].isna().all():
            weights_list.append(pd.Series(0.0, index=returns.columns))
            continue
        ranked = cum_ret.loc[date].rank(ascending=True, na_option='keep')
        w      = pd.Series(0.0, index=returns.columns)
        valid  = ranked.dropna()
        if len(valid) < 2:
            weights_list.append(w)
            continue
        threshold = valid.quantile(1 - top_pct)
        threshold_low = valid.quantile(top_pct)
        w[valid >= threshold]     =  1.0 / n_long
        w[valid <= threshold_low] = -1.0 / n_long
        weights_list.append(w)

    weights = pd.DataFrame(weights_list, index=returns.index)
    factor_ret = (weights.shift(1) * returns).sum(axis=1)
    print(f"Momentum Sharpe: {np.sqrt(252) * factor_ret.mean() / factor_ret.std():.2f}")
    return weights`,
    explanation:
      "Cross-sectional momentum goes long recent winners and short recent losers, rebalancing monthly. The one-month skip avoids the reversal effect: stocks that outperformed last month tend to underperform next month (microstructure-driven), while 2-12 month momentum is persistent. The factor is long/short dollar-neutral with equal weights in each leg.",
  },
  {
    id: "pyfin-20260524-b1-digital-option",
    language: "python",
    title: "Digital (binary) option pricing and Greeks",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def digital_cash_or_nothing(S: float, K: float, r: float, sigma: float,
                              T: float, is_call: bool = True) -> dict:
    """
    Cash-or-nothing digital: pays $1 if S_T > K (call) or S_T < K (put).
    BS price: C_dig = exp(-rT) * N(d2)    for call
              P_dig = exp(-rT) * N(-d2)   for put
    Delta:    dC/dS = exp(-rT) * phi(d2) / (S*sigma*sqrt(T))
    Vega:     dC/dsigma is negative for OTM calls (dangerous near expiry).
    """
    sT     = sigma * np.sqrt(T)
    d1     = (np.log(S/K) + (r + 0.5*sigma**2)*T) / sT
    d2     = d1 - sT
    disc   = np.exp(-r*T)
    phi_d2 = norm.pdf(d2)

    if is_call:
        price = disc * norm.cdf(d2)
        delta = disc * phi_d2 / (S * sT)
        vega  = -disc * phi_d2 * d1 / sigma  # NB: negative
    else:
        price = disc * norm.cdf(-d2)
        delta = -disc * phi_d2 / (S * sT)
        vega  =  disc * phi_d2 * d1 / sigma

    # Greek explosion near expiry: delta -> Dirac spike as T -> 0
    gamma = -disc * phi_d2 * d1 / (S**2 * sT)
    theta = (r * price
             + disc * phi_d2 * (d1/(2*T) - r/(sT)) / (S * sT * (1 if is_call else -1)))

    print(f"{'Call' if is_call else 'Put'} digital: {price:.4f}")
    print(f"Delta: {delta:.4f}  Gamma: {gamma:.4f}  Vega: {vega:.4f}")
    return {"price": price, "delta": delta, "gamma": gamma, "vega": vega}

digital_cash_or_nothing(100, 105, 0.05, 0.2, 0.25)`,
    explanation:
      "Digital options are path-independent but have a Dirac-delta gamma near expiry: for an at-the-money digital, the delta spikes toward infinity as T→0, making hedging practically impossible. Practitioners typically hedge digitals with a call spread — long a tight strike bracket — to replicate the discontinuous payoff smoothly.",
  },
  {
    id: "pyfin-20260524-b1-pandas-multiindex",
    language: "python",
    title: "pandas MultiIndex — portfolio returns by strategy and asset",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Build a MultiIndex DataFrame: (date, strategy, asset)
dates      = pd.date_range('2024-01-01', periods=252, freq='B')
strategies = ['momentum', 'mean_rev', 'carry']
assets     = ['SPX', 'NDX', 'RUT', 'GLD']

rng = np.random.default_rng(42)

# Two-level column MultiIndex
idx    = pd.MultiIndex.from_product([strategies, assets],
                                     names=['strategy', 'asset'])
df     = pd.DataFrame(rng.standard_normal((252, len(idx))) * 0.01,
                       index=dates, columns=idx)

# Cross-section operations via .xs and .loc
spx_ret  = df.xs('SPX', axis=1, level='asset')          # (252, 3) strategies vs dates
mom_ret  = df.xs('momentum', axis=1, level='strategy')  # (252, 4) assets

# Stack/unstack to change shape
stacked  = df.stack(level='strategy')   # (252*3, 4) — strategy as index level
print("Stacked shape:", stacked.shape)

# Portfolio-level Sharpe per strategy (vectorised)
sharpe   = (np.sqrt(252) * df.groupby(level='strategy', axis=1)
                              .mean()
                              .mean(axis=1, level=None))

# Rolling 21-day correlation between strategies (on SPX leg)
roll_corr = spx_ret.rolling(21).corr()   # (252*3, 3) with DatetimeIndex + strategy
print("Rolling corr sample:\\n", roll_corr.iloc[-3:])`,
    explanation:
      "MultiIndex DataFrames are the natural representation for panel data (time × strategy × asset). xs() slices cleanly across any level, stack/unstack reshape for aggregation, and groupby(level=) enables per-strategy statistics without a for-loop. This pattern underlies most production portfolio analytics pipelines.",
  },
  {
    id: "pyfin-20260524-b1-ou-process",
    language: "python",
    title: "Ornstein-Uhlenbeck process — parameter estimation and half-life",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import linregress

def fit_ou_process(spread: np.ndarray, dt: float = 1.0) -> dict:
    """
    OU process: dX = kappa*(mu - X)*dt + sigma*dW
    Discretised as: X_{t+1} - X_t = a + b*X_t + eps
    where a = kappa*mu*dt, b = -kappa*dt, sigma_eps = sigma*sqrt(dt).

    Estimate via OLS on the lagged regression.
    Half-life = ln(2) / kappa — time for spread to halve toward mean.
    """
    X     = spread[:-1]
    dX    = np.diff(spread)

    slope, intercept, r_val, p_val, se = linregress(X, dX)

    b      = slope         # b = -kappa * dt
    a      = intercept     # a = kappa * mu * dt
    kappa  = -b / dt
    mu_est = a / (kappa * dt) if kappa > 1e-8 else float('nan')

    resid     = dX - (a + b * X)
    sigma_est = resid.std() / np.sqrt(dt)
    half_life = np.log(2.0) / kappa if kappa > 0 else float('inf')

    # Equilibrium std of spread: sigma / sqrt(2*kappa)
    eq_std = sigma_est / np.sqrt(2 * kappa) if kappa > 0 else float('inf')

    print(f"kappa={kappa:.4f}  mu={mu_est:.4f}  sigma={sigma_est:.4f}")
    print(f"Half-life: {half_life:.2f} periods  Eq std: {eq_std:.4f}  R²={r_val**2:.3f}")
    return {"kappa": kappa, "mu": mu_est, "sigma": sigma_est,
            "half_life": half_life, "eq_std": eq_std, "r2": r_val**2}

# Simulate an OU spread for demo
rng   = np.random.default_rng(42)
n     = 500
spread = np.zeros(n)
for i in range(1, n):
    spread[i] = spread[i-1] + 0.1*(0.0 - spread[i-1]) + 0.02*rng.standard_normal()
fit_ou_process(spread)`,
    explanation:
      "The OU process is the continuous-time model of mean reversion. The half-life determines the trading frequency: a half-life of 5 days means the spread returns halfway to equilibrium in 5 days — suggesting a 10-20 day hold. Low R² indicates weak mean reversion — most of the spread change is noise, making the signal unreliable.",
  },
  {
    id: "pyfin-20260524-b1-kelly-continuous",
    language: "python",
    title: "Kelly criterion — full, fractional, and multi-asset",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def kelly_single(mu: float, sigma: float, r: float = 0.0) -> float:
    """Full Kelly for a single log-normal asset: f* = (mu - r) / sigma^2."""
    return (mu - r) / sigma**2

def kelly_multiasset(mu: np.ndarray, Sigma: np.ndarray,
                      r: float = 0.0, fraction: float = 1.0) -> np.ndarray:
    """
    Multi-asset Kelly: maximise E[log(1 + f^T * r)] ~ f^T*(mu-r) - 0.5*f^T*Sigma*f
    Analytic solution: f* = Sigma^{-1} * (mu - r)
    fraction < 1 scales down (half-Kelly = fraction 0.5).
    Unconstrained — can go short; clip to long-only if needed.
    """
    f_star = np.linalg.solve(Sigma, mu - r)
    return fraction * f_star

def kelly_constrained(mu: np.ndarray, Sigma: np.ndarray,
                       r: float = 0.0, max_leverage: float = 1.0) -> np.ndarray:
    """
    Kelly with leverage constraint: sum(|f|) <= max_leverage.
    Solved numerically since analytic solution may violate constraint.
    """
    n   = len(mu)
    f0  = np.zeros(n)

    def neg_log_growth(f):
        return -(f @ (mu - r) - 0.5 * f @ Sigma @ f)

    res = minimize(neg_log_growth, f0, method='SLSQP',
                   constraints=[{'type': 'ineq',
                                  'fun': lambda f: max_leverage - np.abs(f).sum()}])
    return res.x

# Example: 3-asset Kelly
mu    = np.array([0.12, 0.09, 0.07])
Sigma = np.array([[0.04, 0.01, 0.005],
                   [0.01, 0.025, 0.005],
                   [0.005, 0.005, 0.01]])
f_full  = kelly_multiasset(mu, Sigma, fraction=1.0)
f_half  = kelly_multiasset(mu, Sigma, fraction=0.5)
print("Full Kelly:", np.round(f_full, 4))
print("Half Kelly:", np.round(f_half, 4))`,
    explanation:
      "Multi-asset Kelly generalises the single-asset formula to Σ⁻¹(μ-r): it optimally allocates across correlated assets. The half-Kelly (fraction=0.5) cuts both leverage and drawdowns — in practice, practitioners use fractions of 0.25-0.5 of full Kelly to account for estimation error in μ and Σ.",
  },
  {
    id: "pyfin-20260524-b1-carry-factor",
    language: "python",
    title: "FX carry factor — long high-yield, short low-yield",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def fx_carry_factor(spot_returns: pd.DataFrame,
                     interest_rates: pd.DataFrame,
                     top_pct: float = 0.33) -> pd.DataFrame:
    """
    FX carry: long currencies with high interest rate differential vs USD,
              short currencies with low (or negative) differential.
    Uncovered interest rate parity predicts this earns zero; empirically
    it earns a positive 'carry' premium (the UIP puzzle).

    spot_returns:  daily % changes in FX vs USD (positive = appreciation)
    interest_rates: daily 3M rates for each currency (annualised, decimal)
    Returns:       daily factor returns and weights.
    """
    n_ccys = spot_returns.shape[1]
    n_long = max(1, int(n_ccys * top_pct))

    # Carry = interest differential + spot change (uncovered)
    dt = 1.0 / 252
    daily_carry = interest_rates * dt  # daily interest income

    # Total carry return (simplified: no forward premium adjustment)
    # In practice use: carry = forward discount - spot change
    total_ret = spot_returns + daily_carry

    # Rank by carry (interest differential alone, ex ante)
    weights_list = []
    for date in interest_rates.index:
        if date not in interest_rates.index:
            weights_list.append(pd.Series(0.0, index=spot_returns.columns))
            continue
        rate_today = interest_rates.loc[date]
        ranked = rate_today.rank(ascending=True)
        w = pd.Series(0.0, index=spot_returns.columns)
        w[ranked >= (n_ccys - n_long + 1)] =  1.0 / n_long
        w[ranked <= n_long]                = -1.0 / n_long
        weights_list.append(w)

    weights     = pd.DataFrame(weights_list, index=interest_rates.index)
    factor_ret  = (weights.shift(1) * spot_returns).sum(axis=1)
    sharpe      = np.sqrt(252) * factor_ret.mean() / factor_ret.std()
    print(f"Carry Sharpe: {sharpe:.2f}")
    return pd.DataFrame({"return": factor_ret, "weights": weights.values.tolist()})`,
    explanation:
      "The FX carry trade goes long high-yield currencies (funded in low-yield currencies) and earns the interest differential as long as exchange rates do not move. It typically delivers a Sharpe of 0.5-1.0 historically but with crash risk: carry unwinds are sudden and correlated (2008, 2015 CHF removal). Risk management via position limits is essential.",
  },
  {
    id: "pyfin-20260524-b1-term-structure-pca",
    language: "python",
    title: "Svensson yield curve model fitting (4-factor extended NS)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson(t: np.ndarray, b0, b1, b2, b3, tau1, tau2) -> np.ndarray:
    """
    Svensson (1994) extension of Nelson-Siegel:
    y(t) = b0 + b1*L1 + b2*L2 + b3*L3
    L1 = (1 - exp(-t/tau1)) / (t/tau1)       # slope
    L2 = L1 - exp(-t/tau1)                    # curvature 1
    L3 = (1 - exp(-t/tau2))/(t/tau2) - exp(-t/tau2)  # curvature 2

    Two curvature terms allow fitting both the belly and the long end independently.
    Used by ECB, Fed, SNB for official yield curve publication.
    """
    e1  = np.exp(-t / tau1)
    e2  = np.exp(-t / tau2)
    L1  = (1.0 - e1) / (t / tau1)
    L2  = L1 - e1
    L3  = (1.0 - e2) / (t / tau2) - e2
    return b0 + b1*L1 + b2*L2 + b3*L3

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> np.ndarray:
    def loss(p):
        b0, b1, b2, b3, tau1, tau2 = p
        if tau1 <= 0 or tau2 <= 0 or tau1 == tau2 or b0 <= 0:
            return 1e12
        fitted = svensson(maturities, b0, b1, b2, b3, tau1, tau2)
        return float(np.sum((fitted - yields)**2) * 1e8)

    best = None
    for _ in range(20):
        x0 = [np.random.uniform(0.02, 0.06), np.random.uniform(-0.03, 0.03),
               np.random.uniform(-0.02, 0.02), np.random.uniform(-0.01, 0.01),
               np.random.uniform(0.5, 3.0), np.random.uniform(1.0, 8.0)]
        res = minimize(loss, x0, method='Nelder-Mead',
                       options={'xatol': 1e-9, 'fatol': 1e-11, 'maxiter': 10000})
        if best is None or res.fun < best.fun:
            best = res

    params = best.x
    fitted = svensson(maturities, *params)
    rmse   = np.sqrt(np.mean((fitted - yields)**2)) * 1e4
    print(f"Svensson RMSE: {rmse:.2f} bps")
    return params

mats   = np.array([0.25, 0.5, 1., 2., 3., 5., 7., 10., 20., 30.])
yields = np.array([0.046, 0.047, 0.048, 0.046, 0.045, 0.044, 0.043, 0.042, 0.040, 0.039])
params = fit_svensson(mats, yields)`,
    explanation:
      "Svensson adds a second curvature term to Nelson-Siegel, capturing the humps at both the short and long end of the yield curve — the 2013 US taper-tantrum curve required exactly this. Multi-start optimisation is essential because the parameter surface has multiple local minima, particularly when tau1 ≈ tau2.",
  },
  {
    id: "pyfin-20260524-b1-rf-alpha",
    language: "python",
    title: "Random forest alpha signal from factor features",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit

def train_rf_alpha(features: pd.DataFrame,
                    returns_fwd: pd.Series,
                    n_splits: int = 5) -> dict:
    """
    Random forest for predicting next-month returns from factor features.
    Walk-forward cross-validation (never leak future data into training).
    Features: momentum, value, quality, sentiment scores (standardised).
    Target:   forward 21-day returns.
    """
    df = features.join(returns_fwd.rename('target')).dropna()
    X  = df.drop(columns='target').values
    y  = df['target'].values

    tscv    = TimeSeriesSplit(n_splits=n_splits)
    ic_list = []     # information coefficient (Spearman rank correlation)
    preds_all = np.zeros(len(y))

    for train_idx, test_idx in tscv.split(X):
        X_tr, X_te = X[train_idx], X[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]

        scaler = StandardScaler()
        X_tr_s = scaler.fit_transform(X_tr)
        X_te_s = scaler.transform(X_te)

        rf = RandomForestRegressor(n_estimators=200, max_depth=5,
                                    min_samples_leaf=20, random_state=42,
                                    n_jobs=-1)
        rf.fit(X_tr_s, y_tr)
        preds = rf.predict(X_te_s)
        preds_all[test_idx] = preds

        from scipy.stats import spearmanr
        ic = spearmanr(preds, y_te).statistic
        ic_list.append(ic)
        print(f"Fold IC: {ic:.3f}")

    mean_ic = np.mean(ic_list)
    ic_ir   = np.mean(ic_list) / (np.std(ic_list) + 1e-8)
    print(f"Mean IC: {mean_ic:.3f}  IC IR: {ic_ir:.2f}")
    return {"mean_ic": mean_ic, "ic_ir": ic_ir, "predictions": preds_all}`,
    explanation:
      "Information coefficient (IC) — the rank correlation between predicted and realised returns — is the standard metric for alpha signal quality. An IC of 0.05 is considered good; IC IR (mean IC / std IC) measures signal consistency across time. Walk-forward CV prevents look-ahead bias, which would otherwise wildly overstate backtested IC.",
  },
  {
    id: "pyfin-20260524-b1-parametric-var",
    language: "python",
    title: "Parametric VaR and ES with correlation adjustments",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, t as student_t

def parametric_var(weights: np.ndarray,
                    mu_daily: np.ndarray,
                    Sigma_daily: np.ndarray,
                    notional: float,
                    confidence: float = 0.99,
                    distribution: str = 'normal',
                    dof: float = 5.0) -> dict:
    """
    Parametric VaR under normal or Student-t portfolio return distribution.
    Portfolio vol: sigma_p = sqrt(w^T Sigma w).
    Normal VaR:    z * sigma_p * notional
    t VaR:         t_quantile(dof) * sqrt((dof-2)/dof) * sigma_p * notional
    ES (CVaR):     phi(z) / (1-confidence) * sigma_p * notional  (normal)
    """
    mu_p    = float(weights @ mu_daily)
    var_p   = float(weights @ Sigma_daily @ weights)
    sigma_p = np.sqrt(var_p)

    if distribution == 'normal':
        z     = norm.ppf(1 - confidence)     # negative (left tail)
        var_n = (-mu_p - z * sigma_p) * notional
        es_n  = ((-mu_p + sigma_p * norm.pdf(z) / (1 - confidence))) * notional
        distrib_label = "Normal"
    else:  # Student-t
        scale = sigma_p * np.sqrt((dof - 2.0) / dof)  # calibrated to same var
        z     = student_t.ppf(1 - confidence, dof)
        var_n = (-mu_p - z * scale) * notional
        # t-ES: E[-X | X < VaR/n] = (pdf(z,dof) / ((1-conf)*dof)) * (dof + z^2)/(dof-1) * scale
        pdf_z = student_t.pdf(z, dof)
        es_n  = (-mu_p + scale * pdf_z / (1 - confidence) * (dof + z**2) / (dof - 1)) * notional
        distrib_label = f"Student-t(dof={dof:.0f})"

    print(f"[{distrib_label}] Portfolio vol: {sigma_p:.4f}")
    print(f"  VaR({int(confidence*100)}%): \${var_n:,.0f}")
    print(f"  ES({int(confidence*100)}%):  \${es_n:,.0f}")
    return {"var": var_n, "es": es_n, "sigma_p": sigma_p}`,
    explanation:
      "Parametric VaR assumes returns are elliptically distributed; the Student-t version captures fat tails by using a heavier-tailed quantile. Under Basel III (FRTB), the ES at 97.5% confidence replaced 99% VaR because ES penalises losses beyond the quantile rather than ignoring them — it is sub-additive and thus more conservative for diversified portfolios.",
  },
  {
    id: "pyfin-20260524-b1-backtesting-metrics",
    language: "python",
    title: "Comprehensive backtest performance metrics",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def backtest_metrics(returns: pd.Series,
                      rf_daily: float = 0.04/252) -> dict:
    """
    Standard quant interview backtest metrics.
    All annualised assuming 252 trading days.
    """
    r    = returns.dropna()
    n    = len(r)
    ann  = 252

    # Return metrics
    total_ret  = float((1 + r).prod() - 1.0)
    cagr       = float((1 + total_ret) ** (ann / n) - 1.0)
    avg_ret    = float(r.mean() * ann)
    volatility = float(r.std(ddof=1) * np.sqrt(ann))

    # Risk-adjusted
    sharpe     = float((r.mean() - rf_daily) / r.std(ddof=1) * np.sqrt(ann))
    sortino_d  = r[r < 0].std(ddof=1)
    sortino    = float((r.mean() - rf_daily) / sortino_d * np.sqrt(ann)) if sortino_d > 0 else np.inf

    # Drawdown
    cumulative = (1 + r).cumprod()
    rolling_max = cumulative.cummax()
    drawdown    = (cumulative - rolling_max) / rolling_max
    max_dd      = float(drawdown.min())

    # Calmar and tail metrics
    calmar     = cagr / abs(max_dd) if max_dd != 0 else np.inf
    skew       = float(r.skew())
    kurt       = float(r.kurtosis())   # excess kurtosis
    var_95     = float(r.quantile(0.05) * np.sqrt(ann))
    hit_rate   = float((r > 0).mean())
    avg_win    = float(r[r > 0].mean())
    avg_loss   = float(r[r < 0].mean())
    profit_factor = float(-avg_win / avg_loss) if avg_loss < 0 else np.inf

    metrics = {
        "CAGR": f"{cagr:.2%}", "Sharpe": f"{sharpe:.2f}", "Sortino": f"{sortino:.2f}",
        "Calmar": f"{calmar:.2f}", "MaxDD": f"{max_dd:.2%}", "Ann Vol": f"{volatility:.2%}",
        "Skew": f"{skew:.2f}", "ExcessKurt": f"{kurt:.2f}",
        "HitRate": f"{hit_rate:.2%}", "ProfitFactor": f"{profit_factor:.2f}",
    }
    for k, v in metrics.items():
        print(f"  {k:>15}: {v}")
    return metrics`,
    explanation:
      "The Calmar ratio (CAGR / max drawdown) is preferred over Sharpe for trend-following strategies because it captures how much return you earned per unit of peak-to-trough pain. Profit factor (avg win / avg loss) and hit rate together determine long-run profitability: a strategy can be profitable with a 40% hit rate if avg_win ≫ avg_loss.",
  },
];
