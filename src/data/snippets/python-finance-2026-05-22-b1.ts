import type { Snippet } from "./types";

export const pythonFinanceSnippets20260522B1: Snippet[] = [
  {
    id: "pyfin-20260522-b1-lasso-alpha",
    language: "python",
    title: "LASSO / ElasticNet alpha signal (sklearn)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LassoCV, ElasticNetCV
from sklearn.preprocessing import StandardScaler

def lasso_alpha(features: pd.DataFrame, target: pd.Series,
                train_frac: float = 0.6):
    """
    Predict next-period return using LASSO — sparsity regularisation
    automatically zero-outs weak predictors (momentum, vol, liquidity, etc).
    """
    split = int(len(features) * train_frac)
    X_tr, y_tr = features.iloc[:split].values, target.iloc[:split].values
    X_te, y_te = features.iloc[split:].values, target.iloc[split:].values

    scaler = StandardScaler()
    X_tr = scaler.fit_transform(X_tr)
    X_te = scaler.transform(X_te)

    # LassoCV picks alpha via cross-validated MSE on time-series folds
    model = LassoCV(alphas=np.logspace(-4, 0, 40), cv=5,
                    max_iter=5000, random_state=42)
    model.fit(X_tr, y_tr)

    preds = model.predict(X_te)
    ic    = np.corrcoef(preds, y_te)[0, 1]   # information coefficient
    non_zero = np.sum(model.coef_ != 0)

    print(f"Best alpha: {model.alpha_:.5f}")
    print(f"Non-zero features: {non_zero}/{X_tr.shape[1]}")
    print(f"Out-of-sample IC: {ic:.3f}")
    return model, preds`,
    explanation:
      "LASSO (L1 penalty) is preferred over OLS for factor selection because it shrinks irrelevant predictors to exactly zero, yielding a sparse and interpretable model. In practice, ElasticNetCV (mix of L1+L2) handles correlated features better — common when momentum and reversal factors overlap.",
  },
  {
    id: "pyfin-20260522-b1-marchenko-pastur",
    language: "python",
    title: "Marchenko-Pastur RMT covariance denoising",
    tag: "finance",
    code: `import numpy as np

def mp_denoise(C: np.ndarray, T_over_N: float) -> np.ndarray:
    """
    Random Matrix Theory: clip eigenvalues below the Marchenko-Pastur
    upper bound — they are noise (sampling artefact) and carry no signal.

    T_over_N = T / N  (observations / assets). Typical: 252 / 50 = 5.04.
    lambda_max = (1 + 1/sqrt(q))^2  where q = T/N.
    """
    N = C.shape[0]
    vals, vecs = np.linalg.eigh(C)          # sorted ascending

    q = T_over_N
    lam_max = (1.0 + 1.0 / np.sqrt(q)) ** 2   # MP upper edge (sigma=1)

    # Replace all noise eigenvalues with their mean (preserve trace)
    noise_mask  = vals < lam_max
    noise_mean  = vals[noise_mask].mean() if noise_mask.any() else 0.0
    clean_vals  = np.where(noise_mask, noise_mean, vals)

    C_clean = vecs @ np.diag(clean_vals) @ vecs.T

    # Rescale diagonal back to 1 (restore correlation matrix form)
    d = np.sqrt(np.diag(C_clean))
    return C_clean / np.outer(d, d)

# Usage: use mp_denoise(sample_corr, T/N) before feeding into MVO.
# Reduces estimation error in the covariance matrix for small T/N ratios.`,
    explanation:
      "Random Matrix Theory says that sample covariance matrices are dominated by noise when T/N is small. The Marchenko-Pastur law gives the exact eigenvalue distribution expected under pure noise; eigenvalues above the upper edge are genuine signal. Denoising before MVO dramatically reduces the turnover of the optimal portfolio.",
  },
  {
    id: "pyfin-20260522-b1-stratified-mc",
    language: "python",
    title: "Stratified sampling Monte Carlo (variance reduction)",
    tag: "finance",
    code: `import numpy as np

def mc_call_stratified(S, K, r, sigma, T, n=100_000, seed=42):
    """
    Stratified sampling: divide [0,1) into n equal strata, draw one uniform
    per stratum, then invert the normal CDF. Forces even coverage of the
    probability space — reduces variance by eliminating clustering.
    """
    rng = np.random.default_rng(seed)
    # Stratum midpoints + small jitter (Latin Hypercube style)
    strata  = (np.arange(n) + rng.uniform(0, 1, n)) / n   # uniform in each stratum
    from scipy.stats import norm
    z = norm.ppf(strata)   # inverse CDF

    ST      = S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * z)
    payoff  = np.maximum(ST - K, 0.0)
    price   = np.exp(-r * T) * payoff.mean()

    # Compare to standard MC variance
    z_plain = rng.standard_normal(n)
    ST2     = S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * z_plain)
    plain   = np.exp(-r * T) * np.maximum(ST2 - K, 0.0).mean()

    print(f"Stratified: {price:.4f}  Plain MC: {plain:.4f}")
    return price`,
    explanation:
      "Stratified sampling eliminates the 'bunching' of plain Monte Carlo where multiple samples accidentally fall in the same region of the distribution. For a call option, it roughly halves the standard error for the same sample count — equivalent to doubling the number of paths.",
  },
  {
    id: "pyfin-20260522-b1-cvar-opt",
    language: "python",
    title: "CVaR portfolio optimisation (cvxpy linear program)",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def min_cvar_portfolio(returns: np.ndarray, alpha: float = 0.95,
                        gamma: float = 0.0) -> np.ndarray:
    """
    Minimise CVaR (Expected Shortfall) of the portfolio.
    Rockafellar-Uryasev LP reformulation — no simulation required.
    Optional gamma penalises negative expected return.
    returns: (T, N) matrix of historical/simulated scenario returns.
    """
    T, N = returns.shape
    w   = cp.Variable(N)
    nu  = cp.Variable()          # VaR level (threshold)
    xi  = cp.Variable(T, nonneg=True)   # excess losses above VaR

    port_ret = returns @ w
    constraints = [
        cp.sum(w) == 1,
        w >= 0,
        xi >= -port_ret - nu,    # xi_t >= max(-r_t^T w - nu, 0)
    ]

    cvar = nu + (1.0 / ((1.0 - alpha) * T)) * cp.sum(xi)
    obj  = cp.Minimize(cvar - gamma * returns.mean(axis=0) @ w)
    cp.Problem(obj, constraints).solve(solver=cp.OSQP)

    w_opt = w.value
    cvar_val = float(nu.value + (1/((1-alpha)*T)) * np.sum(np.maximum(-returns @ w_opt - float(nu.value), 0)))
    print(f"CVaR({int(alpha*100)}%): {cvar_val:.4f}")
    return w_opt`,
    explanation:
      "The Rockafellar-Uryasev CVaR reformulation converts a quantile optimisation (hard) into a linear program (easy). Unlike variance minimisation, CVaR directly targets tail losses — the quantity regulators and risk managers actually care about. It requires only historical/simulated scenario returns as input.",
  },
  {
    id: "pyfin-20260522-b1-factor-cov",
    language: "python",
    title: "BARRA-style factor covariance decomposition",
    tag: "finance",
    code: `import numpy as np

def factor_covariance_model(returns: np.ndarray,
                              factor_returns: np.ndarray) -> dict:
    """
    Decompose the covariance matrix into factor and specific components:
    Sigma = B * F * B^T + D
    where B = factor loadings (OLS betas), F = factor cov, D = diag specific var.
    This is the BARRA/Axioma single-period risk model structure.
    """
    T, N = returns.shape
    T2, K = factor_returns.shape

    # OLS factor loadings for each asset
    B = np.linalg.lstsq(factor_returns, returns, rcond=None)[0]  # (K, N)

    # Specific (idiosyncratic) residuals
    residuals = returns - factor_returns @ B    # (T, N)

    # Factor covariance (annualised)
    F = np.cov(factor_returns, rowvar=False) * 252   # (K, K)

    # Specific variance (diagonal matrix)
    D = np.diag(residuals.var(axis=0) * 252)         # (N, N)

    # Reconstructed full covariance
    Sigma = B.T @ F @ B + D

    # Portfolio variance decomposition: w^T Sigma w = factor_var + specific_var
    w = np.ones(N) / N   # equal-weight example
    factor_var   = float(w @ B.T @ F @ B @ w)
    specific_var = float(w @ D @ w)
    print(f"Factor var: {factor_var:.6f}  Specific var: {specific_var:.6f}")

    return {"B": B, "F": F, "D": D, "Sigma": Sigma}`,
    explanation:
      "Factor models reduce the N*(N+1)/2 parameters of a full covariance matrix to K*(K+1)/2 + N parameters (K factors + N idiosyncratic variances). For N=500, this is 10,000 vs 125,250 — a dramatic reduction that also improves out-of-sample stability.",
  },
  {
    id: "pyfin-20260522-b1-purged-cv",
    language: "python",
    title: "Purged cross-validation with embargo (finance ML)",
    tag: "finance",
    code: `import numpy as np

def purged_kfold(n: int, n_splits: int = 5,
                  embargo_pct: float = 0.01):
    """
    Time-series CV that prevents leakage from overlapping labels.
    Purging: remove training samples whose label window overlaps the test set.
    Embargo: skip a gap after test set before resuming training data.
    Both are required when labels are forward-looking (e.g. 5-day returns).
    """
    fold = n // n_splits
    embargo = int(n * embargo_pct)

    for i in range(n_splits):
        t0 = i * fold
        t1 = t0 + fold

        # Test: [t0, t1)
        test_idx  = np.arange(t0, t1)

        # Train: everything before t0 minus the embargo gap,
        # plus everything after t1 (walk-forward uses only the past).
        # For strict walk-forward: only use past.
        train_end = max(0, t0 - embargo)
        train_idx = np.arange(0, train_end)

        if len(train_idx) >= fold:
            yield train_idx, test_idx`,
    explanation:
      "Standard k-fold CV on financial data causes massive leakage when labels overlap (e.g. a 20-day forward return labels computed at t and t+1 share 19 days). Purging removes the contaminated training rows; the embargo gap prevents the model from seeing recent returns that share information with the test label.",
  },
  {
    id: "pyfin-20260522-b1-yield-bootstrap",
    language: "python",
    title: "Yield curve bootstrapping from par yields",
    tag: "finance",
    code: `import numpy as np

def bootstrap_zeros(maturities: np.ndarray,
                     par_yields: np.ndarray,
                     freq: int = 2) -> np.ndarray:
    """
    Bootstrap zero rates from par coupon bond yields (USD Treasury convention).
    freq=2: semi-annual coupons.
    For each maturity: set coupon = par yield / freq, face = 1, price = 1.
    Solve for unknown DF using previously bootstrapped ones:
      1 = sum_j coupon * DF(t_j) + (1 + coupon) * DF(T)
    """
    n   = len(maturities)
    dfs = np.zeros(n)    # discount factors

    for i, (T, y) in enumerate(zip(maturities, par_yields)):
        coupon    = y / freq
        n_periods = int(round(T * freq))

        # Discount all intermediate coupon periods
        pv_coupons = 0.0
        for j in range(i):
            t_j = maturities[j]
            pv_coupons += coupon * dfs[j]

        # Solve for DF(T): 1 = pv_coupons + (1 + coupon) * DF(T)
        dfs[i] = (1.0 - pv_coupons) / (1.0 + coupon)

    zero_rates = -np.log(dfs) / maturities
    return zero_rates, dfs

# Example
mats   = np.array([0.5, 1.0, 2.0, 5.0, 10.0])
yields = np.array([0.045, 0.047, 0.049, 0.051, 0.053])
zeros, dfs = bootstrap_zeros(mats, yields)
print("Zero rates:", zeros.round(4))`,
    explanation:
      "Bootstrapping is the standard way to extract zero rates from liquid on-the-run Treasury par yields. Each DF is solved analytically given all shorter-maturity DFs — no optimisation needed. The resulting zero curve is then used to discount any cash flow without coupon reinvestment ambiguity.",
  },
  {
    id: "pyfin-20260522-b1-fx-carry",
    language: "python",
    title: "FX carry trade factor construction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def fx_carry_factor(spot_rates: pd.DataFrame,
                     interest_rates: pd.DataFrame) -> pd.Series:
    """
    Construct cross-sectional FX carry: go long high-yield currencies,
    short low-yield. The carry premium is one of the most robust risk premia —
    it persists because it compensates for crash risk (currencies depreciate
    sharply in crises, unwinding crowded carry trades).

    spot_rates:     (T, N) DataFrame of USD per 1 unit foreign currency (log)
    interest_rates: (T, N) foreign interest rates (annualised)
    Returns daily strategy log-return.
    """
    # Carry signal: rank interest rate differentials cross-sectionally
    carry = interest_rates.sub(interest_rates.mean(axis=1), axis=0)
    # Z-score within each day
    z = carry.sub(carry.mean(axis=1), axis=0).div(carry.std(axis=1), axis=0)

    # Long top third, short bottom third
    signal = z.apply(
        lambda row: np.where(row > 0.5, 1.0, np.where(row < -0.5, -1.0, 0.0)),
        axis=1, result_type='broadcast'
    )

    # Dollar-neutral: scale so longs and shorts net to zero
    signal = signal.div(signal.abs().sum(axis=1).replace(0, np.nan), axis=0)

    # Daily return: spot change + interest carry (UIP residual)
    log_spot_ret = np.log(spot_rates).diff()
    strat_ret    = (signal.shift(1) * log_spot_ret).sum(axis=1)

    ann_sharpe = np.sqrt(252) * strat_ret.mean() / strat_ret.std()
    print(f"Carry Sharpe: {ann_sharpe:.2f}")
    return strat_ret`,
    explanation:
      "Uncovered Interest Parity says high-yield currencies should depreciate to offset the interest differential, but empirically they do not — the carry trade earns a risk premium. The risk is crash-like: carry unwinds rapidly in crises (2008, 2015 CNY shock), which is why it has negative skew.",
  },
  {
    id: "pyfin-20260522-b1-momentum",
    language: "python",
    title: "Cross-sectional momentum factor (12-1 month)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def momentum_signal(prices: pd.DataFrame,
                     lookback: int = 252,
                     skip: int = 21) -> pd.DataFrame:
    """
    Jegadeesh-Titman momentum: sort on past 12-month return, skipping
    the most recent month (short-term reversal is a separate, opposing effect).
    Returns cross-sectionally z-scored signal, winsorised at +-3 stdev.
    """
    # Compute formation-period return: price[t - skip] / price[t - lookback] - 1
    ret_formation = prices.shift(skip) / prices.shift(lookback) - 1.0

    # Cross-sectional normalisation per date
    mu    = ret_formation.mean(axis=1)
    sigma = ret_formation.std(axis=1)
    z     = ret_formation.sub(mu, axis=0).div(sigma, axis=0)

    # Winsorise outliers (blowups distort the factor)
    z = z.clip(-3.0, 3.0)
    return z

def momentum_pnl(prices: pd.DataFrame, signal: pd.DataFrame,
                  cost_bps: float = 5.0) -> pd.Series:
    """Dollar-neutral backtest with transaction costs."""
    # Normalise to unit gross exposure per day
    w = signal.div(signal.abs().sum(axis=1).replace(0, np.nan), axis=0)
    log_ret  = np.log(prices).diff()
    turnover = w.diff().abs().sum(axis=1)
    pnl      = (w.shift(1) * log_ret).sum(axis=1) - turnover * cost_bps * 1e-4
    return pnl`,
    explanation:
      "The 12-1 month momentum factor (Jegadeesh-Titman 1993) is among the most replicated anomalies. Skipping the most recent month removes the short-term reversal contamination. Momentum suffers severe crashes after prolonged trends reverse, so tail-risk management (vol scaling, stop losses) is essential.",
  },
  {
    id: "pyfin-20260522-b1-svi-vol",
    language: "python",
    title: "SVI implied vol surface parametrisation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_total_var(k: np.ndarray, a, b, rho, m, sigma) -> np.ndarray:
    """
    Gatheral's SVI: total implied variance w(k) as a function of log-moneyness.
    k = ln(K/F),  w = sigma_imp^2 * T  (total variance, not vol).
    w(k) = a + b * (rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    Convexity and no-butterfly-arb require:  b >= 0, |rho| < 1, sigma > 0.
    """
    return a + b * (rho * (k - m) + np.sqrt((k - m)**2 + sigma**2))

def fit_svi(k_arr: np.ndarray, w_arr: np.ndarray) -> np.ndarray:
    """Calibrate SVI to (log-moneyness, total-variance) market quotes."""
    def loss(p):
        a, b, rho, m, sig = p
        if b < 0 or abs(rho) >= 1.0 or sig <= 0:
            return 1e10
        return float(np.sum((svi_total_var(k_arr, a, b, rho, m, sig) - w_arr)**2))

    x0     = [w_arr.mean(), 0.1, -0.3, 0.0, 0.1]
    bounds = [(-1, 1), (1e-6, 3), (-0.999, 0.999), (-3, 3), (1e-6, 3)]
    res    = minimize(loss, x0, method='L-BFGS-B', bounds=bounds,
                      options={'ftol': 1e-12, 'gtol': 1e-8})
    return res.x  # [a, b, rho, m, sigma]

# To get implied vol: sigma_imp = sqrt(w(k) / T).`,
    explanation:
      "SVI is the industry standard parametric vol surface. Its five parameters give a clean arbitrage-free smile fit for a single expiry. The 'surface SVI' (SSVI) extends it across maturities. Fitting SVI to market quotes and interpolating is how desks price and risk-manage exotic options.",
  },
  {
    id: "pyfin-20260522-b1-hist-sim-decay",
    language: "python",
    title: "Historical simulation VaR with exponential decay",
    tag: "finance",
    code: `import numpy as np

def hs_var_decay(returns: np.ndarray,
                  decay: float = 0.99,
                  confidence: float = 0.99) -> float:
    """
    Weighted Historical Simulation (BIS recommendation).
    More recent observations get higher weight via exponential decay.
    Addresses the 'ghost effect': plain HS holds old stress events with
    equal weight for years after they occurred.
    """
    n    = len(returns)
    ages = np.arange(n - 1, -1, -1, dtype=float)  # 0 = most recent
    w    = decay ** ages
    w   /= w.sum()

    # Sort returns ascending with associated weights
    idx     = np.argsort(returns)
    sr      = returns[idx]
    sw      = w[idx]
    cum_w   = np.cumsum(sw)

    # VaR: find smallest loss such that P(loss > VaR) <= 1 - confidence
    var_idx = np.searchsorted(cum_w, 1.0 - confidence)
    var     = -sr[min(var_idx, n - 1)]

    # Expected Shortfall: weighted average of losses beyond VaR
    beyond  = sr[:var_idx]
    bw      = sw[:var_idx]
    es      = -float(np.sum(beyond * bw) / bw.sum()) if bw.sum() > 0 else var

    print(f"VaR({int(confidence*100)}%): {var:.4f}  ES: {es:.4f}")
    return var`,
    explanation:
      "Plain historical simulation treats a 5-year-old crisis as equally likely as yesterday's move, which overstates risk after calm periods and understates it after shocks. The exponential decay scheme (decay=0.99 → half-life ≈ 69 days) gives a more responsive estimate without losing the non-parametric character.",
  },
  {
    id: "pyfin-20260522-b1-stress-test",
    language: "python",
    title: "Scenario stress testing for a portfolio",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

# Historical scenario returns for major asset classes.
# Each row is a stress scenario; columns match the portfolio's asset universe.
SCENARIOS = {
    "2008 GFC peak":       {"Equities": -0.35, "HY Credit": -0.28, "EM": -0.40, "Gold": +0.05},
    "COVID Mar 2020":      {"Equities": -0.30, "HY Credit": -0.20, "EM": -0.25, "Gold": +0.00},
    "1994 Bond Massacre":  {"Equities": -0.05, "HY Credit": -0.08, "EM": -0.15, "Gold": -0.02},
    "Dot-com 2000-2002":   {"Equities": -0.45, "HY Credit": -0.10, "EM": -0.20, "Gold": +0.08},
    "+100bp rates shock":  {"Equities": -0.08, "HY Credit": -0.06, "EM": -0.10, "Gold": -0.04},
}

def stress_test(weights: dict, scenarios: dict = SCENARIOS) -> pd.DataFrame:
    """Apply stress scenarios to a portfolio and compute PnL."""
    rows = []
    for name, shocks in scenarios.items():
        pnl = sum(weights.get(asset, 0) * ret
                  for asset, ret in shocks.items())
        rows.append({"scenario": name, "pnl_pct": pnl * 100})
    df = pd.DataFrame(rows).set_index("scenario")
    df["pnl_pct"] = df["pnl_pct"].round(2)
    return df.sort_values("pnl_pct")

portfolio = {"Equities": 0.60, "HY Credit": 0.20, "EM": 0.10, "Gold": 0.10}
print(stress_test(portfolio))`,
    explanation:
      "Scenario stress tests complement statistical VaR: they answer 'how bad was it in event X?' rather than 'how bad is a 1-in-100-day loss?'. Regulators (FRTB, stress testing under Basel) require both. The hardest part is constructing a coherent, non-overlapping scenario set that covers the risk factors the portfolio actually has.",
  },
  {
    id: "pyfin-20260522-b1-info-ratio",
    language: "python",
    title: "Information ratio and transfer coefficient",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm

def information_ratio(strategy_ret: np.ndarray,
                       benchmark_ret: np.ndarray,
                       periods_per_year: int = 252) -> float:
    """
    IR = annualised active return / tracking error.
    Active return = strategy - benchmark (NOT excess over risk-free).
    """
    active  = strategy_ret - benchmark_ret
    return np.sqrt(periods_per_year) * active.mean() / active.std(ddof=1)

def factor_alpha(strategy_ret: np.ndarray,
                  factor_rets: np.ndarray,
                  periods: int = 252) -> dict:
    """
    Regress strategy on factors; alpha is the intercept.
    t-stat > 2 means alpha is statistically distinct from zero.
    """
    X       = sm.add_constant(factor_rets)
    res     = sm.OLS(strategy_ret, X).fit()
    alpha_d = res.params[0]
    t_stat  = res.tvalues[0]
    return {"alpha_annual": alpha_d * periods,
            "t_stat": t_stat,
            "betas": res.params[1:],
            "r_squared": res.rsquared}

def transfer_coefficient(signal: np.ndarray,
                          actual_weights: np.ndarray) -> float:
    """
    TC = corr(signal, actual weights).  Measures implementation efficiency.
    TC=1: weights perfectly reflect signal. TC<1: constraints dilute the signal.
    Grinold-Kahn: IR_actual = IC * sqrt(breadth) * TC.
    """
    return float(np.corrcoef(signal, actual_weights)[0, 1])`,
    explanation:
      "The Grinold-Kahn fundamental law (IR = IC * sqrt(breadth)) shows that skill (IC), breadth (number of independent bets), and implementation quality (transfer coefficient) all multiply. A strategy with IC=0.05 and 252 daily bets but TC=0.5 has IR ≈ 0.05 * 15.9 * 0.5 ≈ 0.40.",
  },
  {
    id: "pyfin-20260522-b1-multi-period-dp",
    language: "python",
    title: "Multi-period portfolio rebalancing with transaction costs",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def multi_period_rebalance(
    w0: np.ndarray,           # initial weights
    mu: np.ndarray,           # expected returns per period
    Sigma: np.ndarray,        # covariance matrix
    n_periods: int = 5,
    cost: float = 0.001,      # one-way transaction cost fraction
    risk_aversion: float = 2.0
) -> np.ndarray:
    """
    Rolling single-period optimisation: at each step minimise
    U = -mu^T w + lambda * w^T Sigma w + cost * ||w - w_prev||_1.
    The L1 transaction cost term (absolute turnover) shrinks trades.
    """
    N = len(w0)
    traj = [w0.copy()]
    w = w0.copy()

    for _ in range(n_periods):
        w_prev = w.copy()

        def objective(wt):
            ret  = -mu @ wt
            var  = risk_aversion * float(wt @ Sigma @ wt)
            tc   = cost * np.sum(np.abs(wt - w_prev))
            return ret + var + tc

        res = minimize(
            objective, w_prev,
            method='SLSQP',
            bounds=[(0, 1)] * N,
            constraints=[{'type': 'eq', 'fun': lambda wt: wt.sum() - 1}],
            options={'ftol': 1e-9}
        )
        w = res.x
        traj.append(w.copy())

    return np.array(traj)`,
    explanation:
      "The L1 (absolute-value) transaction cost term creates a 'no-trade region' around the current portfolio: small signal changes don't trigger rebalancing, which is the correct economic behaviour. The rolling single-period approximation is suboptimal vs full multi-period DP but tractable for large N.",
  },
  {
    id: "pyfin-20260522-b1-random-forest-alpha",
    language: "python",
    title: "Random forest cross-sectional return prediction",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

def rf_alpha(X: pd.DataFrame, y: pd.Series,
              train_frac: float = 0.6,
              n_estimators: int = 200) -> tuple:
    """
    Random forest for predicting cross-sectional next-period returns.
    RF handles non-linearity (momentum decay, vol-of-vol effects) without
    overfitting as aggressively as deep nets on small financial datasets.
    """
    split   = int(len(X) * train_frac)
    X_tr, y_tr = X.iloc[:split].values, y.iloc[:split].values
    X_te, y_te = X.iloc[split:].values, y.iloc[split:].values

    sc   = StandardScaler()
    X_tr = sc.fit_transform(X_tr)
    X_te = sc.transform(X_te)

    rf = RandomForestRegressor(
        n_estimators=n_estimators,
        max_features=0.3,        # feature subsampling per split
        min_samples_leaf=20,     # avoid overfitting small date-buckets
        random_state=42, n_jobs=-1
    )
    rf.fit(X_tr, y_tr)
    preds = rf.predict(X_te)

    ic          = np.corrcoef(preds, y_te)[0, 1]
    importances = pd.Series(rf.feature_importances_, index=X.columns
                            ).sort_values(ascending=False)
    print(f"OOS IC: {ic:.3f}")
    print(importances.head(5))
    return preds, ic, importances`,
    explanation:
      "RF's built-in bagging and feature subsampling make it robust to the limited observations per asset typical in quant equity. min_samples_leaf=20 is critical: with 500 assets and 252 days you have ≈125,000 rows, but only a few hundred independent dates — shallow trees generalise far better than deep ones.",
  },
  {
    id: "pyfin-20260522-b1-factor-neutral",
    language: "python",
    title: "Factor-neutral idiosyncratic return residuals",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def factor_neutral_returns(returns: pd.DataFrame,
                             factors: pd.DataFrame) -> pd.DataFrame:
    """
    Regress each asset's returns on common factors (market, size, value, etc.)
    and return the residuals — the part unexplained by factor exposure.

    Factor neutralisation prevents cross-sectional strategies from accidentally
    being long beta or long value: signals become 'pure alpha' predictions.
    """
    X      = sm.add_constant(factors.values, has_constant='add')
    result = pd.DataFrame(index=returns.index, columns=returns.columns,
                          dtype=float)

    for col in returns.columns:
        y     = returns[col].values
        valid = ~np.isnan(y) & np.all(~np.isnan(X), axis=1)
        if valid.sum() < 30:
            result[col] = np.nan
            continue
        fit   = sm.OLS(y[valid], X[valid]).fit()
        resid = np.full(len(y), np.nan)
        resid[valid] = fit.resid
        result[col]  = resid

    return result`,
    explanation:
      "Stocks with high beta look like momentum winners in bull markets simply because beta drove them up. Factor-neutralising removes this: the residuals are orthogonal to the factors by construction. In live systems, betas should be re-estimated rolling to track regime changes.",
  },
  {
    id: "pyfin-20260522-b1-quantlib-swaption",
    language: "python",
    title: "Swaption pricing with Hull-White (QuantLib)",
    tag: "finance",
    code: `import QuantLib as ql

def price_swaption_hw(expiry_yrs: float, tenor_yrs: float,
                       strike: float, a: float = 0.10,
                       sigma: float = 0.015) -> float:
    """
    European payer swaption via Hull-White one-factor model.
    a     = mean reversion speed
    sigma = short-rate vol
    Priced on a trinomial tree (TreeSwaptionEngine).
    """
    today = ql.Date.todaysDate()
    ql.Settings.instance().evaluationDate = today

    ts = ql.YieldTermStructureHandle(
        ql.FlatForward(today, 0.05, ql.Actual365Fixed()))

    model   = ql.HullWhite(ts, a, sigma)
    engine  = ql.TreeSwaptionEngine(model, 100)

    exp_date   = today + ql.Period(int(expiry_yrs * 12), ql.Months)
    swap_end   = exp_date + ql.Period(int(tenor_yrs  * 12), ql.Months)
    schedule   = ql.Schedule(exp_date, swap_end, ql.Period(ql.Annual),
                              ql.TARGET(), ql.ModifiedFollowing,
                              ql.ModifiedFollowing,
                              ql.DateGeneration.Forward, False)

    swap = ql.VanillaSwap(
        ql.VanillaSwap.Payer, 1_000_000.0,
        schedule, strike, ql.Thirty360(ql.Thirty360.BondBasis),
        schedule, ts, 0.0, ql.Actual360())

    swaption = ql.Swaption(swap, ql.EuropeanExercise(exp_date))
    swaption.setPricingEngine(engine)
    return swaption.NPV()

# price_swaption_hw(1.0, 5.0, 0.05) -> ~4,500 USD on 1M notional`,
    explanation:
      "Swaptions are the primary instrument for hedging and trading interest rate vol. The Hull-White tree engine calibrates to the initial term structure exactly (via the time-dependent theta(t)) and then prices by backward induction, making it ideal for Bermudan swaptions with early exercise.",
  },
  {
    id: "pyfin-20260522-b1-correlated-gbm",
    language: "python",
    title: "Correlated multi-asset GBM paths (Cholesky)",
    tag: "finance",
    code: `import numpy as np

def correlated_gbm(S0: np.ndarray, mu: np.ndarray, sigma: np.ndarray,
                    corr: np.ndarray, T: float, n_steps: int,
                    n_paths: int, seed: int = 42) -> np.ndarray:
    """
    Simulate correlated multi-asset Geometric Brownian Motion.
    Cholesky decomposition converts independent normals into correlated ones.

    Returns: (n_steps+1, n_paths, n_assets) array of simulated prices.
    """
    n_assets = len(S0)
    dt       = T / n_steps
    L        = np.linalg.cholesky(corr)    # lower triangular

    rng   = np.random.default_rng(seed)
    paths = np.zeros((n_steps + 1, n_paths, n_assets))
    paths[0] = S0

    drift     = (mu - 0.5 * sigma**2) * dt           # (n_assets,)
    vol_scale = sigma * np.sqrt(dt)                   # (n_assets,)

    for t in range(n_steps):
        Z        = rng.standard_normal((n_paths, n_assets))
        Z_corr   = Z @ L.T            # (n_paths, n_assets) correlated shocks
        log_ret  = drift + vol_scale * Z_corr
        paths[t + 1] = paths[t] * np.exp(log_ret)

    return paths

# Basket call payoff: max(mean(S_T) - K, 0)
def basket_call_mc(paths: np.ndarray, K: float, r: float, T: float) -> float:
    S_T    = paths[-1]                          # (n_paths, n_assets)
    basket = S_T.mean(axis=1)                   # equal-weight basket
    return float(np.exp(-r * T) * np.maximum(basket - K, 0).mean())`,
    explanation:
      "The Cholesky decomposition is the standard way to introduce correlation between asset paths: L @ z produces correlated normals from independent ones without bias. Basket and spread option payoffs cannot be priced analytically, so correlated GBM simulation is the practical tool.",
  },
  {
    id: "pyfin-20260522-b1-arma-garch",
    language: "python",
    title: "ARMA-GARCH combined mean and volatility model",
    tag: "finance",
    code: `import numpy as np
from arch import arch_model

def fit_arma_garch(returns: np.ndarray, p: int = 1, q: int = 1) -> dict:
    """
    ARMA(p,q)-GARCH(1,1): model both conditional mean (ARMA) and
    conditional variance (GARCH) simultaneously.
    ARMA captures autocorrelation in returns (rare for equities, common for FX).
    GARCH captures vol clustering (universal).
    Returns model fit and 1-step forecast of conditional mean and variance.
    """
    r = returns * 100    # arch library works on percentage returns

    model = arch_model(r, mean='ARX', lags=p,
                       vol='GARCH', p=1, q=1,
                       dist='skewt')   # skewed-t captures fat tails
    fit   = model.fit(disp='off', options={'maxiter': 500})

    # 1-step ahead forecasts
    fcast = fit.forecast(horizon=1, reindex=False)
    cond_mean     = float(fcast.mean.iloc[-1, 0]) / 100
    cond_variance = float(fcast.variance.iloc[-1, 0]) / 10000

    print(f"Cond. mean: {cond_mean:.5f}  Cond. vol: {np.sqrt(cond_variance):.5f}")
    print(f"Persistence (alpha+beta): {fit.params['alpha[1]'] + fit.params['beta[1]']:.4f}")
    return {"fit": fit, "cond_mean": cond_mean, "cond_var": cond_variance}`,
    explanation:
      "The skewed-t distribution in the GARCH error term captures both excess kurtosis (fat tails) and asymmetry (larger down moves) simultaneously — important for option pricing and VaR where the left tail matters most. Alpha+beta near 1 signals high persistence (long-memory vol).",
  },
  {
    id: "pyfin-20260522-b1-quantlib-cds",
    language: "python",
    title: "CDS pricing and par spread (QuantLib)",
    tag: "finance",
    code: `import QuantLib as ql

def cds_par_spread(maturity_yrs: float, hazard_rate: float,
                    recovery: float = 0.40, r: float = 0.05) -> float:
    """
    Compute the par CDS spread (in bps) and NPV for a given
    flat hazard rate (implied from CDS market quotes in practice).
    """
    today = ql.Date.todaysDate()
    ql.Settings.instance().evaluationDate = today

    discount_ts = ql.YieldTermStructureHandle(
        ql.FlatForward(today, r, ql.Actual365Fixed()))
    hazard_ts   = ql.DefaultProbabilityTermStructureHandle(
        ql.FlatHazardRate(today, hazard_rate, ql.Actual365Fixed()))

    maturity = today + ql.Period(int(maturity_yrs * 12), ql.Months)
    schedule = ql.Schedule(
        today, maturity, ql.Period(ql.Quarterly),
        ql.TARGET(), ql.Following, ql.Following,
        ql.DateGeneration.Forward, False)

    cds = ql.CreditDefaultSwap(
        ql.Protection.Buyer, 1_000_000, 0.01,   # dummy spread
        schedule, ql.Following, ql.Actual360())

    engine = ql.MidPointCdsEngine(hazard_ts, recovery, discount_ts)
    cds.setPricingEngine(engine)

    par_spread_bps = cds.fairSpread() * 10000
    print(f"Par spread: {par_spread_bps:.1f} bps")
    return par_spread_bps`,
    explanation:
      "The par spread is the fixed premium that makes the CDS worth zero at inception. A higher hazard rate (i.e. more default risk) raises the par spread — the protection buyer must pay more per year. In practice, hazard rates are bootstrapped from a term structure of CDS quotes at 1Y, 3Y, 5Y, 7Y, 10Y.",
  },
  {
    id: "pyfin-20260522-b1-bdt-calibration",
    language: "python",
    title: "Black-Derman-Toy (BDT) binomial tree calibration sketch",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_calibrate(zero_rates: np.ndarray, cap_vols: np.ndarray,
                   dt: float = 0.5) -> tuple:
    """
    BDT model: log-normal short rate on a recombining tree.
    At each level j, r_d = u_j and r_u = u_j * exp(2 * sigma_j * sqrt(dt)).
    Calibrates (u_j, sigma_j) to match ZCB prices and caplet vols.

    This sketch calibrates to ZCB prices only (sigma fixed per level).
    Full calibration to vols requires solving a 2-equation system per period.
    """
    n       = len(zero_rates)
    disc_T  = np.exp(-zero_rates * np.arange(1, n + 1) * dt)
    u       = np.zeros(n)    # median rate at each level
    sigma   = cap_vols.copy()

    def price_zcb_bdt(j, u_j):
        """Price ZCB maturing at j+1 using BDT tree up to level j."""
        # Build Arrow-Debreu prices up to level j
        q = np.array([1.0])   # state prices at time 0
        for k in range(j):
            rates = u[k] * np.exp(2.0 * sigma[k] * np.sqrt(dt)
                                  * (np.arange(k + 1) - k / 2.0))
            disc  = np.exp(-rates * dt)
            qnew  = np.zeros(k + 2)
            qnew[:-1] += 0.5 * q * disc
            qnew[1:]  += 0.5 * q * disc
            q = qnew
        rates_j = u_j * np.exp(2.0 * sigma[j] * np.sqrt(dt)
                                * (np.arange(j + 1) - j / 2.0))
        return float(np.sum(q * np.exp(-rates_j * dt)))

    for j in range(n):
        target = disc_T[j]
        u[j]   = brentq(lambda uj: price_zcb_bdt(j, uj) - target,
                         1e-6, 0.5, xtol=1e-8)

    return u, sigma`,
    explanation:
      "BDT is a log-normal binomial tree that exactly fits the observed zero curve and, when sigma is calibrated to cap vols, the entire cap/floor market. Its log-normality prevents negative rates but produces mean-reversion that depends on the vol term structure — a limitation that drove adoption of Hull-White.",
  },
];
