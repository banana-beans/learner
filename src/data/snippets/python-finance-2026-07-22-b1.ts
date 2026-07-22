import type { Snippet } from "./types";

export const pythonFinanceSnippets20260722B1: Snippet[] = [
  {
    id: "pyfin-20260722-b1-pca-yield-curve",
    language: "python",
    title: "PCA on Yield Curve Shifts",
    tag: "finance",
    code: `import numpy as np
from sklearn.decomposition import PCA

# yields: (T, n_maturities) matrix of daily yields
def pca_yield_curve(yields: np.ndarray, n_components: int = 3):
    changes = np.diff(yields, axis=0)
    pca = PCA(n_components=n_components)
    pca.fit(changes)
    explained = pca.explained_variance_ratio_
    loadings = pca.components_   # (n_components, n_maturities)
    scores = pca.transform(changes)  # (T-1, n_components)
    # PC1 ≈ parallel shift, PC2 ≈ slope, PC3 ≈ curvature
    return loadings, scores, explained

loadings, scores, var_explained = pca_yield_curve(yields)
print(f"PC1 explains {var_explained[0]:.1%} of variance")`,
    explanation: "Decomposes yield curve moves into level/slope/curvature factors; the first three PCs typically explain >95% of variance."
  },
  {
    id: "pyfin-20260722-b1-garch-arch",
    language: "python",
    title: "GARCH(1,1) via arch Package",
    tag: "finance",
    code: `from arch import arch_model
import numpy as np

# returns: daily log-return series (percent scale works best for arch)
def fit_garch11(returns: np.ndarray):
    am = arch_model(returns * 100, vol="Garch", p=1, q=1, dist="Normal")
    res = am.fit(disp="off")
    params = res.params        # omega, alpha[1], beta[1]
    cond_vol = res.conditional_volatility / 100  # back to return scale
    # 1-step-ahead forecast
    fc = res.forecast(horizon=1)
    sigma_next = np.sqrt(fc.variance.iloc[-1, 0]) / 100
    return params, cond_vol, sigma_next

params, vol_path, next_vol = fit_garch11(log_returns)
print(f"Next-day vol forecast: {next_vol * np.sqrt(252):.2%} ann.")`,
    explanation: "Uses the arch library's GARCH(1,1) fitter; conditional volatility path and one-step-ahead forecasts drive option hedging decisions."
  },
  {
    id: "pyfin-20260722-b1-heston-mc-py",
    language: "python",
    title: "Heston Stochastic Vol Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def heston_mc(S0, K, T, r, kappa, theta, xi, rho, v0, n_paths=50_000, n_steps=252):
    dt = T / n_steps
    sqrt_dt = np.sqrt(dt)
    S = np.full(n_paths, S0, dtype=float)
    v = np.full(n_paths, v0, dtype=float)
    for _ in range(n_steps):
        z1 = np.random.randn(n_paths)
        z2 = rho * z1 + np.sqrt(1 - rho**2) * np.random.randn(n_paths)
        # Euler-Maruyama on log-price, full truncation on variance
        v_plus = np.maximum(v, 0.0)
        S *= np.exp((r - 0.5 * v_plus) * dt + np.sqrt(v_plus) * sqrt_dt * z1)
        v += kappa * (theta - v_plus) * dt + xi * np.sqrt(v_plus) * sqrt_dt * z2
    payoff = np.maximum(S - K, 0.0)
    price = np.exp(-r * T) * payoff.mean()
    se = payoff.std() / np.sqrt(n_paths) * np.exp(-r * T)
    return price, se`,
    explanation: "Heston MC with full-truncation Euler handles v<0 without bias; rho<0 captures the leverage effect observed in equity vol surfaces."
  },
  {
    id: "pyfin-20260722-b1-cds-hazard-py",
    language: "python",
    title: "CDS Hazard Rate Bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_par_spread(hazard, T, r, R=0.4, dt=0.25):
    """CDS par spread given constant hazard rate."""
    times = np.arange(dt, T + 1e-9, dt)
    disc = np.exp(-r * times)
    surv = np.exp(-hazard * times)
    prot_leg = (1 - R) * np.sum(disc * (np.exp(-hazard*(times-dt)) - surv) )
    prem_leg = dt * np.sum(disc * surv)
    return prot_leg / prem_leg

def bootstrap_hazard(market_spread, T, r, R=0.4):
    """Single-tenor hazard extraction from observed CDS spread."""
    def objective(h):
        return cds_par_spread(h, T, r, R) - market_spread
    return brentq(objective, 1e-6, 5.0)

h5 = bootstrap_hazard(market_spread=0.012, T=5, r=0.04)
print(f"5Y hazard rate: {h5:.4f}  implied PD(5Y): {1-np.exp(-h5*5):.2%}")`,
    explanation: "Solves for the flat hazard rate that reprices a CDS at its market spread; multi-tenor bootstrapping chains these solutions together."
  },
  {
    id: "pyfin-20260722-b1-historical-es",
    language: "python",
    title: "Historical Expected Shortfall (CVaR)",
    tag: "finance",
    code: `import numpy as np

def historical_es(returns: np.ndarray, alpha: float = 0.95) -> dict:
    """Full historical simulation ES — no distributional assumption."""
    sorted_r = np.sort(returns)
    cutoff_idx = int(np.floor(len(sorted_r) * (1 - alpha)))
    var = -sorted_r[cutoff_idx]          # positive loss convention
    tail = sorted_r[:cutoff_idx + 1]     # worst (1-alpha) fraction
    es = -tail.mean()
    return {"VaR": var, "ES": es, "tail_obs": len(tail)}

# Cornish-Fisher adjustment for skew/kurtosis
def cf_var(returns, alpha=0.95):
    mu, sig = returns.mean(), returns.std()
    skew = ((returns - mu)**3).mean() / sig**3
    kurt = ((returns - mu)**4).mean() / sig**4 - 3
    from scipy.stats import norm
    z = norm.ppf(1 - alpha)
    z_cf = z + (z**2 - 1)*skew/6 + (z**3 - 3*z)*kurt/24
    return -(mu + sig * z_cf)

result = historical_es(portfolio_returns)
print(f"VaR(95%): {result['VaR']:.2%}  ES(95%): {result['ES']:.2%}")`,
    explanation: "Historical ES requires no distribution assumption; the Cornish-Fisher expansion adds skew/kurtosis correction for fat-tailed return series."
  },
  {
    id: "pyfin-20260722-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Credit Correlation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_loss(n_obligors, pd, rho, R=0.4, n_sims=100_000):
    """Single-factor Gaussian copula — CDO tranche pricing backbone."""
    # Systematic factor
    Z = np.random.randn(n_sims)
    losses = np.zeros(n_sims)
    thresh = norm.ppf(pd)                # default threshold per obligor
    for _ in range(n_obligors):
        eps = np.random.randn(n_sims)
        x = np.sqrt(rho) * Z + np.sqrt(1 - rho) * eps
        defaults = (x < thresh).astype(float)
        losses += (1 - R) * defaults / n_obligors
    return losses

def tranche_el(losses, attach, detach):
    """Expected loss of a [attach, detach] tranche."""
    tranche_loss = np.clip(losses - attach, 0, detach - attach)
    return tranche_loss.mean() / (detach - attach)

losses = gaussian_copula_loss(n_obligors=125, pd=0.01, rho=0.3)
el_eq = tranche_el(losses, 0.00, 0.03)  # 0-3% equity tranche
print(f"Equity tranche EL: {el_eq:.4f}")`,
    explanation: "The one-factor Gaussian copula is the CDX/iTraxx tranche standard; rho is the compound correlation backed out from market spreads."
  },
  {
    id: "pyfin-20260722-b1-engle-granger",
    language: "python",
    title: "Engle-Granger Cointegration Test",
    tag: "finance",
    code: `import numpy as np
from statsmodels.tsa.stattools import adfuller
from statsmodels.regression.linear_model import OLS
import statsmodels.api as sm

def engle_granger_test(y: np.ndarray, x: np.ndarray):
    """Two-step Engle-Granger cointegration test."""
    # Step 1: regress y on x to get hedge ratio
    X = sm.add_constant(x)
    res = OLS(y, X).fit()
    beta = res.params[1]
    spread = y - beta * x
    # Step 2: ADF on residuals — null is no cointegration
    adf_stat, p_value, _, _, crit_vals, _ = adfuller(spread, maxlag=1)
    cointegrated = p_value < 0.05
    return {
        "beta": beta,
        "spread": spread,
        "adf_stat": adf_stat,
        "p_value": p_value,
        "cointegrated": cointegrated,
        "half_life": -np.log(2) / np.log(1 + res.params[0]) if cointegrated else None,
    }

result = engle_granger_test(log_price_A, log_price_B)
print(f"beta={result['beta']:.3f}  p={result['p_value']:.4f}  cointegrated={result['cointegrated']}")`,
    explanation: "Engle-Granger residual-ADF identifies mean-reverting spreads; half-life from AR(1) on spread sets the signal decay horizon."
  },
  {
    id: "pyfin-20260722-b1-random-forest-alpha",
    language: "python",
    title: "Random Forest Alpha Signal",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit

def rf_alpha_model(df: pd.DataFrame, feature_cols: list, horizon: int = 5):
    """
    Walk-forward RF classifier for next-horizon-day positive return.
    df must have columns in feature_cols plus a 'ret' column.
    """
    df = df.copy()
    df["target"] = (df["ret"].shift(-horizon) > 0).astype(int)
    df.dropna(inplace=True)
    X, y = df[feature_cols].values, df["target"].values
    tscv = TimeSeriesSplit(n_splits=5)
    oof_preds = np.zeros(len(X))
    for train_idx, val_idx in tscv.split(X):
        clf = RandomForestClassifier(n_estimators=200, max_depth=4,
                                     min_samples_leaf=20, random_state=42)
        clf.fit(X[train_idx], y[train_idx])
        oof_preds[val_idx] = clf.predict_proba(X[val_idx])[:, 1]
    df["signal"] = oof_preds
    # Long when signal > 0.55, flat otherwise
    df["position"] = np.where(df["signal"] > 0.55, 1, 0)
    df["strat_ret"] = df["position"].shift(1) * df["ret"]
    sharpe = df["strat_ret"].mean() / df["strat_ret"].std() * np.sqrt(252)
    return df, sharpe`,
    explanation: "Walk-forward cross-validation prevents look-ahead; min_samples_leaf regularises against overfitting on thin tails of the return distribution."
  },
  {
    id: "pyfin-20260722-b1-sabr-calibration",
    language: "python",
    title: "SABR Model Calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """Hagan et al. (2002) SABR implied vol approximation."""
    if abs(F - K) < 1e-12:
        # ATM formula
        log_term = alpha / (F**(1 - beta))
        d = ((1 - beta)**2 / 24 * alpha**2 / F**(2 - 2*beta)
             + 0.25 * rho * beta * nu * alpha / F**(1 - beta)
             + (2 - 3*rho**2) / 24 * nu**2)
        return log_term * (1 + d * T)
    z = nu / alpha * (F * K)**((1 - beta) / 2) * np.log(F / K)
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A = alpha / ((F * K)**((1 - beta) / 2) *
                 (1 + (1-beta)**2/24 * np.log(F/K)**2 + (1-beta)**4/1920 * np.log(F/K)**4))
    B = z / chi
    d = ((1 - beta)**2 / 24 * alpha**2 / (F*K)**(1-beta)
         + 0.25 * rho * beta * nu * alpha / (F*K)**((1-beta)/2)
         + (2 - 3*rho**2) / 24 * nu**2)
    return A * B * (1 + d * T)

def calibrate_sabr(F, T, strikes, market_vols, beta=0.5):
    def obj(params):
        alpha, rho, nu = params
        if nu <= 0 or alpha <= 0 or abs(rho) >= 1:
            return 1e9
        model_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
        return np.sum((model_vols - market_vols)**2)
    res = minimize(obj, x0=[0.2, -0.3, 0.4], method="Nelder-Mead")
    alpha, rho, nu = res.x
    return {"alpha": alpha, "rho": rho, "nu": nu, "beta": beta}`,
    explanation: "SABR is the rate-market standard for smile interpolation; beta is often fixed by convention (0.5 for rates) and alpha/rho/nu are calibrated to market swaption vols."
  },
  {
    id: "pyfin-20260722-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Execution",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss_trajectory(X0, T, N, sigma, gamma, eta, lam):
    """
    Optimal liquidation trajectory minimising E[cost] + lambda * Var[cost].
    X0: initial position, T: horizon, N: time steps.
    gamma: permanent impact, eta: temporary impact, lam: risk aversion.
    """
    tau = T / N
    kappa_sq = lam * sigma**2 / eta
    kappa = np.sqrt(kappa_sq)
    # Position schedule
    j = np.arange(N + 1)
    x = X0 * np.sinh(kappa * (T - j * tau)) / np.sinh(kappa * T)
    trade_list = np.diff(x)          # < 0 means selling
    vwap_shortfall = (
        0.5 * gamma * X0**2
        + eta / tau * np.sum(trade_list**2)
        + 0.5 * lam * sigma**2 * np.sum(x[:-1]**2) * tau
    )
    return x, trade_list, vwap_shortfall

positions, trades, is_cost = almgren_chriss_trajectory(
    X0=1_000_000, T=1.0, N=20, sigma=0.02, gamma=1e-7, eta=1e-6, lam=1e-6
)
print(f"Implementation shortfall: {is_cost:.2f}")`,
    explanation: "Almgren-Chriss balances market impact against timing risk; higher lambda front-loads trades aggressively to reduce variance at the cost of more impact."
  },
  {
    id: "pyfin-20260722-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory / GPD Tail Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses: np.ndarray, threshold_quantile: float = 0.95):
    """Fit Generalised Pareto Distribution to tail exceedances."""
    u = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u
    # MLE via scipy
    xi, loc, sigma = genpareto.fit(exceedances, floc=0)
    # Tail VaR and ES beyond threshold
    n = len(losses)
    n_u = len(exceedances)
    def gpd_var(alpha):
        p = (1 - alpha) * n / n_u
        if xi == 0:
            return u + sigma * np.log(1 / p)
        return u + sigma / xi * ((1/p)**xi - 1)
    def gpd_es(alpha):
        var_a = gpd_var(alpha)
        return (var_a + sigma - xi * u) / (1 - xi)
    return {
        "threshold": u, "xi": xi, "sigma": sigma,
        "VaR_99": gpd_var(0.99), "ES_99": gpd_es(0.99),
    }

result = fit_gpd_tail(portfolio_losses)
print(f"xi={result['xi']:.3f}  VaR(99%)={result['VaR_99']:.4f}  ES(99%)={result['ES_99']:.4f}")`,
    explanation: "GPD tail fitting via Peak-Over-Threshold extrapolates beyond the historical sample; xi>0 signals heavy tails, critical for stress-loss estimation."
  },
  {
    id: "pyfin-20260722-b1-hull-white-trinomial",
    language: "python",
    title: "Hull-White Trinomial Tree",
    tag: "finance",
    code: `import numpy as np

def hull_white_trinomial(a, sigma, T, n_steps, zero_curve_fn):
    """
    Builds a recombining trinomial tree for the Hull-White short rate model.
    zero_curve_fn(t) returns the continuously compounded zero rate to t.
    """
    dt = T / n_steps
    dx = sigma * np.sqrt(3 * dt)
    j_max = int(np.ceil(0.184 / (a * dt)))  # branching boundary
    # Theta calibration to term structure
    def theta(t):
        h = 1e-5
        f = lambda s: -np.log(np.exp(-zero_curve_fn(s)*s))  # inst. forward approx
        fwd = (zero_curve_fn(t+h)*(t+h) - zero_curve_fn(t)*t) / h
        return fwd + a * fwd + sigma**2 / (2*a) * (1 - np.exp(-2*a*t))
    # Transition probabilities for each j-level
    def probs(j):
        eta = -a * j * dx * dt
        if j == j_max:      # upward branching
            return 1/6 + eta*(eta+1)/2, -1/3 - eta, 1/6 + eta*(eta-1)/2
        elif j == -j_max:   # downward branching
            return 1/6 + eta*(eta-1)/2, -1/3 + eta, 1/6 + eta*(eta+1)/2
        else:
            return 1/6+eta**2/2-eta/2, 2/3-eta**2, 1/6+eta**2/2+eta/2
    return dt, dx, j_max, probs, theta`,
    explanation: "Hull-White trinomial trees price Bermudan swaptions and callable bonds exactly on the calibrated term structure; j_max caps the tree to keep probabilities positive."
  },
  {
    id: "pyfin-20260722-b1-inflation-swap",
    language: "python",
    title: "Inflation Swap Pricing (Zero-Coupon)",
    tag: "finance",
    code: `import numpy as np

def zc_inflation_swap_value(
    notional, T, fixed_rate, index_start, index_current,
    nominal_df, real_df
):
    """
    Zero-coupon inflation swap: payer pays fixed, receiver pays CPI growth.
    nominal_df(T): nominal discount factor
    real_df(T):   real (inflation-linked) discount factor
    index_start:  CPI at swap start date
    index_current: current CPI projection to maturity
    """
    # Fixed leg: notional * ((1 + fixed_rate)**T - 1) * df_nominal
    fixed_leg = notional * ((1 + fixed_rate)**T - 1) * nominal_df(T)
    # Inflation leg: notional * (I(T)/I(0) - 1) * df_nominal
    cpi_growth = index_current / index_start - 1
    inflation_leg = notional * cpi_growth * nominal_df(T)
    # NPV from fixed payer's perspective
    npv = inflation_leg - fixed_leg
    # Breakeven inflation rate
    breakeven = (real_df(T) / nominal_df(T))**(-1/T) - 1 if nominal_df(T) > 0 else np.nan
    return {"npv": npv, "breakeven": breakeven}

result = zc_inflation_swap_value(1e6, T=10, fixed_rate=0.025,
    index_start=260.0, index_current=310.0,
    nominal_df=lambda t: np.exp(-0.035*t),
    real_df=lambda t: np.exp(-0.01*t))
print(f"NPV: {result['npv']:,.0f}  Breakeven: {result['breakeven']:.2%}")`,
    explanation: "Zero-coupon inflation swaps exchange fixed accrual for realised CPI growth; breakeven = real/nominal discount ratio reveals the market's inflation expectation."
  },
  {
    id: "pyfin-20260722-b1-convexity-adjustment",
    language: "python",
    title: "Convexity Adjustment: Eurodollar Futures vs FRA",
    tag: "finance",
    code: `import numpy as np

def eurodollar_convexity_adjustment(T1, T2, sigma, a):
    """
    Hull-White convexity adjustment: ED futures rate - FRA rate.
    T1: futures expiry, T2: end of accrual period (T1 + 0.25 typically).
    sigma: short-rate vol, a: mean reversion.
    """
    def B(t1, t2):
        return (1 - np.exp(-a * (t2 - t1))) / a
    def A_sq(t1, t2):
        # Integral of sigma^2 * B(s,t2)^2 ds from 0 to t1
        term1 = sigma**2 / (2*a) * (t2 - t1 - B(t1,t2))
        return term1  # simplified single-factor
    # Convexity adjustment (Kirikos & Novak formula)
    adj = 0.5 * sigma**2 * T1 * T2
    return adj

def futures_implied_fwd(futures_price, T1, T2, sigma, a):
    """Convert Eurodollar futures price to FRA forward rate."""
    futures_rate = (100 - futures_price) / 100
    adj = eurodollar_convexity_adjustment(T1, T2, sigma, a)
    fra_rate = futures_rate - adj
    return fra_rate, adj

fra_rate, adj = futures_implied_fwd(futures_price=94.50, T1=2.0, T2=2.25,
                                     sigma=0.01, a=0.05)
print(f"FRA rate: {fra_rate:.4f}  Convexity adj: {adj*10000:.2f} bps")`,
    explanation: "Eurodollar futures settle daily (marking to market), creating a correlation between futures P&L and discounting that biases the rate upward vs FRA."
  },
  {
    id: "pyfin-20260722-b1-pca-equity",
    language: "python",
    title: "PCA on Equity Returns (Statistical Factors)",
    tag: "finance",
    code: `import numpy as np
from sklearn.decomposition import PCA
import pandas as pd

def equity_pca_factors(returns_df: pd.DataFrame, n_factors: int = 5):
    """
    Extracts statistical risk factors from equity return matrix.
    returns_df: (T, n_stocks) returns, each column is a stock.
    """
    R = returns_df.values
    # Standardise by vol
    vols = R.std(axis=0)
    R_std = R / vols
    pca = PCA(n_factors)
    factors = pca.fit_transform(R_std)      # (T, n_factors) factor returns
    loadings = pca.components_.T * vols[:, None]  # rescale back
    # Idiosyncratic variance
    R_hat = factors @ pca.components_
    residuals = R_std - R_hat
    idio_var = (residuals**2).mean(axis=0)
    # Factor covariance (diagonal, orthogonal by PCA construction)
    factor_cov = np.diag(pca.explained_variance_)
    return {
        "factors": factors,
        "loadings": pd.DataFrame(loadings, index=returns_df.columns),
        "explained": pca.explained_variance_ratio_,
        "idio_var": idio_var,
    }

result = equity_pca_factors(returns_df, n_factors=5)
print(f"5-factor explained variance: {result['explained'].sum():.1%}")`,
    explanation: "Statistical equity factors from PCA serve as a covariance shrinkage; loadings drive portfolio construction and risk attribution in quant equity models."
  },
  {
    id: "pyfin-20260722-b1-ctd-bond",
    language: "python",
    title: "Cheapest-to-Deliver Bond Selection",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bond_price(coupon, T, ytm, freq=2):
    """Flat-yield bond price."""
    periods = int(T * freq)
    c = coupon / freq
    cf = np.full(periods, c)
    cf[-1] += 1.0
    times = np.arange(1, periods+1) / freq
    disc = (1 + ytm/freq)**(-np.arange(1, periods+1))
    return np.sum(cf * disc)

def ctd_analysis(bonds, futures_price, repo_rate, T_delivery):
    """
    Find cheapest-to-deliver bond for a Treasury futures contract.
    bonds: list of dicts with keys 'coupon', 'maturity', 'ytm', 'cf' (conversion factor)
    """
    results = []
    for b in bonds:
        px = bond_price(b["coupon"], b["maturity"], b["ytm"])
        # Carry: accrued during delivery period
        carry = b["coupon"] * T_delivery - px * repo_rate * T_delivery
        implied_repo = (futures_price * b["cf"] + carry - px) / (px * T_delivery)
        delivery_cost = px - futures_price * b["cf"]
        results.append({**b, "price": px, "delivery_cost": delivery_cost,
                         "implied_repo": implied_repo})
    ctd = min(results, key=lambda x: x["delivery_cost"])
    return ctd, results

ctd, all_bonds = ctd_analysis(bond_basket, futures_price=109.25, repo_rate=0.04, T_delivery=0.25)
print(f"CTD coupon={ctd['coupon']:.2%}  delivery_cost={ctd['delivery_cost']:.4f}")`,
    explanation: "The CTD has the lowest delivery cost (price minus futures * CF); the delivery option's value comes from the ability to switch CTD as yields move."
  },
  {
    id: "pyfin-20260722-b1-momentum-tc",
    language: "python",
    title: "Momentum Strategy with Transaction Costs",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def momentum_with_costs(prices: pd.DataFrame, lookback: int = 12,
                         hold: int = 1, tc_bps: float = 10):
    """
    Cross-sectional momentum: long top decile, short bottom decile.
    tc_bps: one-way transaction cost in basis points.
    """
    rets = prices.pct_change()
    tc = tc_bps / 10_000
    # Momentum signal: past lookback-month return (skip last month)
    signal = prices.shift(hold).pct_change(lookback)
    positions = pd.DataFrame(0.0, index=prices.index, columns=prices.columns)
    for dt in signal.index:
        row = signal.loc[dt].dropna()
        if len(row) < 10:
            continue
        q10 = row.quantile(0.9)
        q1 = row.quantile(0.1)
        pos = pd.Series(0.0, index=row.index)
        pos[row >= q10] = 1.0
        pos[row <= q1] = -1.0
        pos /= pos.abs().sum() or 1  # dollar-neutral normalise
        positions.loc[dt] = pos
    # Gross returns
    gross = (positions.shift(1) * rets).sum(axis=1)
    # TC: half-spread on turnover
    turnover = positions.diff().abs().sum(axis=1)
    net = gross - turnover * tc
    sharpe = net.mean() / net.std() * np.sqrt(12)
    return net, sharpe

net_rets, sharpe = momentum_with_costs(price_panel, lookback=12)
print(f"Net Sharpe: {sharpe:.2f}")`,
    explanation: "Cross-sectional momentum loses 30-50% of gross Sharpe to transaction costs at typical institutional scales; turnover normalisation makes cost drag explicit."
  },
  {
    id: "pyfin-20260722-b1-vectorized-greeks",
    language: "python",
    title: "Vectorised Black-Scholes Greeks",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_greeks(S, K, T, r, sigma, flag="c"):
    """
    Vectorised B-S Greeks for arrays of options.
    flag: 'c' for call, 'p' for put.
    """
    S, K, T, r, sigma = map(np.asarray, (S, K, T, r, sigma))
    sqrt_T = np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T
    Nd1 = norm.cdf(d1)
    Nd2 = norm.cdf(d2)
    nd1 = norm.pdf(d1)
    disc = np.exp(-r * T)
    sign = 1 if flag == "c" else -1
    price  = sign * (S * Nd1 - K * disc * Nd2) if flag == "c" \
             else (K * disc * norm.cdf(-d2) - S * norm.cdf(-d1))
    delta  = sign * Nd1 if flag == "c" else sign * (Nd1 - 1)
    gamma  = nd1 / (S * sigma * sqrt_T)
    vega   = S * nd1 * sqrt_T / 100          # per 1 vol point
    theta  = (-(S * nd1 * sigma) / (2 * sqrt_T)
              - sign * r * K * disc * Nd2) / 252   # per day
    rho    = sign * K * T * disc * Nd2 / 100       # per 1% rate move
    return {"price": price, "delta": delta, "gamma": gamma,
            "vega": vega, "theta": theta, "rho": rho}

g = bs_greeks(S=100, K=np.array([95,100,105]), T=0.25, r=0.05, sigma=0.20)
print(f"Delta: {g['delta']}  Gamma: {g['gamma']}")`,
    explanation: "Vectorised Greeks compute the entire strike strip in a single NumPy call; vega/rho are scaled to market conventions (per 1 vol/rate point)."
  },
  {
    id: "pyfin-20260722-b1-credit-spread-bootstrap",
    language: "python",
    title: "Credit Spread Bootstrapping from Bond Prices",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_credit_spreads(bond_maturities, bond_prices, coupons,
                               riskfree_fn, face=100.0):
    """
    Extract a piecewise-constant credit spread curve from corporate bond prices.
    riskfree_fn(t): continuously-compounded risk-free rate at t.
    Returns: list of (maturity, spread) tuples.
    """
    spreads = []
    prev_T = 0.0
    prev_s = 0.0

    for T, px, c in sorted(zip(bond_maturities, bond_prices, coupons)):
        freq = 2
        times = np.arange(1/freq, T + 1e-9, 1/freq)
        cf = np.full_like(times, c / freq * face)
        cf[-1] += face

        def model_price(s_new):
            # Piecewise spread: prev_s up to prev_T, s_new beyond
            disc = np.array([
                np.exp(-(riskfree_fn(t) + (prev_s if t <= prev_T else s_new)) * t)
                for t in times
            ])
            return np.dot(cf, disc)

        s = brentq(lambda s: model_price(s) - px, -0.01, 0.50)
        spreads.append((T, s))
        prev_T, prev_s = T, s

    return spreads

spreads = bootstrap_credit_spreads(
    bond_maturities=[2, 5, 10], bond_prices=[98.5, 95.0, 88.0],
    coupons=[0.04, 0.05, 0.06], riskfree_fn=lambda t: 0.035
)
for T, s in spreads:
    print(f"T={T}Y  credit spread={s*10000:.1f}bps")`,
    explanation: "Bootstrap extracts the issuer's credit spread at each tenor by matching model to market price; the piecewise-constant curve prices new bonds consistently."
  },
  {
    id: "pyfin-20260722-b1-quantlib-european",
    language: "python",
    title: "QuantLib European Option Pricing",
    tag: "finance",
    code: `import QuantLib as ql

def ql_european_option(S, K, r, q, sigma, T_days, option_type="call"):
    """Price a European option using QuantLib's Black-Scholes engine."""
    today = ql.Date.todaysDate()
    expiry = today + ql_days(T_days)
    ql.Settings.instance().evaluationDate = today

    payoff = ql.PlainVanillaPayoff(
        ql.Option.Call if option_type == "call" else ql.Option.Put, K
    )
    exercise = ql.EuropeanExercise(expiry)
    option = ql.VanillaOption(payoff, exercise)

    day_count = ql.Actual365Fixed()
    calendar = ql.NullCalendar()

    spot_handle = ql.QuoteHandle(ql.SimpleQuote(S))
    risk_free = ql.YieldTermStructureHandle(
        ql.FlatForward(today, r, day_count))
    dividend = ql.YieldTermStructureHandle(
        ql.FlatForward(today, q, day_count))
    vol_ts = ql.BlackVolTermStructureHandle(
        ql.BlackConstantVol(today, calendar, sigma, day_count))

    process = ql.BlackScholesMertonProcess(spot_handle, dividend, risk_free, vol_ts)
    option.setPricingEngine(ql.AnalyticEuropeanEngine(process))

    return {"price": option.NPV(), "delta": option.delta(),
            "gamma": option.gamma(), "vega": option.vega(), "theta": option.theta()}

ql_days = lambda d: ql.Period(d, ql.Days)
result = ql_european_option(S=100, K=100, r=0.05, q=0.02, sigma=0.20, T_days=90)
print(f"Price={result['price']:.4f}  Delta={result['delta']:.4f}")`,
    explanation: "QuantLib's AnalyticEuropeanEngine validates against closed-form B-S; the same option object can reprice with a Heston or LV engine by swapping the engine."
  },
  {
    id: "pyfin-20260722-b1-order-flow-imbalance",
    language: "python",
    title: "Order Flow Imbalance (OFI) Signal",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def compute_ofi(tick_df: pd.DataFrame) -> pd.Series:
    """
    Order Flow Imbalance: buy-initiated minus sell-initiated volume.
    tick_df columns: bid_px, ask_px, bid_sz, ask_sz, trade_px, trade_sz, trade_side
    trade_side: +1 = buy (aggressor hits ask), -1 = sell.
    """
    df = tick_df.copy()
    # Lee-Ready classification fallback if side unavailable
    if "trade_side" not in df:
        mid = (df["bid_px"] + df["ask_px"]) / 2
        df["trade_side"] = np.where(df["trade_px"] >= mid, 1, -1)
    # Signed order flow
    df["signed_vol"] = df["trade_sz"] * df["trade_side"]
    # 1-minute bucket OFI
    ofi_1m = df["signed_vol"].resample("1min").sum()
    # Normalise by total volume for comparability
    total_vol = df["trade_sz"].resample("1min").sum().replace(0, np.nan)
    ofi_norm = ofi_1m / total_vol
    return ofi_norm

def ofi_price_impact(tick_df, forward_periods=5):
    """Regress future returns on contemporaneous OFI."""
    ofi = compute_ofi(tick_df)
    mid = ((tick_df["bid_px"] + tick_df["ask_px"]) / 2).resample("1min").last()
    fwd_ret = mid.pct_change(forward_periods).shift(-forward_periods)
    df = pd.DataFrame({"ofi": ofi, "fwd_ret": fwd_ret}).dropna()
    beta = np.cov(df["ofi"], df["fwd_ret"])[0, 1] / df["ofi"].var()
    return beta, df`,
    explanation: "OFI captures the net directional pressure on prices; its linear relationship with short-horizon returns makes it a core microstructure alpha signal."
  },
];
