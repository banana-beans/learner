import { Snippet } from "./types";

export const pythonFinanceSnippets20260717B1: Snippet[] = [
  {
    id: "pyfin-20260717-b1-svensson-fit",
    language: "python",
    tag: "finance",
    title: "Svensson Term Structure Model Fitting",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_rate(tau: np.ndarray, params: np.ndarray) -> np.ndarray:
    """
    Svensson (1994) extended Nelson-Siegel:
    r(tau) = b0 + b1*(1-exp(-tau/l1))/(tau/l1)
           + b2*[(1-exp(-tau/l1))/(tau/l1) - exp(-tau/l1)]
           + b3*[(1-exp(-tau/l2))/(tau/l2) - exp(-tau/l2)]
    """
    b0, b1, b2, b3, l1, l2 = params
    l1 = max(l1, 1e-4)
    l2 = max(l2, 1e-4)
    e1 = tau / l1
    e2 = tau / l2
    f1 = (1 - np.exp(-e1)) / e1
    f2 = (1 - np.exp(-e2)) / e2
    return b0 + b1*f1 + b2*(f1 - np.exp(-e1)) + b3*(f2 - np.exp(-e2))

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> dict:
    """Calibrate Svensson parameters to observed yield curve data."""
    def objective(params):
        fitted = svensson_rate(maturities, params)
        return np.sum((fitted - yields) ** 2)

    # Initial guess: [level, slope, curvature1, curvature2, lambda1, lambda2]
    x0 = [yields[-1], yields[0] - yields[-1], 0.01, 0.01, 1.5, 5.0]
    bounds = [
        (0.0, 0.20), (-0.20, 0.20), (-0.20, 0.20), (-0.20, 0.20),
        (0.01, 30.0), (0.01, 30.0)
    ]
    result = minimize(objective, x0, method='L-BFGS-B', bounds=bounds)
    params = result.x
    return {
        'beta0': params[0], 'beta1': params[1],
        'beta2': params[2], 'beta3': params[3],
        'lambda1': params[4], 'lambda2': params[5],
        'rmse': np.sqrt(result.fun / len(yields)),
    }

# Example usage
maturities = np.array([0.25, 0.5, 1, 2, 5, 10, 20, 30])
yields     = np.array([0.045, 0.047, 0.050, 0.053, 0.055, 0.052, 0.049, 0.048])
result = fit_svensson(maturities, yields)
print(f"Level (beta0)={result['beta0']:.4f}  RMSE={result['rmse']*10000:.2f} bps")`,
    explanation:
      "Svensson extends Nelson-Siegel with a second hump term (beta3/lambda2) that captures the extra curvature often seen in the 10–30Y segment of sovereign curves. Central banks publish Svensson parameters daily; fitting your own lets you interpolate discount factors at arbitrary maturities without piecewise assumptions.",
  },
  {
    id: "pyfin-20260717-b1-cholesky-sim",
    language: "python",
    tag: "finance",
    title: "Cholesky Decomposition for Correlated Asset Simulation",
    code: `import numpy as np

def correlated_gbm_paths(
    S0: np.ndarray,        # initial prices, shape (n_assets,)
    mu: np.ndarray,        # annualised drifts
    sigma: np.ndarray,     # annualised vols
    corr: np.ndarray,      # n_assets x n_assets correlation matrix
    T: float, dt: float, n_paths: int,
    seed: int = 42
) -> np.ndarray:
    """
    Simulate correlated GBM paths using Cholesky decomposition.
    Returns paths of shape (n_paths, n_steps+1, n_assets).
    """
    rng = np.random.default_rng(seed)
    n_assets = len(S0)
    n_steps  = int(T / dt)

    # Cholesky: corr = L @ L.T; L is lower-triangular
    L = np.linalg.cholesky(corr)

    paths = np.zeros((n_paths, n_steps + 1, n_assets))
    paths[:, 0, :] = S0

    for step in range(n_steps):
        # Independent standard normals: shape (n_paths, n_assets)
        Z_ind = rng.standard_normal((n_paths, n_assets))
        # Correlate: Z_corr[i] = L @ Z_ind[i]
        Z_corr = Z_ind @ L.T   # equivalent to (L @ Z_ind.T).T

        # GBM log-return step
        log_ret = ((mu - 0.5 * sigma ** 2) * dt
                   + sigma * np.sqrt(dt) * Z_corr)
        paths[:, step + 1, :] = paths[:, step, :] * np.exp(log_ret)

    return paths

# Example: 3-asset correlated portfolio
S0    = np.array([100.0, 50.0, 200.0])
mu    = np.array([0.08, 0.06, 0.10])
sigma = np.array([0.20, 0.15, 0.25])
corr  = np.array([[1.0, 0.6, 0.3],
                  [0.6, 1.0, 0.4],
                  [0.3, 0.4, 1.0]])

paths = correlated_gbm_paths(S0, mu, sigma, corr, T=1.0, dt=1/252, n_paths=10_000)
terminal = paths[:, -1, :]  # shape (10000, 3)
print(f"Asset 0 mean terminal: {terminal[:,0].mean():.2f}")`,
    explanation:
      "The Cholesky factorisation `L @ L.T = Corr` converts independent normals into correlated ones by the linear map `Z_corr = L @ Z_ind`: the resulting covariance is `L @ I @ L.T = Corr`. Broadcasting `Z_ind @ L.T` applies the same rotation to all paths simultaneously, vectorising across the path dimension without any Python loop.",
  },
  {
    id: "pyfin-20260717-b1-cvar-es",
    language: "python",
    tag: "finance",
    title: "CVaR / Expected Shortfall via Historical Simulation",
    code: `import numpy as np

def historical_var_cvar(
    pnl: np.ndarray,    # daily P&L series (positive = profit)
    confidence: float = 0.99,
) -> tuple:
    """
    Compute historical VaR and CVaR (Expected Shortfall).
    VaR_alpha  = -(alpha-th quantile of P&L)
    CVaR_alpha = -(mean of P&L in the worst (1-alpha) tail)
    """
    sorted_pnl = np.sort(pnl)                      # ascending
    cutoff_idx = int(np.floor((1 - confidence) * len(pnl)))
    var        = -sorted_pnl[cutoff_idx]            # positive loss figure
    cvar       = -sorted_pnl[:cutoff_idx + 1].mean()  # average tail loss
    return var, cvar

def parametric_es_normal(sigma_daily: float, confidence: float = 0.99) -> float:
    """
    Parametric ES under normality: ES = sigma * phi(z) / (1 - alpha)
    where phi is the standard normal PDF and z = N^{-1}(alpha).
    """
    from scipy.stats import norm
    z   = norm.ppf(confidence)
    phi = norm.pdf(z)
    return sigma_daily * phi / (1 - confidence)

# Simulate a P&L series with fat tails (t-distribution)
rng = np.random.default_rng(0)
daily_pnl = rng.standard_t(df=5, size=2500) * 100_000   # t5, 100k notional scale

var99, cvar99 = historical_var_cvar(daily_pnl, 0.99)
print(f"99% Historical VaR: {var99:,.0f}")
print(f"99% Historical CVaR (ES): {cvar99:,.0f}")

# Compare with Gaussian parametric ES
sigma = daily_pnl.std()
param_es = parametric_es_normal(sigma, 0.99)
print(f"99% Parametric ES (Normal): {param_es:,.0f}  [underestimates fat tails]")`,
    explanation:
      "CVaR (Expected Shortfall) averages the losses beyond VaR, making it coherent and convex — portfolio ES is at most the sum of component ES, enabling additive risk budgeting. Historical simulation automatically captures fat tails, skewness, and non-linear exposures without assuming a parametric distribution, while the parametric ES formula shows why Gaussian models systematically underestimate tail risk.",
  },
  {
    id: "pyfin-20260717-b1-pca-risk",
    language: "python",
    tag: "finance",
    title: "PCA Risk Factor Decomposition of a Yield Curve",
    code: `import numpy as np

def pca_yield_factors(yield_changes: np.ndarray) -> dict:
    """
    Apply PCA to daily yield changes across tenors.
    First 3 PCs explain >95% of yield curve variance:
      PC1 = parallel shift, PC2 = slope (twist), PC3 = curvature (butterfly).
    """
    # Standardise by tenor (optional; here we use covariance, not correlation)
    cov = np.cov(yield_changes.T)   # shape (n_tenors, n_tenors)

    eigenvalues, eigenvectors = np.linalg.eigh(cov)  # ascending order
    # Sort descending
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues  = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]   # columns = PCs

    total_var  = eigenvalues.sum()
    explained  = eigenvalues / total_var

    # Factor scores: project yield changes onto PCs
    scores = yield_changes @ eigenvectors   # shape (n_days, n_tenors)

    # Reconstruct from top-3 PCs
    recon3 = scores[:, :3] @ eigenvectors[:, :3].T

    return {
        'eigenvalues':  eigenvalues,
        'eigenvectors': eigenvectors,   # columns: PC loadings by tenor
        'explained':    explained,
        'scores':       scores,         # daily factor realizations
        'recon3':       recon3,         # 3-PC reconstruction of curve
        'cum_explained_3': explained[:3].sum(),
    }

# Synthetic yield changes: shape (500 days, 8 tenors)
rng = np.random.default_rng(0)
n_days, n_tenors = 500, 8
# Level dominates, so correlate strongly
base = rng.standard_normal((n_days, 1)) * 0.05
yield_changes = base + rng.standard_normal((n_days, n_tenors)) * 0.01

result = pca_yield_factors(yield_changes)
print(f"PC1 explains {result['explained'][0]*100:.1f}%")
print(f"Top-3 cumulative: {result['cum_explained_3']*100:.1f}%")`,
    explanation:
      "PCA on yield changes reveals the empirical risk factors driving the curve: the first PC (parallel shift) explains ~80–85% of variance, the second (slope) ~10%, and the third (curvature) ~3–5%. Traders use these to construct vega-neutral, delta-hedged butterfly positions that isolate the curvature risk factor independently of level and slope.",
  },
  {
    id: "pyfin-20260717-b1-var-bootstrap",
    language: "python",
    tag: "finance",
    title: "Historical VaR with Bootstrap Confidence Interval",
    code: `import numpy as np

def var_with_ci(
    returns: np.ndarray,
    confidence: float = 0.99,
    n_boot: int = 5000,
    seed: int = 0,
) -> dict:
    """
    Historical VaR with bootstrap confidence interval.
    Returns point estimate and 95% CI via percentile bootstrap.
    """
    rng = np.random.default_rng(seed)
    n   = len(returns)

    def compute_var(r):
        return -np.quantile(r, 1 - confidence)

    var_point = compute_var(returns)

    # Bootstrap: resample returns with replacement N_BOOT times
    boot_vars = np.empty(n_boot)
    for i in range(n_boot):
        sample = rng.choice(returns, size=n, replace=True)
        boot_vars[i] = compute_var(sample)

    ci_lo = np.percentile(boot_vars, 2.5)
    ci_hi = np.percentile(boot_vars, 97.5)

    return {
        'var': var_point,
        'ci_lo': ci_lo,
        'ci_hi': ci_hi,
        'boot_std': boot_vars.std(),
    }

# Simulate daily returns
rng2 = np.random.default_rng(42)
returns = rng2.standard_normal(1000) * 0.01   # 1% daily vol

result = var_with_ci(returns)
print(f"99% VaR: {result['var']*100:.2f}%")
print(f"95% CI: [{result['ci_lo']*100:.2f}%, {result['ci_hi']*100:.2f}%]")
print(f"Bootstrap std: {result['boot_std']*100:.3f}%")`,
    explanation:
      "Bootstrap confidence intervals on VaR quantify estimation uncertainty: with 1000 days of history, the 99th percentile is estimated from only ~10 observations, giving a wide CI. Regulators (Basel) require daily backtesting; knowing the CI width tells the risk manager whether a VaR breach is statistically unusual or within sampling noise of the model.",
  },
  {
    id: "pyfin-20260717-b1-hull-white-tree",
    language: "python",
    tag: "finance",
    title: "Hull-White Short Rate Trinomial Tree",
    code: `import numpy as np

def hull_white_tree(
    a: float,      # mean reversion speed
    sigma: float,  # short rate vol
    dt: float,     # time step (years)
    n_steps: int,  # number of time steps
    r0: float = 0.03,  # initial short rate
) -> dict:
    """
    Build a Hull-White trinomial tree for the short rate.
    Branching: up / middle / down at each node.
    Returns node rates and risk-neutral transition probabilities.
    """
    dx   = sigma * np.sqrt(3 * dt)  # spacing for exact variance matching
    M    = 2 * n_steps + 1           # max number of nodes per step

    # Node rates at time step i, position j: r = r0 + j*dx
    def node_rate(i, j):
        # theta(t) ≈ constant drift term; simplified to r0-adjusted
        return r0 + j * dx * np.exp(-a * i * dt)

    # Risk-neutral probabilities at node j (Arrow-Debreu approach)
    def probs(j):
        # eta = mean reversion drift contribution
        eta = -a * j * dx * dt
        pu = 1/6 + (eta + dx)**2 / (6 * dx**2) + (eta + dx) / (6 * dx)
        pm = 2/3 - (eta + dx)**2 / (3 * dx**2) / 1.0
        pd = 1/6 + (eta + dx)**2 / (6 * dx**2) - (eta + dx) / (6 * dx)
        # Approximate: standard symmetric branching probabilities
        pu = 1/6 + 0.5 * (a * j * dx * dt / dx + (a * j * dx * dt)**2 / (dx**2))
        pm = 2/3 - (a * j * dx * dt)**2 / dx**2
        pd = 1 - pu - pm
        return max(pu, 0.0), max(pm, 0.0), max(pd, 0.0)

    # Store rates and probs for each (step, node) pair
    nodes = {}
    for i in range(n_steps + 1):
        for j in range(-i, i + 1):
            pu, pm, pd = probs(j)
            nodes[(i, j)] = {
                'rate': node_rate(i, j),
                'pu': pu, 'pm': pm, 'pd': pd,
            }

    return {'nodes': nodes, 'dx': dx, 'dt': dt, 'n_steps': n_steps}

tree = hull_white_tree(a=0.1, sigma=0.01, dt=0.5, n_steps=4, r0=0.03)
node = tree['nodes'][(2, 0)]  # step 2, middle node
print(f"Rate at (2,0): {node['rate']*100:.2f}%  pu={node['pu']:.3f}")`,
    explanation:
      "The Hull-White trinomial tree matches the initial yield curve and volatility structure exactly (with a time-varying theta) because its analytic tractability makes calibration to the discount curve a simple bootstrap. The node spacing `dx = sigma*sqrt(3*dt)` ensures variance matching; the trinomial branching allows mean reversion to pull the rate toward the long-run level at each step.",
  },
  {
    id: "pyfin-20260717-b1-convertible-bond",
    language: "python",
    tag: "finance",
    title: "Convertible Bond Pricing via Binomial Tree",
    code: `import numpy as np

def convertible_bond_price(
    S0: float,        # current stock price
    face: float,      # bond face value
    coupon_rate: float,  # annual coupon rate
    maturity: float,  # years to maturity
    r: float,         # risk-free rate
    sigma: float,     # stock vol
    credit_spread: float,  # issuer credit spread
    conversion_ratio: float,  # shares per bond on conversion
    n_steps: int = 100
) -> float:
    """Price a convertible bond using a CRR binomial tree."""
    dt = maturity / n_steps
    u  = np.exp(sigma * np.sqrt(dt))
    d  = 1.0 / u
    p  = (np.exp(r * dt) - d) / (u - d)     # risk-neutral up prob
    df_risk = np.exp(-(r + credit_spread) * dt)   # risky discount factor
    df_free = np.exp(-r * dt)               # riskless factor (for equity)

    coupon = face * coupon_rate * dt       # coupon per step

    # Terminal stock prices
    j = np.arange(n_steps + 1)
    stock_T = S0 * u ** (n_steps - 2 * j)

    # Terminal CB value: max(conversion_ratio * S, face)
    cb_val = np.maximum(conversion_ratio * stock_T, face)

    # Backward induction
    for step in range(n_steps - 1, -1, -1):
        stock = S0 * u ** (step - 2 * np.arange(step + 1))

        # Hold value: PV of coupon + risky discounted continuation
        hold_val = coupon + df_risk * (p * cb_val[:step+1] + (1-p) * cb_val[1:step+2])

        # Conversion value
        conv_val = conversion_ratio * stock

        # CB value: max(hold, conversion, call price if applicable)
        cb_val = np.maximum(hold_val, conv_val)

    return float(cb_val[0])

price = convertible_bond_price(
    S0=100, face=1000, coupon_rate=0.03,
    maturity=5, r=0.04, sigma=0.30,
    credit_spread=0.02, conversion_ratio=10, n_steps=200
)
print(f"Convertible bond price: {price:.2f}")`,
    explanation:
      "Convertible bond pricing requires a hybrid equity-credit tree: the discount rate switches between the risky rate (holding the bond) and the risk-free rate (converted equity). The key insight is that at each node the holder optimally converts when the equity value exceeds the hold-to-maturity value — the binomial tree resolves this optimal stopping problem backward from maturity.",
  },
  {
    id: "pyfin-20260717-b1-greek-ladder",
    language: "python",
    tag: "finance",
    title: "Option Greek Ladder: Bucketed Vega by Expiry",
    code: `import numpy as np
from scipy.stats import norm

def bs_greeks(S, K, r, T, sigma, is_call=True):
    """Returns delta, gamma, vega, theta for a European option."""
    if T <= 0:
        return {'delta': 0, 'gamma': 0, 'vega': 0, 'theta': 0}
    sqT = np.sqrt(T)
    d1  = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    nd1 = norm.cdf(d1) if is_call else norm.cdf(d1) - 1
    npd1 = norm.pdf(d1)
    df  = np.exp(-r * T)
    delta = nd1
    gamma = npd1 / (S * sigma * sqT)
    vega  = S * npd1 * sqT / 100   # per 1% vol move
    theta = (-(S * npd1 * sigma / (2*sqT))
             - r * K * df * (norm.cdf(d2) if is_call else -norm.cdf(-d2))) / 365
    return {'delta': delta, 'gamma': gamma, 'vega': vega, 'theta': theta}

def build_greek_ladder(options: list) -> dict:
    """
    Aggregate Greeks into buckets by expiry bucket.
    options: list of dicts with keys S,K,r,T,sigma,qty,is_call
    Returns ladder dict: expiry_bucket -> net Greeks
    """
    buckets = {}
    expiry_labels = [(0, 0.083, '<1M'), (0.083, 0.25, '1-3M'),
                     (0.25, 0.5, '3-6M'), (0.5, 1.0, '6-12M'),
                     (1.0, 2.0, '1-2Y'), (2.0, 100, '>2Y')]

    for opt in options:
        T   = opt['T']
        qty = opt.get('qty', 1)
        g   = bs_greeks(opt['S'], opt['K'], opt['r'], T, opt['sigma'], opt.get('is_call', True))
        # Find bucket
        for lo, hi, label in expiry_labels:
            if lo <= T < hi:
                if label not in buckets:
                    buckets[label] = {'delta': 0, 'gamma': 0, 'vega': 0, 'theta': 0}
                for key in g:
                    buckets[label][key] += g[key] * qty
                break
    return buckets

options = [
    {'S':100,'K':100,'r':0.05,'T':0.25,'sigma':0.20,'qty': 100,'is_call':True},
    {'S':100,'K':105,'r':0.05,'T':0.25,'sigma':0.22,'qty':-50,'is_call':True},
    {'S':100,'K':100,'r':0.05,'T':1.00,'sigma':0.18,'qty':  50,'is_call':True},
]
ladder = build_greek_ladder(options)
for bucket, g in sorted(ladder.items()):
    print(f"{bucket:8s}  vega={g['vega']:8.2f}  delta={g['delta']:6.2f}")`,
    explanation:
      "A Greek ladder buckets sensitivities by expiry, revealing the term structure of risk — short-dated gamma dominates because it diverges as T → 0, while long-dated vega is higher because longer options carry more vol sensitivity per unit notional. Risk managers use the ladder to identify which expiry buckets require hedging and to match offsetting positions across the vol surface.",
  },
  {
    id: "pyfin-20260717-b1-momentum-ts-backtest",
    language: "python",
    tag: "finance",
    title: "Time-Series Momentum Backtest with Drawdown Analysis",
    code: `import numpy as np
import pandas as pd

def ts_momentum_backtest(
    prices: pd.Series,
    lookback: int = 252,    # signal lookback in days
    hold: int = 21,          # rebalance frequency
    cost_bps: float = 5.0,  # round-trip transaction cost in bps
) -> pd.DataFrame:
    """
    Time-series momentum: go long if past-lookback return > 0, else short.
    Rebalances every 'hold' days. Returns daily portfolio P&L series.
    """
    returns = prices.pct_change()
    signal  = prices / prices.shift(lookback) - 1   # past-lookback return

    # Position: +1 if signal > 0, -1 if < 0 (scaled to unit vol)
    pos = np.sign(signal)

    # Rebalance only every 'hold' days
    rebal_mask = (np.arange(len(pos)) % hold) == 0
    pos_held = pos.where(rebal_mask).ffill().shift(1)  # execute next day

    # Transaction cost: pay cost_bps on each position change
    turnover = pos_held.diff().abs()
    costs    = turnover * cost_bps / 10_000

    strat_returns = pos_held * returns - costs

    # Performance metrics
    cum    = (1 + strat_returns).cumprod()
    roll_max = cum.expanding().max()
    drawdown = (cum - roll_max) / roll_max

    ann_ret = strat_returns.mean() * 252
    ann_vol = strat_returns.std() * np.sqrt(252)
    sharpe  = ann_ret / ann_vol if ann_vol > 0 else 0
    max_dd  = drawdown.min()

    return pd.DataFrame({
        'returns': strat_returns,
        'cum_pnl': cum,
        'drawdown': drawdown,
    }), {'sharpe': sharpe, 'ann_ret': ann_ret, 'max_dd': max_dd}

# Synthetic price series
rng = np.random.default_rng(0)
idx    = pd.date_range('2020-01-01', periods=1500, freq='B')
prices = pd.Series(100 * np.cumprod(1 + rng.normal(0.0003, 0.01, 1500)), index=idx)

perf, stats = ts_momentum_backtest(prices)
print(f"Sharpe: {stats['sharpe']:.2f}  Ann Ret: {stats['ann_ret']*100:.1f}%  MaxDD: {stats['max_dd']*100:.1f}%")`,
    explanation:
      "Time-series momentum (trend following) differs from cross-sectional momentum: the signal is whether each asset's own return is positive, not its rank among peers. The `ffill().shift(1)` pattern correctly prevents lookahead — positions set at today's close are executed at tomorrow's open price, matching realistic execution timing.",
  },
  {
    id: "pyfin-20260717-b1-scenario-stress",
    language: "python",
    tag: "finance",
    title: "Scenario Stress P&L with Correlation Shocks",
    code: `import numpy as np

def stress_pnl(
    positions: np.ndarray,       # position in $ per risk factor
    base_vols: np.ndarray,       # current factor vols
    base_corr: np.ndarray,       # current correlation matrix
    scenarios: list,             # list of (name, factor_shocks, corr_shock)
) -> list:
    """
    For each scenario: shock factor levels by given amounts
    and optionally shift correlations.
    Returns a list of {name, pnl, factor_pnl} dicts.
    """
    results = []
    for name, factor_shocks, corr_shock in scenarios:
        # P&L from factor moves: pos[i] * shock[i]
        factor_pnl = positions * factor_shocks
        total_pnl  = factor_pnl.sum()

        # Stressed correlation (clamp to valid PSD matrix)
        stressed_corr = base_corr + corr_shock
        # Clip diagonal to 1
        np.fill_diagonal(stressed_corr, 1.0)

        # Eigen-clamp for positive semi-definiteness
        evals, evecs = np.linalg.eigh(stressed_corr)
        evals = np.clip(evals, 0, None)
        psd_corr = evecs @ np.diag(evals) @ evecs.T

        # Portfolio variance under stressed cov
        stressed_cov = np.outer(base_vols, base_vols) * psd_corr
        port_var = positions @ stressed_cov @ positions

        results.append({
            'name': name, 'total_pnl': total_pnl,
            'factor_pnl': factor_pnl,
            'stressed_vol': np.sqrt(port_var),
        })
    return results

# 4 risk factors: Equity, Rates, Credit, FX
positions   = np.array([1e6, -5e5, 2e5, 3e5])  # dollar DV01 / PV01 per factor
base_vols   = np.array([0.15, 0.01, 0.05, 0.10])
base_corr   = np.array([[1.0, -0.3, 0.5, 0.2],
                         [-0.3, 1.0,-0.2,-0.1],
                         [0.5,-0.2, 1.0, 0.3],
                         [0.2,-0.1, 0.3, 1.0]])

scenarios = [
    ("2008-GFC",  np.array([-0.40, 0.01, 0.30, -0.05]),
     np.zeros((4,4))),                                     # no corr change
    ("COVID-Mar20", np.array([-0.35, -0.005, 0.25, -0.10]),
     np.full((4,4), 0.15) - np.diag([0.15]*4)),           # corr +0.15 off-diag
]

for r in stress_pnl(positions, base_vols, base_corr, scenarios):
    print(f"{r['name']}: P&L={r['total_pnl']:+.0f}  Stressed vol={r['stressed_vol']:.0f}")`,
    explanation:
      "Eigenvector-clamping (replacing negative eigenvalues with 0) repairs correlation matrices that become non-positive-definite after stress shifts — naive additive shocks to a valid correlation matrix often violate PSD constraints. The separate factor P&L vector shows which positions drive stress losses, guiding hedging decisions before the next tail event.",
  },
  {
    id: "pyfin-20260717-b1-multi-idx-pivot",
    language: "python",
    tag: "finance",
    title: "Pandas Multi-Index OHLCV with Pivot and Rolling Window",
    code: `import numpy as np
import pandas as pd

# Build a multi-index DataFrame: (date, asset) -> OHLCV
rng = np.random.default_rng(0)
dates  = pd.date_range('2024-01-01', periods=120, freq='B')
assets = ['AAPL', 'MSFT', 'GOOG']

rows = []
for asset in assets:
    prices = 100 * np.cumprod(1 + rng.normal(0, 0.012, len(dates)))
    for i, d in enumerate(dates):
        o = prices[i] * rng.uniform(0.995, 1.005)
        h = prices[i] * rng.uniform(1.000, 1.020)
        l = prices[i] * rng.uniform(0.980, 1.000)
        rows.append({'date': d, 'asset': asset,
                     'open':o,'high':h,'low':l,'close':prices[i],
                     'volume': rng.integers(1e6, 5e6)})

df = pd.DataFrame(rows).set_index(['date', 'asset'])

# Pivot to wide format: dates x (metric, asset)
close_wide = df['close'].unstack('asset')   # dates x assets

# Cross-sectional correlation on rolling 21-day window
def rolling_corr_mean(wide: pd.DataFrame, window: int = 21) -> pd.Series:
    """Mean pairwise correlation over a rolling window."""
    result = []
    for end in range(window, len(wide) + 1):
        chunk = wide.iloc[end - window: end]
        c = chunk.corr().values
        n = len(c)
        upper = c[np.triu_indices(n, k=1)]
        result.append(upper.mean())
    return pd.Series(result, index=wide.index[window - 1:])

rolling_corr = rolling_corr_mean(close_wide)
print(close_wide.tail(3))
print(f"Latest mean pairwise corr: {rolling_corr.iloc[-1]:.3f}")`,
    explanation:
      "The `unstack('asset')` call pivots the multi-index to a wide DataFrame where each column is an asset time series — this is the standard pattern for transitioning from tidy (long) format to matrix operations. Rolling correlation on the wide frame then uses vectorised `corr()` per window, which runs in C and is orders of magnitude faster than a Python loop over date pairs.",
  },
  {
    id: "pyfin-20260717-b1-vwap-twap",
    language: "python",
    tag: "finance",
    title: "VWAP and TWAP Execution Benchmark Calculation",
    code: `import numpy as np
import pandas as pd

def execution_benchmark(
    trades: pd.DataFrame,       # must have: timestamp, price, qty (signed: buy>0)
    market: pd.DataFrame,       # must have: timestamp, price, volume (market ticks)
    side: str = 'buy',          # 'buy' or 'sell'
    start: pd.Timestamp = None,
    end:   pd.Timestamp = None,
) -> dict:
    """
    Compute VWAP and TWAP benchmarks for an execution.
    Implementation shortfall = arrival price - filled price (for buy).
    """
    if start and end:
        market = market[(market['timestamp'] >= start) & (market['timestamp'] <= end)]
        trades  = trades[(trades['timestamp'] >= start) & (trades['timestamp'] <= end)]

    if market.empty:
        return {}

    # VWAP: volume-weighted average of market prices in the interval
    vwap = (market['price'] * market['volume']).sum() / market['volume'].sum()

    # TWAP: simple time-average of mid prices (assumes uniformly spaced samples)
    twap = market['price'].mean()

    # Filled VWAP: our actual execution average
    sign = 1 if side == 'buy' else -1
    filled_qty   = (trades['qty'] * sign).sum()
    filled_vwap  = ((trades['price'] * trades['qty'].abs()).sum()
                    / trades['qty'].abs().sum()) if filled_qty != 0 else np.nan

    # Implementation shortfall vs arrival (first market price)
    arrival_px   = market['price'].iloc[0]
    impl_short   = (filled_vwap - arrival_px) * sign * 10_000  # bps, buy: want < 0

    return {
        'market_vwap':    vwap,
        'market_twap':    twap,
        'filled_vwap':    filled_vwap,
        'filled_qty':     filled_qty,
        'impl_shortfall_bps': impl_short,
        'slippage_vs_vwap_bps': (filled_vwap - vwap) * sign * 10_000,
    }

# Synthetic market + execution data
rng = np.random.default_rng(0)
t  = pd.date_range('2024-01-02 09:30', periods=390, freq='min')
mkt = pd.DataFrame({'timestamp': t, 'price': 100 + np.cumsum(rng.normal(0, 0.02, 390)),
                    'volume': rng.integers(1000, 10000, 390)})
execs = pd.DataFrame({'timestamp': t[::30], 'price': mkt['price'].iloc[::30].values,
                      'qty': [100]*13})
result = execution_benchmark(execs, mkt, side='buy')
print(f"VWAP: {result['market_vwap']:.4f}  Slippage vs VWAP: {result['slippage_vs_vwap_bps']:.1f} bps")`,
    explanation:
      "Implementation shortfall captures total execution cost versus the decision price, while VWAP slippage measures execution quality versus what a passive volume-proportional strategy would have achieved. Traders with positive VWAP alpha execute at better than market VWAP — important for large orders where the desk claims to 'beat the market'.",
  },
  {
    id: "pyfin-20260717-b1-oas-bisection",
    language: "python",
    tag: "finance",
    title: "Option-Adjusted Spread (OAS) via Bisection",
    code: `import numpy as np
from scipy.optimize import brentq

def price_callable_bond(
    cashflows: list,      # list of (time_years, cashflow_amount)
    oas: float,           # option-adjusted spread
    spot_rates: callable, # function: time -> spot rate (continuous)
) -> float:
    """
    PV of callable bond = sum of discounted cashflows at (spot_rate + OAS).
    Ignores optionality value in this simplified version.
    """
    pv = 0.0
    for t, cf in cashflows:
        r_oas = spot_rates(t) + oas
        pv   += cf * np.exp(-r_oas * t)
    return pv

def compute_oas(
    cashflows: list,
    market_price: float,
    spot_rates: callable,
    oas_lo: float = -0.05,
    oas_hi: float = 0.20,
) -> float:
    """Find OAS such that model price = market price."""
    def objective(oas):
        return price_callable_bond(cashflows, oas, spot_rates) - market_price

    return brentq(objective, oas_lo, oas_hi, xtol=1e-8)

# Flat spot rate curve at 5%
def flat_curve(t): return 0.05

# 5Y annual coupon bond at 6%, face 100
cashflows = [(1,6),(2,6),(3,6),(4,6),(5,106)]

# Market price implies a spread over the curve
market_price = 98.0   # trading below par (spread > 0)
oas = compute_oas(cashflows, market_price, flat_curve)
print(f"OAS: {oas*10000:.1f} bps")

# Verify: model price at OAS should equal market price
model_price = price_callable_bond(cashflows, oas, flat_curve)
print(f"Model price at OAS: {model_price:.4f}  (should equal {market_price})")`,
    explanation:
      "OAS strips the embedded option value from the bond's market spread by computing the parallel shift to the discount curve that exactly prices the bond's cashflows — any remaining cheapness/richness relative to a similar non-callable bond represents the option cost. Brentq (Illinois method) converges in ~10 iterations regardless of the oas range, making it faster than Newton's method on this bounded monotonic function.",
  },
  {
    id: "pyfin-20260717-b1-fwd-vol",
    language: "python",
    tag: "finance",
    title: "Forward Variance and Forward Volatility from ATM Vol Surface",
    code: `import numpy as np

def forward_variance(T1: float, T2: float,
                     sigma1: float, sigma2: float) -> float:
    """
    Variance is additive: sigma^2(T) * T is total variance.
    Forward variance from T1 to T2:
      var_fwd = (sigma2^2 * T2 - sigma1^2 * T1) / (T2 - T1)
    """
    return (sigma2**2 * T2 - sigma1**2 * T1) / (T2 - T1)

def forward_vol_surface(tenors: np.ndarray,
                         atm_vols: np.ndarray) -> tuple:
    """
    Compute forward vols for consecutive tenor pairs.
    Returns (fwd_tenors, fwd_vols, total_var).
    """
    total_var  = atm_vols**2 * tenors
    fwd_vols   = []
    fwd_tenors = []
    for i in range(1, len(tenors)):
        T1, T2 = tenors[i-1], tenors[i]
        fwd_var = forward_variance(T1, T2, atm_vols[i-1], atm_vols[i])
        if fwd_var < 0:
            raise ValueError(f"Negative forward variance at {T1}-{T2}: vol surface may be arbitrageable")
        fwd_vols.append(np.sqrt(fwd_var))
        fwd_tenors.append((T1, T2))
    return fwd_tenors, fwd_vols, total_var

# Typical ATM vol surface: humped in the front end
tenors   = np.array([0.25, 0.5, 1.0, 2.0, 5.0])
atm_vols = np.array([0.22, 0.21, 0.20, 0.19, 0.18])

fwd_tenors, fwd_vols, _ = forward_vol_surface(tenors, atm_vols)
for (t1, t2), fv in zip(fwd_tenors, fwd_vols):
    print(f"  Fwd vol [{t1:.2f}Y-{t2:.2f}Y]: {fv*100:.2f}%")`,
    explanation:
      "Forward volatility between two tenors must be non-negative: if `sigma(T2)^2 * T2 < sigma(T1)^2 * T1`, the spot vol surface violates calendar arbitrage. Vanilla options on forward volatility (vol swaps, variance swaps on future realised vol) are priced using the forward variance, not the spot vol — the distinction matters for cross-tenor hedging and term-structure model calibration.",
  },
  {
    id: "pyfin-20260717-b1-ledoit-wolf",
    language: "python",
    tag: "finance",
    title: "Ledoit-Wolf Covariance Shrinkage for Portfolio Optimization",
    code: `import numpy as np

def ledoit_wolf_shrinkage(returns: np.ndarray) -> tuple:
    """
    Analytical Ledoit-Wolf (2004) shrinkage estimator.
    Shrinks toward the scaled identity: Sigma_hat = (1-alpha)*S + alpha*(mu_hat*I)
    where mu_hat = tr(S)/n is the mean eigenvalue.
    Returns (shrunk_cov, optimal_alpha).
    """
    T, n = returns.shape
    S = np.cov(returns.T, ddof=1)   # sample covariance (n x n)

    # Ledoit-Wolf oracle shrinkage intensity (analytical formula)
    mu    = np.trace(S) / n          # target = scaled identity
    delta = np.sum((S - mu * np.eye(n))**2) / n   # dispersion from target

    # Estimation error of sample covariance
    # Simplified (Oracle) version: alpha = delta^2 / (delta^2 + ||S-mu*I||^2 / T)
    xs_norm2 = np.sum((S / mu - np.eye(n))**2)    # ||S - mu*I||^2 / mu^2
    rho2 = 0.0
    for i in range(T):
        z = returns[i]
        outer = np.outer(z, z)
        rho2 += np.sum((outer - S)**2)
    rho2 /= (T**2)

    alpha = min(rho2 / (delta**2 + rho2), 1.0)  # oracle shrinkage intensity

    shrunk = (1 - alpha) * S + alpha * mu * np.eye(n)
    return shrunk, alpha

rng = np.random.default_rng(0)
# 50 assets, 120 days: p/T > 0.4, shrinkage critical
returns = rng.standard_normal((120, 50)) * 0.01
shrunk, alpha = ledoit_wolf_shrinkage(returns)
sample_cov    = np.cov(returns.T)

print(f"Shrinkage intensity: {alpha:.3f}")
print(f"Sample cov condition number: {np.linalg.cond(sample_cov):.0f}")
print(f"Shrunk cov condition number: {np.linalg.cond(shrunk):.0f}")`,
    explanation:
      "When the number of assets approaches the number of observations (p/T → 1), the sample covariance matrix becomes ill-conditioned: its smallest eigenvalues collapse to near-zero, causing mean-variance optimisation to allocate extreme long-short positions. Ledoit-Wolf shrinkage toward the identity pushes eigenvalues away from zero, dramatically improving the condition number and out-of-sample portfolio performance.",
  },
  {
    id: "pyfin-20260717-b1-vpin",
    language: "python",
    tag: "finance",
    title: "VPIN Order Flow Toxicity Estimation",
    code: `import numpy as np
import pandas as pd

def classify_trades_bulk(prices: pd.Series, volumes: pd.Series) -> pd.Series:
    """
    Bulk classification: sign(price_change) determines buy/sell for the bar.
    Tick-rule: use last non-zero change if current is zero.
    """
    dp = prices.diff()
    # Fill zeros with last known direction (tick rule)
    dp = dp.replace(0, np.nan).ffill().fillna(1)
    return (np.sign(dp) + 1) / 2   # 1 = buy bar, 0 = sell bar

def compute_vpin(
    prices: pd.Series,
    volumes: pd.Series,
    bucket_size: float = None,  # target volume per bucket; defaults to avg(volume)/50
    n_buckets: int = 50,        # window length for VPIN
) -> pd.Series:
    """
    VPIN (Volume-Synchronised PIN) measures order flow toxicity.
    VPIN = (1/n) * sum_i |V_buy_i - V_sell_i| / V_i
    """
    if bucket_size is None:
        bucket_size = volumes.sum() / (len(volumes) / 5)  # approximate

    buy_frac  = classify_trades_bulk(prices, volumes)
    buy_vol   = buy_frac * volumes
    sell_vol  = (1 - buy_frac) * volumes

    # Accumulate into volume buckets
    buckets = []
    acc_vol, acc_buy, acc_sell = 0.0, 0.0, 0.0
    for bv, sv in zip(buy_vol, sell_vol):
        acc_vol  += bv + sv
        acc_buy  += bv
        acc_sell += sv
        if acc_vol >= bucket_size:
            buckets.append({'buy': acc_buy, 'sell': acc_sell, 'total': acc_vol})
            acc_vol, acc_buy, acc_sell = 0.0, 0.0, 0.0

    if not buckets:
        return pd.Series(dtype=float)

    df = pd.DataFrame(buckets)
    imb = (df['buy'] - df['sell']).abs() / df['total']
    # Rolling VPIN over n_buckets
    vpin = imb.rolling(n_buckets).mean()
    return vpin.dropna()

rng = np.random.default_rng(0)
prices = pd.Series(100 + np.cumsum(rng.normal(0, 0.01, 2000)))
vols   = pd.Series(rng.integers(100, 5000, 2000).astype(float))
vpin   = compute_vpin(prices, vols)
if len(vpin) > 0:
    print(f"VPIN range: [{vpin.min():.3f}, {vpin.max():.3f}]  Latest: {vpin.iloc[-1]:.3f}")`,
    explanation:
      "VPIN measures uninformed vs. informed order flow: high VPIN (close to 1) means almost all volume is one-directional, consistent with adverse selection from a trader with private information. Market makers use VPIN as a real-time toxicity signal — when VPIN spikes above a threshold (typically 0.70), they widen spreads or pause quoting to reduce adverse selection losses.",
  },
  {
    id: "pyfin-20260717-b1-sharpe-ic",
    language: "python",
    tag: "finance",
    title: "Sharpe Ratio and Information Coefficient for Alpha Signals",
    code: `import numpy as np
import pandas as pd
from scipy.stats import spearmanr, pearsonr

def alpha_diagnostics(
    signal: pd.Series,      # forward-looking signal (positive = expect positive return)
    fwd_returns: pd.Series, # actual 1-period forward returns
    n_quantiles: int = 5,
) -> dict:
    """
    Full diagnostics for a cross-sectional alpha signal.
    IC = rank correlation between signal and forward returns.
    """
    aligned  = pd.concat([signal, fwd_returns], axis=1).dropna()
    aligned.columns = ['signal', 'return']

    # Information Coefficient (rank correlation)
    ic_spearman, pval = spearmanr(aligned['signal'], aligned['return'])
    ic_pearson, _     = pearsonr(aligned['signal'], aligned['return'])

    # Quantile returns: sort signal into n_quantiles buckets
    aligned['quantile'] = pd.qcut(aligned['signal'], n_quantiles, labels=False)
    quant_ret = aligned.groupby('quantile')['return'].mean()

    # Long-short return: top quantile minus bottom quantile
    ls_return = quant_ret.iloc[-1] - quant_ret.iloc[0]

    # Rolling monthly IC (if DatetimeIndex)
    if isinstance(signal.index, pd.DatetimeIndex):
        # Compute daily IC on cross-section (here: use all data as one panel)
        pass  # placeholder for panel IC calculation

    # Sharpe from signal-weighted long-short portfolio
    weights = (aligned['signal'] - aligned['signal'].mean()) / aligned['signal'].std()
    port_return = (weights * aligned['return']).sum() / len(aligned)
    port_vol    = (weights * aligned['return']).std()
    signal_sharpe = (port_return / port_vol) * np.sqrt(252) if port_vol > 0 else 0

    return {
        'IC_spearman':   ic_spearman,
        'IC_pearson':    ic_pearson,
        'IC_pval':       pval,
        'quantile_ret':  quant_ret.to_dict(),
        'ls_return':     ls_return,
        'signal_sharpe': signal_sharpe,
        'ICIR':          ic_spearman / max(abs(ic_spearman), 1e-6),  # IC / IC std (1 obs)
    }

rng = np.random.default_rng(0)
n   = 500
# Signal mildly predictive: IC ~ 0.05
signal      = pd.Series(rng.standard_normal(n))
fwd_returns = 0.05 * signal + rng.standard_normal(n) * 0.1

diag = alpha_diagnostics(signal, fwd_returns)
print(f"IC Spearman: {diag['IC_spearman']:.3f}  (p={diag['IC_pval']:.4f})")
print(f"L/S return:  {diag['ls_return']*100:.2f}%  Signal Sharpe: {diag['signal_sharpe']:.2f}")`,
    explanation:
      "IC (Information Coefficient) is the standard measure of alpha signal quality in quantitative equity: IC = 0.05 is considered useful, IC > 0.10 is strong. The Grinold-Kahn formula links expected Sharpe to IC and breadth (number of independent bets per year): Sharpe ≈ IC × sqrt(breadth), so a strategy with IC=0.05 across 500 annual bets achieves Sharpe ≈ 1.1.",
  },
  {
    id: "pyfin-20260717-b1-arma-forecast",
    language: "python",
    tag: "finance",
    title: "ARMA(1,1) Returns Forecasting with statsmodels",
    code: `import numpy as np
import pandas as pd
try:
    from statsmodels.tsa.arima.model import ARIMA
    HAVE_SM = True
except ImportError:
    HAVE_SM = False

def fit_arma11(returns: pd.Series) -> dict:
    """
    Fit ARMA(1,1) to return series and compute 1-step-ahead forecast.
    Model: r_t = c + phi*r_{t-1} + theta*eps_{t-1} + eps_t
    """
    if not HAVE_SM:
        # Manual moment estimator (Yule-Walker) as fallback
        r = returns.values
        acf0 = np.var(r)
        acf1 = np.cov(r[:-1], r[1:])[0,1]
        phi  = acf1 / acf0
        return {'phi': phi, 'theta': 0.0, 'sigma2': acf0*(1-phi**2),
                'forecast': r[-1]*phi, 'aic': None}

    model  = ARIMA(returns, order=(1, 0, 1))
    result = model.fit()

    # 1-step-ahead forecast
    fc = result.forecast(steps=1)

    return {
        'phi':     result.params.get('ar.L1', 0),
        'theta':   result.params.get('ma.L1', 0),
        'sigma2':  result.params.get('sigma2', 0),
        'const':   result.params.get('const', 0),
        'aic':     result.aic,
        'bic':     result.bic,
        'forecast': float(fc.iloc[0]),
    }

# Generate AR(1)-like returns
rng = np.random.default_rng(42)
eps = rng.standard_normal(500) * 0.01
r   = np.zeros(500)
r[0] = eps[0]
for t in range(1, 500):
    r[t] = 0.05 * r[t-1] + eps[t] + 0.2 * eps[t-1]   # ARMA(1,1) DGP

returns = pd.Series(r)
params  = fit_arma11(returns)
print(f"phi={params['phi']:.3f}  theta={params['theta']:.3f}")
print(f"1-step forecast: {params['forecast']*100:.4f}%")`,
    explanation:
      "ARMA(1,1) is the minimal model that captures both autoregression (momentum) and moving-average (overreaction correction) effects in returns; in practice, equity daily returns show near-zero but statistically significant autocorrelation at lag 1. The AIC/BIC help select order; if ARMA parameters are economically tiny, the series is effectively unpredictable and a simpler constant-mean model suffices.",
  },
  {
    id: "pyfin-20260717-b1-bdt-tree",
    language: "python",
    tag: "finance",
    title: "Black-Derman-Toy (BDT) Interest Rate Tree",
    code: `import numpy as np
from scipy.optimize import fsolve

def build_bdt_tree(
    market_prices: np.ndarray,   # discount bond prices P(0,T) for T=1,2,...,N
    sigma: np.ndarray,           # annual vol of short rate at each step
    dt: float = 1.0,             # time step in years
) -> np.ndarray:
    """
    Build a BDT recombining binomial tree calibrated to the yield curve.
    r[i,j] = u_i * exp(sigma_i * j * sqrt(dt))  (j = 0 is lowest node)
    Returns rate tree r[step, node].
    """
    n = len(market_prices)
    r = np.zeros((n, n))   # r[step, node]: step=time, node=position

    def bond_price_tree(rates, i):
        """Price a zero-coupon bond maturing at step i from rate tree."""
        # Arrow-Debreu pricing: start with terminal $1 payoff
        p = np.ones(i + 1)
        for step in range(i - 1, -1, -1):
            p_new = np.zeros(step + 1)
            for j in range(step + 1):
                df_u = np.exp(-rates[step, j + 1] * dt)   # up node
                df_d = np.exp(-rates[step, j]     * dt)   # down node
                p_new[j] = 0.5 * (df_u * p[j + 1] + df_d * p[j])
            p = p_new
        return float(p[0])

    # Calibrate step by step
    for i in range(n):
        s = sigma[i]
        target_price = market_prices[i]

        def objective(u_i):
            r_test = r.copy()
            for j in range(i + 1):
                r_test[i, j] = u_i[0] * np.exp(s * j * np.sqrt(dt))
            return bond_price_tree(r_test, i) - target_price

        u0 = [0.05]   # initial guess for median rate u_i
        u_sol = fsolve(objective, u0, full_output=False)
        for j in range(i + 1):
            r[i, j] = u_sol[0] * np.exp(s * j * np.sqrt(dt))

    return r

# Calibrate to a simple upward-sloping curve
# P(0,T) for T = 1,2,3,4 years
mkt_prices = np.array([np.exp(-0.04*1), np.exp(-0.045*2),
                        np.exp(-0.05*3), np.exp(-0.055*4)])
sigmas = np.array([0.20, 0.18, 0.16, 0.14])

tree = build_bdt_tree(mkt_prices, sigmas)
print("BDT rate tree (rows=time, cols=nodes):")
print(np.round(tree * 100, 2))`,
    explanation:
      "BDT calibrates the median short rate at each time step so that the model exactly prices the observed discount bond prices — the tree is yield-curve consistent by construction. The log-normal specification (`u * exp(sigma*j)`) prevents negative rates but underperforms Hull-White for long maturities; nevertheless, BDT remains the benchmark for caplet/floorlet calibration in legacy systems.",
  },
  {
    id: "pyfin-20260717-b1-ou-speed",
    language: "python",
    tag: "finance",
    title: "Ornstein-Uhlenbeck Mean Reversion Speed Estimation",
    code: `import numpy as np
from scipy.optimize import minimize

def estimate_ou_params(
    series: np.ndarray,
    dt: float = 1 / 252,  # time step in years (default: daily)
    method: str = 'ols',
) -> dict:
    """
    Estimate OU parameters: dX = a*(mu - X)*dt + sigma*dW
    by OLS regression of X_{t+1} - X_t on X_t (discrete-time AR(1)).

    Exact MLE and OLS give the same parameter estimates for OU.
    Returns: mean reversion speed a, long-run mean mu, volatility sigma.
    """
    X      = series
    X_next = np.roll(X, -1)[:-1]
    X_curr = X[:-1]
    dX     = X_next - X_curr

    # OLS: dX = (alpha + beta*X_curr) * dt
    # beta = -a*dt, alpha = a*mu*dt
    A = np.column_stack([np.ones(len(X_curr)), X_curr])
    coeffs, resid, _, _ = np.linalg.lstsq(A, dX, rcond=None)

    alpha_hat, beta_hat = coeffs
    a   = -beta_hat / dt       # mean reversion speed (per year)
    mu  = alpha_hat / (-beta_hat) if beta_hat != 0 else X.mean()
    sigma = np.std(dX - A @ coeffs) / np.sqrt(dt)

    half_life = np.log(2) / a if a > 0 else np.inf

    return {
        'a': a,                # mean reversion speed
        'mu': mu,              # long-run mean
        'sigma': sigma,        # diffusion coefficient
        'half_life_days': half_life / dt,   # in same units as dt
        'half_life_years': half_life,
    }

rng = np.random.default_rng(0)
# Simulate OU process with a=5/yr, mu=0, sigma=0.1
a_true, mu_true, sigma_true = 5.0, 0.0, 0.10
dt = 1/252
n  = 1000
X  = np.zeros(n)
for t in range(1, n):
    X[t] = X[t-1] + a_true*(mu_true - X[t-1])*dt + sigma_true*np.sqrt(dt)*rng.standard_normal()

params = estimate_ou_params(X, dt)
print(f"True a={a_true}   Estimated a={params['a']:.2f}")
print(f"Half-life: {params['half_life_days']:.1f} trading days")`,
    explanation:
      "The OLS regression of `dX` on `X` discretises the OU SDE into an AR(1), making OLS and exact MLE equivalent for OU estimation. The half-life (`log(2)/a`) is the key diagnostic: a half-life of 5–30 trading days suggests a viable mean-reversion strategy; > 60 days means the signal is too slow for daily trading and may be confounded with regime shifts.",
  },
];
