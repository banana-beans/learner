import type { Snippet } from "./types";

export const pythonFinanceSnippets20260704B1: Snippet[] = [
  {
    id: "pyfin-20260704-b1-mean-variance-frontier",
    language: "python",
    title: "Mean-Variance Efficient Frontier via SciPy",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def efficient_frontier(mu: np.ndarray, sigma: np.ndarray, n_points: int = 50):
    n = len(mu)
    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1}]
    bounds = [(0, 1)] * n

    target_returns = np.linspace(mu.min(), mu.max(), n_points)
    vols = []
    for r_target in target_returns:
        cons = constraints + [{"type": "eq", "fun": lambda w, r=r_target: w @ mu - r}]
        res = minimize(
            lambda w: w @ sigma @ w,
            x0=np.ones(n) / n,
            method="SLSQP",
            bounds=bounds,
            constraints=cons,
        )
        vols.append(np.sqrt(res.fun) if res.success else np.nan)
    return target_returns, np.array(vols)`,
    explanation:
      "Traces the Markowitz bullet by minimizing portfolio variance at each target return; the lower envelope is the efficient frontier. Long-only constraint (bounds) eliminates short-selling — remove it to get the unconstrained hyperbola.",
  },
  {
    id: "pyfin-20260704-b1-cvxpy-longonly",
    language: "python",
    title: "Long-Only Max-Sharpe Portfolio via CVXPY",
    tag: "finance",
    code: `import cvxpy as cp
import numpy as np

def max_sharpe(mu: np.ndarray, sigma: np.ndarray, rf: float = 0.0):
    # Parametric trick: maximize mu^T y  s.t. y^T Sigma y <= 1, sum(y) = kappa
    n = len(mu)
    y = cp.Variable(n, nonneg=True)
    kappa = cp.Variable(nonneg=True)
    objective = cp.Maximize((mu - rf) @ y)
    constraints = [
        cp.quad_form(y, sigma) <= 1,
        cp.sum(y) == kappa,
    ]
    cp.Problem(objective, constraints).solve(solver=cp.CLARABEL)
    w = y.value / kappa.value
    sharpe = (w @ mu - rf) / np.sqrt(w @ sigma @ w)
    return w, sharpe`,
    explanation:
      "Reformulates the fractional max-Sharpe program as a conic QCQP using the Charnes-Cooper variable substitution y = w/kappa, making it directly solvable by CVXPY without non-convex ratio objectives.",
  },
  {
    id: "pyfin-20260704-b1-garch11",
    language: "python",
    title: "GARCH(1,1) MLE Estimation with NumPy",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def fit_garch11(returns: np.ndarray):
    def neg_log_likelihood(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        T = len(returns)
        sigma2 = np.empty(T)
        sigma2[0] = np.var(returns)
        for t in range(1, T):
            sigma2[t] = omega + alpha * returns[t - 1] ** 2 + beta * sigma2[t - 1]
        ll = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + returns ** 2 / sigma2)
        return -ll

    res = minimize(
        neg_log_likelihood,
        x0=[1e-6, 0.1, 0.85],
        method="L-BFGS-B",
        bounds=[(1e-8, None), (0, 1), (0, 1)],
    )
    omega, alpha, beta = res.x
    return {"omega": omega, "alpha": alpha, "beta": beta,
            "persistence": alpha + beta,
            "long_run_var": omega / (1 - alpha - beta)}`,
    explanation:
      "Pure-NumPy GARCH(1,1) MLE via Gaussian log-likelihood; persistence alpha+beta near 1 signals long memory in volatility. The long-run variance omega/(1-alpha-beta) is the unconditional variance the process reverts to.",
  },
  {
    id: "pyfin-20260704-b1-engle-granger",
    language: "python",
    title: "Engle-Granger Cointegration and Spread Z-Score",
    tag: "finance",
    code: `import numpy as np
from statsmodels.regression.linear_model import OLS
from statsmodels.tsa.stattools import adfuller

def engle_granger_pairs(y1: np.ndarray, y2: np.ndarray):
    # Step 1: OLS regression to find hedge ratio
    beta = OLS(y1, np.column_stack([np.ones(len(y2)), y2])).fit().params[1]
    spread = y1 - beta * y2

    # Step 2: ADF test on residuals
    adf_stat, adf_pval, *_ = adfuller(spread, maxlags=1, autolag=None)

    zscore = (spread - spread.mean()) / spread.std()
    return {
        "beta": beta,
        "spread": spread,
        "adf_stat": adf_stat,
        "adf_pval": adf_pval,
        "cointegrated": adf_pval < 0.05,
        "zscore": zscore,
    }`,
    explanation:
      "Two-step EG test: regress y1 on y2 to extract the cointegrating vector (hedge ratio beta), then apply ADF to the residuals — if they're stationary (p<0.05) the pair shares a long-run equilibrium. Trade when |z| > 2, exit at 0.",
  },
  {
    id: "pyfin-20260704-b1-rf-alpha-signal",
    language: "python",
    title: "Random Forest Alpha Signal with Feature Importance",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit

def rf_alpha_signal(df: pd.DataFrame, feature_cols: list, target_col: str):
    X = df[feature_cols].values
    y = (df[target_col].shift(-1) > 0).astype(int).values[:-1]
    X = X[:-1]

    tscv = TimeSeriesSplit(n_splits=5)
    oos_preds = np.full(len(y), np.nan)

    for train_idx, test_idx in tscv.split(X):
        clf = RandomForestClassifier(
            n_estimators=200, max_depth=4,
            min_samples_leaf=20, random_state=42
        )
        clf.fit(X[train_idx], y[train_idx])
        oos_preds[test_idx] = clf.predict_proba(X[test_idx])[:, 1]

    clf.fit(X, y)
    importance = dict(zip(feature_cols, clf.feature_importances_))
    return oos_preds, importance`,
    explanation:
      "Walk-forward cross-validation with TimeSeriesSplit prevents look-ahead leak — each fold only trains on past data. max_depth=4 and min_samples_leaf=20 regularize heavily to prevent overfitting on financial noise.",
  },
  {
    id: "pyfin-20260704-b1-fama-french-3factor",
    language: "python",
    title: "Fama-French 3-Factor Regression and Alpha Extraction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.regression.linear_model import OLS
import statsmodels.api as sm

def fama_french_3factor(
    portfolio_ret: pd.Series,
    mkt_rf: pd.Series,
    smb: pd.Series,
    hml: pd.Series,
    rf: pd.Series,
):
    excess = portfolio_ret - rf
    X = sm.add_constant(pd.concat([mkt_rf, smb, hml], axis=1))
    X.columns = ["const", "MKT-RF", "SMB", "HML"]
    res = OLS(excess, X).fit(cov_type="HAC", cov_kwds={"maxlags": 12})
    alpha_annualized = res.params["const"] * 252
    return {
        "alpha": res.params["const"],
        "alpha_annualized": alpha_annualized,
        "beta_mkt": res.params["MKT-RF"],
        "beta_smb": res.params["SMB"],
        "beta_hml": res.params["HML"],
        "t_alpha": res.tvalues["const"],
        "r_squared": res.rsquared,
        "summary": res.summary(),
    }`,
    explanation:
      "HAC (Newey-West) standard errors correct for autocorrelation and heteroskedasticity in return series; maxlags=12 is the Newey-West rule of thumb for monthly data. Alpha is annualized by multiplying the daily intercept by 252.",
  },
  {
    id: "pyfin-20260704-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Term Structure Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel_yield(tau: np.ndarray, beta0, beta1, beta2, lam):
    factor = (1 - np.exp(-tau / lam)) / (tau / lam)
    return beta0 + beta1 * factor + beta2 * (factor - np.exp(-tau / lam))

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray):
    def objective(params):
        beta0, beta1, beta2, lam = params
        if lam <= 0:
            return 1e10
        fitted = nelson_siegel_yield(maturities, beta0, beta1, beta2, lam)
        return np.sum((yields - fitted) ** 2)

    res = minimize(
        objective,
        x0=[0.05, -0.02, 0.01, 2.0],
        method="Nelder-Mead",
    )
    b0, b1, b2, lam = res.x
    return {"beta0": b0, "beta1": b1, "beta2": b2, "lambda": lam,
            "fitted": nelson_siegel_yield(maturities, b0, b1, b2, lam)}`,
    explanation:
      "beta0 is the long-run level, beta1 controls slope (short minus long rate), beta2 creates the hump; lambda determines where the hump peaks. Widely used by central banks for yield curve smoothing.",
  },
  {
    id: "pyfin-20260704-b1-cds-hazard-bootstrap",
    language: "python",
    title: "CDS Hazard Rate Bootstrap from Spread Curve",
    tag: "finance",
    code: `import numpy as np

def bootstrap_hazard_rates(
    tenors: np.ndarray,    # years: [1, 3, 5, 7, 10]
    spreads: np.ndarray,   # annual spread in decimal
    recovery: float = 0.4,
    dt: float = 0.25,      # quarterly accrual
):
    hazards = []
    survival = [1.0]
    discount = lambda t: np.exp(-0.04 * t)  # flat 4% risk-free

    prev_t = 0.0
    for i, T in enumerate(tenors):
        s = spreads[i]
        times = np.arange(prev_t + dt, T + 1e-9, dt)

        def pv_equations(h):
            lam = h
            prem_leg = sum(
                s * dt * np.exp(-lam * t) * discount(t) for t in times
            )
            prot_leg = sum(
                (1 - recovery) * (np.exp(-lam * (t - dt)) - np.exp(-lam * t)) * discount(t)
                for t in times
            )
            return prem_leg - prot_leg

        from scipy.optimize import brentq
        h = brentq(pv_equations, 1e-6, 5.0)
        hazards.append(h)
        prev_t = T

    return np.array(hazards)`,
    explanation:
      "Bootstraps piecewise-constant hazard rates by equating PV(premium leg) = PV(protection leg) at each maturity; Brent's method solves the nonlinear equation analytically. The survival probability decays as exp(-lambda*t).",
  },
  {
    id: "pyfin-20260704-b1-cir-model",
    language: "python",
    title: "Cox-Ingersoll-Ross Short Rate Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def cir_simulate(
    r0: float, kappa: float, theta: float, sigma: float,
    T: float, n_steps: int, n_paths: int, seed: int = 0
):
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    paths = np.zeros((n_paths, n_steps + 1))
    paths[:, 0] = r0

    sqrt_dt = np.sqrt(dt)
    for t in range(n_steps):
        r = paths[:, t]
        r_pos = np.maximum(r, 0.0)  # reflection to keep r >= 0
        dW = rng.standard_normal(n_paths) * sqrt_dt
        dr = kappa * (theta - r_pos) * dt + sigma * np.sqrt(r_pos) * dW
        paths[:, t + 1] = r_pos + dr

    # Zero-coupon bond price P(0,T) = E[exp(-integral r dt)]
    integrals = paths[:, 1:].mean(axis=1) * T
    zcb_price = np.exp(-integrals).mean()
    return paths, zcb_price`,
    explanation:
      "Euler-Maruyama discretization of CIR with full truncation (max(r,0)) keeps rates non-negative — the Feller condition 2*kappa*theta >= sigma^2 ensures continuous non-negativity but is not always satisfied in calibrated models.",
  },
  {
    id: "pyfin-20260704-b1-asian-geometric",
    language: "python",
    title: "Asian Geometric Option Closed-Form (Kemna-Vorst)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def asian_geometric_call(S: float, K: float, T: float, r: float,
                          sigma: float, n: int) -> float:
    """Closed-form price for geometric-average Asian call (Kemna-Vorst)."""
    sigma_g = sigma * np.sqrt((2 * n + 1) / (6 * (n + 1)))
    r_g = 0.5 * (r - 0.5 * sigma ** 2 + sigma_g ** 2)

    d1 = (np.log(S / K) + (r_g + 0.5 * sigma_g ** 2) * T) / (sigma_g * np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)

    price = np.exp(-r * T) * (
        S * np.exp(r_g * T) * norm.cdf(d1) - K * norm.cdf(d2)
    )
    return price`,
    explanation:
      "The geometric mean of lognormals is lognormal, enabling a Black-Scholes analogue with adjusted vol sigma_g and drift r_g. Used as control variate baseline when pricing arithmetic Asians by MC — subtract geometric MC price, add analytic value.",
  },
  {
    id: "pyfin-20260704-b1-sabr-calibration",
    language: "python",
    title: "SABR Model Hagan Approximation and Calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    if abs(F - K) < 1e-8:
        FK = F
        mid = alpha / (FK ** (1 - beta))
        term1 = ((1 - beta) ** 2 / 24) * alpha ** 2 / FK ** (2 - 2 * beta)
        term2 = 0.25 * rho * beta * nu * alpha / FK ** (1 - beta)
        term3 = (2 - 3 * rho ** 2) / 24 * nu ** 2
        return mid * (1 + (term1 + term2 + term3) * T)

    log_fk = np.log(F / K)
    FK_mid = (F * K) ** ((1 - beta) / 2)
    z = nu / alpha * FK_mid * log_fk
    x = np.log((np.sqrt(1 - 2 * rho * z + z ** 2) + z - rho) / (1 - rho))
    return (alpha / (FK_mid * (1 + (1 - beta) ** 2 / 24 * log_fk ** 2 +
            (1 - beta) ** 4 / 1920 * log_fk ** 4)) * (z / x) *
            (1 + ((1 - beta) ** 2 / 24 * alpha ** 2 / FK_mid ** 2 +
             0.25 * rho * beta * nu * alpha / FK_mid +
             (2 - 3 * rho ** 2) / 24 * nu ** 2) * T))

def calibrate_sabr(F, strikes, T, market_vols, beta=0.5):
    def obj(params):
        alpha, rho, nu = params
        if nu <= 0 or not -1 < rho < 1 or alpha <= 0:
            return 1e10
        model_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
        return np.sum((model_vols - market_vols) ** 2)

    res = minimize(obj, x0=[0.3, -0.3, 0.4], method="Nelder-Mead")
    return {"alpha": res.x[0], "beta": beta, "rho": res.x[1], "nu": res.x[2]}`,
    explanation:
      "Hagan's 2002 asymptotic approximation gives implied vol directly from SABR parameters; the ATM case is handled separately to avoid 0/0. beta=0.5 (CIR backbone) is typical for rates; beta=1 (lognormal) suits equities.",
  },
  {
    id: "pyfin-20260704-b1-antithetic-variates",
    language: "python",
    title: "Antithetic Variates Variance Reduction for MC",
    tag: "finance",
    code: `import numpy as np

def bs_call_antithetic(S: float, K: float, T: float, r: float,
                        sigma: float, n_paths: int, seed: int = 0) -> dict:
    rng = np.random.default_rng(seed)
    Z = rng.standard_normal(n_paths // 2)

    def payoff(z):
        ST = S * np.exp((r - 0.5 * sigma ** 2) * T + sigma * np.sqrt(T) * z)
        return np.maximum(ST - K, 0.0) * np.exp(-r * T)

    pay_pos = payoff(Z)
    pay_neg = payoff(-Z)
    combined = (pay_pos + pay_neg) / 2

    price = combined.mean()
    se_naive = pay_pos.std() / np.sqrt(len(pay_pos))
    se_anti = combined.std() / np.sqrt(len(combined))
    return {"price": price, "se_naive": se_naive, "se_antithetic": se_anti,
            "variance_reduction": 1 - (se_anti / se_naive) ** 2}`,
    explanation:
      "Antithetic variates pairs each random draw Z with -Z; if payoff(Z) is high, payoff(-Z) is low, creating negative correlation that cancels variance. Halves the sample size needed; variance reduction is highest when payoff is monotone in Z.",
  },
  {
    id: "pyfin-20260704-b1-control-variates",
    language: "python",
    title: "Control Variates MC Using Geometric Asian as Control",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def asian_arithmetic_cv(S, K, T, r, sigma, n_steps, n_paths, seed=0):
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    Z = rng.standard_normal((n_paths, n_steps))
    increments = (r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * Z
    log_paths = np.log(S) + np.cumsum(increments, axis=1)
    paths = np.exp(log_paths)

    arith_avg = paths.mean(axis=1)
    geom_avg = np.exp(log_paths.mean(axis=1))

    pay_arith = np.maximum(arith_avg - K, 0) * np.exp(-r * T)
    pay_geom = np.maximum(geom_avg - K, 0) * np.exp(-r * T)

    # Closed-form geometric price (Kemna-Vorst)
    n = n_steps
    sigma_g = sigma * np.sqrt((2*n+1)/(6*(n+1)))
    r_g = 0.5*(r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    geom_exact = np.exp(-r*T)*(S*np.exp(r_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

    # OLS optimal coefficient
    c = np.cov(pay_arith, pay_geom)[0,1] / np.var(pay_geom)
    cv_price = pay_arith - c * (pay_geom - geom_exact)
    return {"price": cv_price.mean(), "se": cv_price.std() / np.sqrt(n_paths),
            "c_star": c}`,
    explanation:
      "The optimal control coefficient c* = Cov(Y,X)/Var(X) minimizes variance of Y - c*(X - E[X]); here X is the geometric Asian payoff whose exact expectation E[X] we know. Variance reduction factor is 1 - corr(arith, geom)^2.",
  },
  {
    id: "pyfin-20260704-b1-historical-var-evt",
    language: "python",
    title: "Historical VaR with EVT Pareto Tail Extension",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto

def historical_var_evt(returns: np.ndarray, confidence: float = 0.99,
                       threshold_pct: float = 0.90):
    losses = -returns
    threshold = np.quantile(losses, threshold_pct)
    tail = losses[losses > threshold] - threshold

    # Fit Generalized Pareto Distribution to tail exceedances
    xi, loc, beta = genpareto.fit(tail, floc=0)

    n = len(losses)
    n_u = len(tail)
    p = 1 - confidence

    # GPD quantile formula
    var_gpd = threshold + (beta / xi) * (((n / n_u) * p) ** (-xi) - 1)
    var_hist = np.quantile(losses, confidence)

    # Expected Shortfall from GPD
    es_gpd = (var_gpd + beta - xi * threshold) / (1 - xi)

    return {
        "var_historical": var_hist,
        "var_evt": var_gpd,
        "es_evt": es_gpd,
        "gpd_xi": xi,
        "gpd_beta": beta,
    }`,
    explanation:
      "Historical VaR is non-parametric but extrapolates poorly beyond observed data; EVT/GPD fits only the tail exceedances above a high threshold, giving a principled extreme quantile estimate. xi > 0 (heavy tail) is typical for equity returns.",
  },
  {
    id: "pyfin-20260704-b1-kelly-multiasset",
    language: "python",
    title: "Fractional Kelly Criterion for Multi-Asset Portfolio",
    tag: "finance",
    code: `import numpy as np

def kelly_weights(mu: np.ndarray, sigma: np.ndarray,
                  rf: float = 0.0, fraction: float = 0.5) -> dict:
    """Full Kelly: f* = Sigma^{-1} (mu - rf); fractional Kelly scales by fraction."""
    excess = mu - rf
    sigma_inv = np.linalg.inv(sigma)
    f_full = sigma_inv @ excess

    f_fractional = fraction * f_full
    expected_growth = (f_fractional @ excess
                       - 0.5 * f_fractional @ sigma @ f_fractional)

    leverage = f_fractional.sum()
    return {
        "kelly_weights": f_fractional,
        "full_kelly": f_full,
        "leverage": leverage,
        "expected_log_growth": expected_growth,
        "sharpe_fraction": fraction,
    }`,
    explanation:
      "Full Kelly maximizes expected log wealth but requires perfect parameter estimation — in practice it leads to catastrophic drawdowns. Half-Kelly (fraction=0.5) is a standard pragmatic choice: it gives 75% of the Sharpe ratio for 50% of the max drawdown.",
  },
  {
    id: "pyfin-20260704-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Execution Trajectory",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X: float,      # shares to liquidate
    T: float,      # liquidation horizon (days)
    n: int,        # number of time steps
    eta: float,    # temporary impact coefficient
    gamma: float,  # permanent impact coefficient
    sigma: float,  # daily vol ($/share)
    lam: float,    # risk aversion
) -> dict:
    tau = T / n
    kappa2 = lam * sigma**2 / eta
    kappa = np.sqrt(kappa2)

    t = np.linspace(0, T, n + 1)
    # Optimal inventory trajectory
    x_t = X * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)
    # Optimal trade sizes
    v_t = np.diff(x_t) / tau  # shares/day (negative = selling)

    expected_cost = (0.5 * gamma * X**2
                     + eta * X**2 * kappa / (2 * np.tanh(0.5 * kappa * T))
                     * (np.cosh(kappa * T) / np.sinh(kappa * T)))
    return {"times": t, "inventory": x_t, "trade_rate": v_t,
            "expected_cost": expected_cost}`,
    explanation:
      "Almgren-Chriss assumes linear market impact: temporary (eta) affects only the trade, permanent (gamma) shifts the price permanently. Higher risk aversion lambda front-loads trading to reduce variance; kappa is the 'urgency' parameter.",
  },
  {
    id: "pyfin-20260704-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model Regime Detection with hmmlearn",
    tag: "finance",
    code: `import numpy as np
from hmmlearn.hmm import GaussianHMM

def fit_hmm_regimes(returns: np.ndarray, n_states: int = 2, seed: int = 42):
    obs = returns.reshape(-1, 1)
    model = GaussianHMM(
        n_components=n_states,
        covariance_type="full",
        n_iter=200,
        random_state=seed,
    )
    model.fit(obs)
    hidden_states = model.predict(obs)

    regime_stats = {}
    for s in range(n_states):
        mask = hidden_states == s
        regime_stats[s] = {
            "mean": returns[mask].mean() * 252,
            "vol": returns[mask].std() * np.sqrt(252),
            "frequency": mask.mean(),
        }
    return {
        "states": hidden_states,
        "transition_matrix": model.transmat_,
        "means": model.means_.flatten(),
        "regime_stats": regime_stats,
    }`,
    explanation:
      "Gaussian HMM identifies latent bull/bear regimes from return distributions; the transition matrix gives persistence probabilities (diagonal entries close to 1 = sticky regimes). BIC comparison across n_states values is used for model selection.",
  },
  {
    id: "pyfin-20260704-b1-multiindex-analytics",
    language: "python",
    title: "Pandas Multi-Index Portfolio Analytics",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

def portfolio_analytics_multiindex(positions: pd.DataFrame) -> pd.DataFrame:
    """positions: columns = [date, ticker, sector, quantity, price]"""
    positions = positions.copy()
    positions["market_value"] = positions["quantity"] * positions["price"]
    positions["pnl_daily"] = positions.groupby("ticker")["market_value"].diff()

    mi = positions.set_index(["date", "sector", "ticker"])

    # Sector-level aggregation
    sector_mv = mi["market_value"].groupby(level=["date", "sector"]).sum()
    sector_pnl = mi["pnl_daily"].groupby(level=["date", "sector"]).sum()

    # Total portfolio
    total_mv = mi["market_value"].groupby(level="date").sum()

    # Sector weights
    weights = sector_mv / total_mv

    result = pd.concat(
        [sector_mv.rename("market_value"), sector_pnl.rename("pnl"),
         weights.rename("weight")],
        axis=1,
    )
    return result`,
    explanation:
      "Multi-index groupby enables simultaneous aggregation at multiple hierarchy levels (date+sector, date-only) without reshaping; the diff() for daily P&L must be computed within each ticker group to avoid cross-ticker contamination.",
  },
  {
    id: "pyfin-20260704-b1-lognormal-moment-matching",
    language: "python",
    title: "Lognormal Moment Matching for Asset Simulation",
    tag: "finance",
    code: `import numpy as np

def lognormal_moment_match(mean: float, variance: float):
    """Given arithmetic mean and variance, recover lognormal mu and sigma^2."""
    sigma2 = np.log(1 + variance / mean**2)
    mu = np.log(mean) - 0.5 * sigma2
    return mu, np.sqrt(sigma2)

def simulate_lognormal_portfolio(
    means: np.ndarray, cov: np.ndarray,
    n_years: float, n_paths: int, seed: int = 0
):
    rng = np.random.default_rng(seed)
    n = len(means)
    log_means = np.zeros(n)
    log_sigmas = np.zeros(n)
    for i in range(n):
        log_means[i], log_sigmas[i] = lognormal_moment_match(
            means[i] * n_years, cov[i, i] * n_years
        )

    # Cholesky decomposition for correlated lognormals
    L = np.linalg.cholesky(cov * n_years)
    Z = rng.standard_normal((n_paths, n))
    log_returns = log_means + (L @ Z.T).T

    terminal_values = np.exp(log_returns)
    return terminal_values`,
    explanation:
      "Moment matching converts intuitive arithmetic estimates (expected return, variance) to lognormal parameters (mu, sigma) so that E[S_T] and Var[S_T] match exactly. The Cholesky factorization of the covariance matrix introduces cross-asset correlation.",
  },
  {
    id: "pyfin-20260704-b1-cs01",
    language: "python",
    title: "CS01 Credit Spread DV01 via Bump-and-Reprice",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def price_cds(spread: float, hazard: float, recovery: float,
              T: float, r: float, dt: float = 0.25) -> float:
    times = np.arange(dt, T + 1e-9, dt)
    surv = np.exp(-hazard * times)
    disc = np.exp(-r * times)
    prem_leg = spread * dt * (surv * disc).sum()
    prot_leg = (1 - recovery) * hazard * dt * (surv * disc).sum()
    return prem_leg - prot_leg

def cs01(running_spread: float, recovery: float, T: float, r: float,
         bump_bps: float = 1.0) -> dict:
    bump = bump_bps / 10_000
    # Back out hazard from par spread
    h = brentq(
        lambda h: price_cds(running_spread, h, recovery, T, r),
        1e-6, 10.0
    )
    # Bump spread and reprice
    h_up = brentq(
        lambda h: price_cds(running_spread + bump, h, recovery, T, r),
        1e-6, 10.0
    )
    pv_base = price_cds(running_spread, h, recovery, T, r)
    pv_up = price_cds(running_spread + bump, h_up, recovery, T, r)
    return {"cs01": pv_up - pv_base, "hazard_rate": h, "par_spread": running_spread}`,
    explanation:
      "CS01 (credit spread DV01) measures P&L per 1bp parallel shift in credit spread; it's positive for protection buyers. The bump-and-reprice approach first bootstraps the implied hazard rate, then re-bootstraps after the bump to get the shifted price.",
  },
];
