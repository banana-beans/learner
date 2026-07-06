import type { Snippet } from "./types";

export const pythonFinanceSnippets20260706B1: Snippet[] = [
  {
    id: "pyfin-20260706-b1-sabr-model",
    language: "python",
    title: "SABR Stochastic Vol Model: Implied Vol via Hagan Formula",
    tag: "finance",
    code: `import numpy as np

def sabr_implied_vol(
    F: float,      # forward price
    K: float,      # strike
    T: float,      # time to expiry (years)
    alpha: float,  # initial vol (SABR param)
    beta: float,   # CEV exponent in [0,1]
    rho: float,    # correlation between F and vol
    nu: float,     # vol-of-vol
) -> float:
    """Hagan et al. (2002) SABR approximation for implied vol."""
    if abs(F - K) < 1e-12:  # ATM formula
        FK_beta = F ** (1 - beta)
        logFK2  = 0.0
        A = alpha / FK_beta
        B = 1 + ((1-beta)**2/24 * alpha**2/FK_beta**2
                 + rho*beta*nu*alpha/(4*FK_beta)
                 + (2-3*rho**2)/24 * nu**2) * T
        return A * B

    log_FK = np.log(F / K)
    FK_mid = (F * K) ** ((1 - beta) / 2)
    z      = nu / alpha * FK_mid * log_FK
    chi    = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    A = alpha / (FK_mid * (1
        + (1-beta)**2/24 * log_FK**2
        + (1-beta)**4/1920 * log_FK**4))

    B = z / chi if abs(chi) > 1e-12 else 1.0

    C = 1 + ((1-beta)**2/24 * alpha**2/FK_mid**2
             + rho*beta*nu*alpha/(4*FK_mid)
             + (2-3*rho**2)/24 * nu**2) * T

    return A * B * C

# SABR smile for EURUSD 3M options
F = 1.10; T = 0.25; alpha = 0.02; beta = 0.5; rho = -0.1; nu = 0.3
for K in [1.05, 1.08, 1.10, 1.12, 1.15]:
    iv = sabr_implied_vol(F, K, T, alpha, beta, rho, nu)
    print(f"K={K:.2f}  IV={iv:.4f}")`,
    explanation:
      "SABR's key advantage over Black-Scholes is that it produces a natural implied-vol smile by coupling the forward's CEV dynamics (beta) with a mean-reverting stochastic vol process (nu); rho controls skew — negative rho gives the equity left-skew where downside strikes are more expensive. The Hagan closed-form approximation is accurate to O(T²) and fast enough for real-time risk re-pricing across thousands of strikes.",
  },
  {
    id: "pyfin-20260706-b1-local-vol-dupire",
    language: "python",
    title: "Dupire Local Volatility Surface from Call Prices",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(
    strikes: np.ndarray,    # shape (NK,)
    maturities: np.ndarray, # shape (NT,)
    call_prices: np.ndarray,# shape (NT, NK) — market call prices C(T, K)
    S0: float,
    r: float,
) -> callable:
    """
    Dupire formula: sigma_loc^2(T,K) = (dC/dT + r*K*dC/dK)
                                        / (0.5*K^2*d^2C/dK^2)
    Returns an interpolant sigma_loc(T, K).
    """
    # Fit 2D spline over (T, K) grid — must be smooth for reliable derivatives
    spline = RectBivariateSpline(maturities, strikes, call_prices, kx=3, ky=3)

    def local_vol(T: float, K: float) -> float:
        dC_dT  = spline(T, K, dx=1, dy=0)[0, 0]
        dC_dK  = spline(T, K, dx=0, dy=1)[0, 0]
        d2C_dK2= spline(T, K, dx=0, dy=2)[0, 0]
        numer  = dC_dT + r * K * dC_dK
        denom  = 0.5 * K**2 * d2C_dK2
        if abs(denom) < 1e-10 or numer / denom < 0:
            return np.nan
        return np.sqrt(numer / denom)

    return local_vol

# Synthetic example
Ks = np.linspace(80, 120, 20)
Ts = np.array([0.25, 0.5, 1.0, 2.0])
from scipy.stats import norm
def bs_call(S, K, T, r, sig):
    d1 = (np.log(S/K) + (r + 0.5*sig**2)*T) / (sig*np.sqrt(T))
    d2 = d1 - sig*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

S0, r = 100.0, 0.03
prices = np.array([[bs_call(S0, K, T, r, 0.20 + 0.01*(K-100)/10) for K in Ks]
                   for T in Ts])

lv = dupire_local_vol(Ks, Ts, prices, S0, r)
print(f"Local vol at T=0.5, K=100: {lv(0.5, 100.0):.4f}")`,
    explanation:
      "Dupire's equation extracts the unique local volatility surface consistent with all observed call prices simultaneously — it's the deterministic sigma(T,K) that makes the risk-neutral diffusion reproduce every market option price. In practice the double differentiation of market prices amplifies noise, so the spline must be regularized (tension splines, SVI parameterization) before differentiating.",
  },
  {
    id: "pyfin-20260706-b1-svensson-curve",
    language: "python",
    title: "Svensson Term Structure Calibration via scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_rate(tau: np.ndarray, b0, b1, b2, b3, l1, l2) -> np.ndarray:
    """Svensson (1994): extends Nelson-Siegel with a second hump term."""
    x1, x2 = tau / l1, tau / l2
    e1, e2  = np.exp(-x1), np.exp(-x2)
    f1 = (1 - e1) / x1          # NS slope loading
    f2 = f1 - e1                 # NS curvature loading
    f3 = (1 - e2) / x2 - e2     # second hump loading
    return b0 + b1 * f1 + b2 * f2 + b3 * f3

def calibrate_svensson(maturities: np.ndarray, yields: np.ndarray):
    """Calibrate 6 Svensson params to observed zero yields."""
    def objective(params):
        b0, b1, b2, b3, l1, l2 = params
        if l1 <= 0 or l2 <= 0 or b0 <= 0:
            return 1e9
        fitted = svensson_rate(maturities, *params)
        return np.sum((fitted - yields) ** 2)

    # Initial guess: rough market intuition
    x0 = [0.04, -0.02, 0.01, 0.01, 2.0, 5.0]
    bounds = [(0.001, 0.20), (-0.15, 0.15), (-0.15, 0.15),
              (-0.15, 0.15), (0.01, 30.0), (0.01, 30.0)]
    res = minimize(objective, x0, method='L-BFGS-B', bounds=bounds)
    return res.x, res.fun

# Example: US Treasury-style zero curve
mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.048, 0.049, 0.047, 0.044, 0.042, 0.040,
                   0.039, 0.038, 0.036, 0.035])

params, rmse = calibrate_svensson(mats, yields)
b0, b1, b2, b3, l1, l2 = params
print(f"Long rate b0={b0:.4f}, slope b1={b1:.4f}, RMSE={rmse:.2e}")
for t in [1, 5, 10, 30]:
    print(f"  r({t}Y) = {svensson_rate(np.array([t]), *params)[0]:.4f}")`,
    explanation:
      "Svensson adds a second exponential term to Nelson-Siegel, giving it two humps to capture the typical dip-and-rise pattern seen in sovereign yield curves around the 5-10 year region. Central banks (ECB, Bundesbank) publish daily Svensson parameters for their official yield curves — the six parameters are the canonical lingua franca of fixed-income risk systems.",
  },
  {
    id: "pyfin-20260706-b1-regime-switching",
    language: "python",
    title: "Hidden Markov Regime-Switching Returns Model",
    tag: "finance",
    code: `import numpy as np
from hmmlearn import hmm

def fit_regime_model(returns: np.ndarray, n_regimes: int = 2):
    """
    Fit a Gaussian HMM to daily returns.
    Returns model and regime sequence.
    """
    model = hmm.GaussianHMM(
        n_components=n_regimes,
        covariance_type="full",
        n_iter=100,
        random_state=42,
    )
    obs = returns.reshape(-1, 1)
    model.fit(obs)

    regimes = model.predict(obs)
    probs   = model.predict_proba(obs)  # P(state | observations)

    # Label states by mean return (low=0 bear, high=1 bull)
    state_means = model.means_.flatten()
    order = np.argsort(state_means)   # ascending: bear first

    regime_stats = {}
    for rank, state in enumerate(order):
        mask = regimes == state
        regime_stats[rank] = {
            "mean":  state_means[state],
            "std":   np.sqrt(model.covars_[state, 0, 0]),
            "frac":  mask.mean(),
        }

    return model, regimes, regime_stats, probs

# Simulate two-regime returns
rng = np.random.default_rng(0)
bull = rng.normal(0.001, 0.01, 500)   # +10 bps/day, 1% vol
bear = rng.normal(-0.002, 0.025, 200) # -20 bps/day, 2.5% vol
returns = np.concatenate([bull, bear, bull[:100]])

model, regimes, stats, probs = fit_regime_model(returns)
for r, s in stats.items():
    label = "Bear" if r == 0 else "Bull"
    print(f"{label}: mean={s['mean']:.4f} std={s['std']:.4f} frac={s['frac']:.2%}")`,
    explanation:
      "Hidden Markov Models for regime detection are superior to threshold rules (e.g. VIX > 30 = bear) because they jointly estimate transition probabilities and emission distributions from data, producing a probabilistic regime assignment at each date rather than a hard binary. The posterior state probability (predict_proba) is used in practice to scale position sizing continuously rather than switching allocations on/off.",
  },
  {
    id: "pyfin-20260706-b1-evt-tail-risk",
    language: "python",
    title: "Extreme Value Theory (EVT) Tail Risk via Peaks-Over-Threshold",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
import matplotlib
matplotlib.use("Agg")

def pot_var_es(
    losses: np.ndarray,  # positive = loss
    confidence: float = 0.99,
    threshold_pct: float = 0.90,
) -> dict:
    """
    Peaks-Over-Threshold (POT) method:
    1. Set threshold u at the (threshold_pct) quantile of losses.
    2. Fit a Generalized Pareto Distribution to exceedances.
    3. Extrapolate VaR and ES beyond the empirical range.
    """
    u = np.quantile(losses, threshold_pct)
    exceedances = losses[losses > u] - u  # GPD is fitted to excess losses

    # MLE fit: shape xi (tail index), scale sigma
    xi, loc, sigma = genpareto.fit(exceedances, floc=0)

    n  = len(losses)
    nu = len(exceedances)     # number of threshold exceedances

    alpha = 1 - confidence
    # VaR_p = u + sigma/xi * ((n/nu * 1/alpha)^xi - 1)
    if abs(xi) < 1e-9:       # Exponential tail
        var = u + sigma * np.log(n / (nu * alpha))
    else:
        var = u + sigma / xi * ((n / (nu * alpha)) ** xi - 1)

    # Expected Shortfall: ES = (VaR + sigma - xi*u) / (1 - xi)
    if xi < 1:
        es = (var + sigma - xi * u) / (1 - xi)
    else:
        es = np.inf  # infinite ES if xi >= 1

    return {
        "threshold": u,
        "xi_shape": xi,
        "sigma_scale": sigma,
        "VaR": var,
        "ES": es,
        "n_exceedances": nu,
    }

# Daily P&L losses for a hypothetical portfolio
rng = np.random.default_rng(42)
losses = rng.exponential(scale=10_000, size=2000)  # fat-tailed losses
result = pot_var_es(losses, confidence=0.99)
for k, v in result.items():
    print(f"  {k:20s}: {v:.4f}" if isinstance(v, float) else f"  {k:20s}: {v}")`,
    explanation:
      "EVT's peaks-over-threshold method is the theoretically justified approach for tail risk estimation because the Pickands-Balkema-de Haan theorem guarantees that exceedances over a high threshold converge to a GPD regardless of the underlying return distribution. The shape parameter xi is the key output: xi > 0 indicates heavy tails (Pareto-like), xi < 0 bounded tails, and xi = 0 exponential — equity returns typically show xi ≈ 0.3-0.5.",
  },
  {
    id: "pyfin-20260706-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion: Optimal Bet Sizing and Fractional Kelly",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction_binary(p_win: float, b: float, a: float = 1.0) -> float:
    """
    Kelly fraction for binary outcome:
    f* = (b*p - a*q) / (a*b)  where q = 1-p, a=loss fraction.
    """
    q = 1 - p_win
    return (b * p_win - a * q) / (a * b)

def kelly_continuous(returns: np.ndarray, n_bootstrap: int = 500) -> dict:
    """
    Continuous Kelly for a strategy with historical returns:
    Maximise E[log(1 + f*r)] over f in [0, 1].
    Bootstrap to get confidence interval on f*.
    """
    def neg_log_growth(f: float, ret: np.ndarray) -> float:
        growth = np.log1p(f * ret)
        if np.any(1 + f * ret <= 0):
            return 1e9
        return -growth.mean()

    res = minimize_scalar(
        neg_log_growth, args=(returns,),
        bounds=(0.0, 2.0), method='bounded'
    )
    f_star = res.x

    # Bootstrap confidence interval
    rng = np.random.default_rng(0)
    boot_f = []
    for _ in range(n_bootstrap):
        sample = rng.choice(returns, size=len(returns), replace=True)
        r = minimize_scalar(neg_log_growth, args=(sample,),
                            bounds=(0.0, 2.0), method='bounded')
        boot_f.append(r.x)

    return {
        "f_star": f_star,
        "half_kelly": f_star / 2,
        "ci_95": (np.percentile(boot_f, 2.5), np.percentile(boot_f, 97.5)),
    }

# Binary bet: 60% win, 2:1 payoff
f_bin = kelly_fraction_binary(p_win=0.60, b=2.0)
print(f"Binary Kelly: {f_bin:.3f}")  # 0.4

# Continuous Kelly from daily strategy returns
rng = np.random.default_rng(1)
rets = rng.normal(0.001, 0.02, 1000)
result = kelly_continuous(rets)
print(f"Continuous Kelly f*= {result['f_star']:.4f}")
print(f"Half-Kelly (practical): {result['half_kelly']:.4f}")
print(f"95% CI: {result['ci_95']}")`,
    explanation:
      "Full Kelly maximizes long-run geometric growth but requires exact knowledge of the return distribution and produces aggressive drawdowns; practitioners universally use half-Kelly or quarter-Kelly in practice, accepting a ~25% reduction in expected growth in exchange for cutting drawdown variance roughly in half. Bootstrapping the Kelly fraction is essential because the estimate is extremely sensitive to the tail of the return distribution.",
  },
  {
    id: "pyfin-20260706-b1-factor-model-barra",
    language: "python",
    title: "Barra-Style Multi-Factor Risk Decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def factor_risk_decomposition(
    weights: np.ndarray,          # portfolio weights, shape (N,)
    factor_exposures: np.ndarray, # B matrix, shape (N, K)
    factor_cov: np.ndarray,       # F matrix, K x K factor covariance
    specific_var: np.ndarray,     # D vector, shape (N,) idiosyncratic variance
) -> dict:
    """
    Barra risk model: total covariance = B @ F @ B.T + diag(D)
    Decomposes portfolio variance into factor and specific components.
    """
    # Factor contribution to portfolio variance
    Bw = factor_exposures.T @ weights          # K-vector of factor exposures
    factor_var   = float(Bw @ factor_cov @ Bw) # scalar

    # Specific (idiosyncratic) contribution
    specific_var_port = float(weights @ (specific_var * weights))  # w.T D w

    total_var = factor_var + specific_var_port
    total_vol = np.sqrt(total_var)

    # Factor marginal contributions
    factor_mcr = factor_cov @ Bw              # K-vector
    stock_factor_mcr = factor_exposures @ factor_mcr  # N-vector, per-stock
    stock_total_mcr  = stock_factor_mcr + specific_var * weights  # add specific

    return {
        "total_vol": total_vol,
        "factor_var_pct": factor_var / total_var,
        "specific_var_pct": specific_var_port / total_var,
        "factor_exposures_port": Bw,
        "stock_mcr": stock_total_mcr / total_vol,  # marginal contribution to vol
    }

# Toy 4-stock, 3-factor example
N, K = 4, 3
np.random.seed(42)
weights = np.array([0.30, 0.25, 0.25, 0.20])
B = np.random.randn(N, K) * 0.5   # factor loadings
F = np.eye(K) * 0.04 + np.full((K, K), 0.01)  # factor cov (~20% vol factors)
D = np.array([0.0025, 0.0036, 0.0016, 0.0049]) # specific variance

result = factor_risk_decomposition(weights, B, F, D)
print(f"Portfolio vol: {result['total_vol']:.4f}")
print(f"Factor %:      {result['factor_var_pct']:.2%}")
print(f"Specific %:    {result['specific_var_pct']:.2%}")
print("Stock MCR:    ", np.round(result['stock_mcr'], 4))`,
    explanation:
      "The Barra risk model decomposes portfolio variance into a low-rank factor component (B F B') and a diagonal idiosyncratic component (D), enabling attribution to economic factors like value, momentum, and industry rather than raw stock-level covariances. Marginal contribution to risk (MCR) tells a portfolio manager which position is the largest risk consumer per dollar of weight, guiding risk-budgeting decisions.",
  },
  {
    id: "pyfin-20260706-b1-pandas-multiindex-pnl",
    language: "python",
    title: "Multi-Index P&L Attribution via Pandas Pivot and GroupBy",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

def build_pnl_attribution(raw: pd.DataFrame) -> pd.DataFrame:
    """
    raw: columns = [date, portfolio, strategy, asset, pnl]
    Returns a multi-index P&L pivot with portfolio/strategy subtotals.
    """
    # Pivot to (date) x (portfolio, strategy, asset) hierarchy
    pivot = raw.pivot_table(
        index="date",
        columns=["portfolio", "strategy", "asset"],
        values="pnl",
        aggfunc="sum",
        fill_value=0.0,
    )

    # Cumulative P&L per column
    cum = pivot.cumsum()

    # Rolling 21-day Sharpe per strategy
    def sharpe_21(series: pd.Series) -> pd.Series:
        daily_ret = series.diff().fillna(0)
        return (daily_ret.rolling(21).mean() /
                (daily_ret.rolling(21).std() + 1e-12)) * np.sqrt(252)

    sharpes = cum.apply(sharpe_21)

    # Aggregate: total P&L by portfolio across all dates
    by_portfolio = pivot.groupby(level="portfolio", axis=1).sum()

    return {
        "daily_pnl": pivot,
        "cumulative_pnl": cum,
        "rolling_sharpe_21d": sharpes,
        "portfolio_total": by_portfolio,
    }

# Synthetic data
rng = np.random.default_rng(0)
dates = pd.date_range("2025-01-02", periods=100, freq="B")
rows = []
for d in dates:
    for port in ["EQ", "FI"]:
        for strat in ["Momentum", "MeanRev"]:
            for asset in ["AAPL", "MSFT"]:
                rows.append({
                    "date": d, "portfolio": port, "strategy": strat,
                    "asset": asset, "pnl": rng.normal(1000, 5000),
                })
df = pd.DataFrame(rows)
result = build_pnl_attribution(df)
print(result["portfolio_total"].tail(3))`,
    explanation:
      "Multi-index pivot tables express the natural hierarchy of a trading book (fund → strategy → asset) and allow GroupBy aggregations at any level without reshaping the data. Computing rolling Sharpe via apply on the cumulative P&L columns is faster than looping over strategies because Pandas internally dispatches to Cython rolling statistics.",
  },
  {
    id: "pyfin-20260706-b1-cointegration-johansen",
    language: "python",
    title: "Johansen Cointegration Test for Multi-Asset Pairs",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.vector_ar.vecm import coint_johansen

def find_cointegrated_pairs(prices: pd.DataFrame, significance: float = 0.05):
    """
    Run Johansen cointegration test on every pair of assets.
    Returns pairs where at least one cointegrating relationship exists.
    """
    assets = prices.columns.tolist()
    results = []

    for i in range(len(assets)):
        for j in range(i + 1, len(assets)):
            pair = prices[[assets[i], assets[j]]].dropna()
            try:
                joh = coint_johansen(pair, det_order=0, k_ar_diff=1)
                # Trace statistic vs 95% critical value
                # joh.lr1[0] = trace stat for r=0, cv[0,1] = 95% crit value
                trace_stat = joh.lr1[0]
                crit_val   = joh.cvt[0, 1]   # 95% critical value for r<=0
                if trace_stat > crit_val:
                    # Extract cointegrating vector (first eigenvector)
                    beta = joh.evec[:, 0]
                    spread = pair.values @ beta
                    results.append({
                        "asset1": assets[i],
                        "asset2": assets[j],
                        "trace_stat": trace_stat,
                        "crit_val": crit_val,
                        "beta": beta,
                        "spread_mean": spread.mean(),
                        "spread_std": spread.std(),
                    })
            except Exception:
                continue

    return pd.DataFrame(results).sort_values("trace_stat", ascending=False)

# Synthetic cointegrated pair: gold/silver with noise
rng = np.random.default_rng(42)
T   = 500
x   = np.cumsum(rng.normal(0, 1, T))     # random walk
y   = 1.5 * x + rng.normal(0, 0.5, T)   # cointegrated with x
z   = np.cumsum(rng.normal(0, 1, T))     # independent walk

prices = pd.DataFrame({"Gold": x, "Silver": y, "Copper": z})
pairs  = find_cointegrated_pairs(prices)
print(pairs.to_string(index=False))`,
    explanation:
      "The Johansen test is preferred over Engle-Granger for multivariate cointegration because it simultaneously tests for all cointegrating vectors (rank of the cointegrating space) and is invariant to the choice of normalization — Engle-Granger regresses one asset on another, so swapping the dependent variable gives a different result. The eigenvectors of the Johansen procedure are the optimal hedge ratios for the stationary spread.",
  },
  {
    id: "pyfin-20260706-b1-cvxpy-mean-variance",
    language: "python",
    title: "Mean-Variance Optimization with Constraints via CVXPY",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def efficient_frontier_constrained(
    mu: np.ndarray,         # expected returns, shape (N,)
    Sigma: np.ndarray,      # covariance matrix, shape (N, N)
    target_return: float,
    max_weight: float = 0.30,
    min_weight: float = 0.0,
    sector_map: dict = None, # {sector_id: [asset_indices]}
    max_sector: float = 0.40,
) -> dict:
    """
    Minimum-variance portfolio for a given target return.
    Constraints: weights sum to 1, box constraints, sector limits.
    """
    N = len(mu)
    w = cp.Variable(N)

    # Objective: minimise portfolio variance
    port_var = cp.quad_form(w, Sigma)
    obj = cp.Minimize(port_var)

    constraints = [
        cp.sum(w) == 1,
        w >= min_weight,
        w <= max_weight,
        mu @ w >= target_return,           # return constraint
    ]

    if sector_map:
        for sector_assets in sector_map.values():
            constraints.append(cp.sum(w[sector_assets]) <= max_sector)

    prob = cp.Problem(obj, constraints)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ("optimal", "optimal_inaccurate"):
        return {"status": prob.status, "weights": None}

    wgt = w.value
    return {
        "status": prob.status,
        "weights": wgt,
        "port_return": float(mu @ wgt),
        "port_vol": float(np.sqrt(wgt @ Sigma @ wgt)),
        "sharpe": float((mu @ wgt) / np.sqrt(wgt @ Sigma @ wgt)),
    }

# Toy 5-asset example
np.random.seed(0)
N   = 5
mu  = np.array([0.08, 0.10, 0.12, 0.07, 0.09])
A   = np.random.randn(N, N) * 0.1
Sig = A @ A.T + np.eye(N) * 0.04

result = efficient_frontier_constrained(
    mu, Sig, target_return=0.09,
    sector_map={0: [0, 1], 1: [2, 3, 4]}
)
print(f"Status:      {result['status']}")
print(f"Weights:     {np.round(result['weights'], 4)}")
print(f"Return:      {result['port_return']:.4f}")
print(f"Vol:         {result['port_vol']:.4f}")`,
    explanation:
      "CVXPY's cp.quad_form implements w'Σw as a disciplined convex expression that the solver can exploit with second-order cone programming, which is substantially faster than general NLP for this structure. Sector constraints add linear inequality rows to the KKT system with zero additional solver complexity, making them 'free' — a key advantage of convex programming over heuristic optimizers.",
  },
  {
    id: "pyfin-20260706-b1-gbm-antithetic",
    language: "python",
    title: "GBM Monte Carlo with Antithetic Variates Variance Reduction",
    tag: "finance",
    code: `import numpy as np

def european_call_antithetic(
    S0: float, K: float, T: float, r: float, sigma: float,
    n_paths: int = 100_000, n_steps: int = 252,
) -> dict:
    """
    Price a European call via GBM Monte Carlo with antithetic variates.
    Antithetic: pair each path with its mirror (-Z instead of +Z).
    Variance reduction: ~40-50% for near-ATM options.
    """
    rng = np.random.default_rng(42)
    dt  = T / n_steps
    drift = (r - 0.5 * sigma**2) * dt
    diff  = sigma * np.sqrt(dt)

    # Generate half the paths, mirror the other half
    Z = rng.standard_normal((n_paths // 2, n_steps))

    def terminal_price(z: np.ndarray) -> np.ndarray:
        log_ret = drift + diff * z            # shape (paths, steps)
        return S0 * np.exp(log_ret.sum(axis=1))

    S_pos = terminal_price(Z)
    S_neg = terminal_price(-Z)  # antithetic

    pay_pos = np.maximum(S_pos - K, 0)
    pay_neg = np.maximum(S_neg - K, 0)

    # Average antithetic pairs before averaging across paths
    avg_pay = (pay_pos + pay_neg) / 2
    price   = np.exp(-r * T) * avg_pay.mean()
    se      = np.exp(-r * T) * avg_pay.std() / np.sqrt(len(avg_pay))

    # Comparison: crude MC on full paths (no variance reduction)
    Z_crude  = rng.standard_normal((n_paths, n_steps))
    pay_crude = np.maximum(terminal_price(Z_crude) - K, 0)
    crude_se = np.exp(-r * T) * pay_crude.std() / np.sqrt(n_paths)

    return {
        "price": price,
        "std_error_antithetic": se,
        "std_error_crude": crude_se,
        "variance_reduction_factor": crude_se / se,
    }

result = european_call_antithetic(100, 100, 1.0, 0.05, 0.20)
print(f"Price:   {result['price']:.4f}")
print(f"SE anti: {result['std_error_antithetic']:.6f}")
print(f"SE crude:{result['std_error_crude']:.6f}")
print(f"VRF:     {result['variance_reduction_factor']:.2f}x")`,
    explanation:
      "Antithetic variates exploit the symmetry of the standard normal: if a path driven by +Z produces a high payoff, the mirror path driven by -Z tends to produce a low payoff, so averaging the pair reduces variance without any additional model calls. For path-dependent options the reduction is smaller but still significant; it is always combined with other techniques (control variates, stratified sampling) in production MC engines.",
  },
  {
    id: "pyfin-20260706-b1-stratified-sampling",
    language: "python",
    title: "Stratified Sampling Monte Carlo for Tail-Sensitive Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def digital_call_stratified(
    S0: float, K: float, T: float, r: float, sigma: float,
    n_paths: int = 50_000, n_strata: int = 100,
) -> dict:
    """
    Price a cash-or-nothing digital call via stratified sampling.
    Strata = equal quantile buckets of the terminal lognormal distribution.
    Each stratum contributes exactly n_paths/n_strata paths.
    """
    paths_per = n_paths // n_strata
    rng = np.random.default_rng(7)

    prices = []
    for k in range(n_strata):
        # Uniform samples in the k-th stratum
        u = (k + rng.uniform(0, 1, paths_per)) / n_strata  # (k/n, (k+1)/n)
        Z = norm.ppf(u)                                      # inverse CDF
        log_ret = (r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * Z
        S_T = S0 * np.exp(log_ret)
        payoff = (S_T > K).astype(float)                    # digital: $1 if ITM
        prices.append(payoff.mean())

    # Stratified estimator: equal weight to each stratum
    price = np.exp(-r * T) * np.mean(prices)
    se    = np.exp(-r * T) * np.std(prices) / np.sqrt(n_strata)

    # Black-Scholes closed form for verification
    d2 = (np.log(S0/K) + (r - 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    bs_price = np.exp(-r * T) * norm.cdf(d2)

    return {"mc_price": price, "bs_price": bs_price, "se": se}

result = digital_call_stratified(100, 100, 0.5, 0.05, 0.20)
print(f"MC (stratified): {result['mc_price']:.5f}")
print(f"BS exact:        {result['bs_price']:.5f}")
print(f"Std error:       {result['se']:.6f}")`,
    explanation:
      "Stratified sampling guarantees that simulated terminal prices cover the entire probability space proportionally — unlike crude MC which may over-sample the median and under-sample tails. For digital options (discontinuous payoffs), this is particularly valuable because the discontinuity at K contributes disproportionately to MC variance, and stratification ensures paths straddle the kink uniformly.",
  },
  {
    id: "pyfin-20260706-b1-backtesting-slippage",
    language: "python",
    title: "Realistic Backtesting Engine with Market Impact and Slippage",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from dataclasses import dataclass, field

@dataclass
class BacktestConfig:
    commission_bps: float = 5.0       # bps per trade, each side
    slippage_bps:   float = 2.0       # half-spread slippage
    impact_coeff:   float = 0.1       # linear market impact: bps per % of ADV
    adv_fraction_limit: float = 0.05  # max 5% of ADV per trade

@dataclass
class BacktestResult:
    returns: pd.Series = field(default_factory=pd.Series)
    turnover: pd.Series = field(default_factory=pd.Series)
    costs: pd.Series = field(default_factory=pd.Series)

def backtest_signals(
    prices: pd.DataFrame,             # (T, N) price matrix
    signals: pd.DataFrame,            # (T, N) target weights
    adv: pd.DataFrame,                # (T, N) average daily volume in $
    cfg: BacktestConfig = BacktestConfig(),
) -> BacktestResult:
    weights = signals.copy()
    weights = weights.div(weights.abs().sum(axis=1) + 1e-12, axis=0)  # normalize

    daily_returns = prices.pct_change().shift(-1)  # next-day returns
    port_gross_ret = (weights * daily_returns).sum(axis=1)

    # Compute weight changes (trades)
    trades = weights.diff().fillna(weights.iloc[0]).abs()

    # Cost model per asset
    commission_cost = trades * cfg.commission_bps / 10_000
    slippage_cost   = trades * cfg.slippage_bps   / 10_000

    # Market impact: impact = coeff * (trade_value / ADV) * trade_direction
    # trade value = weight_change * portfolio_value (assume $1M)
    pv = 1_000_000
    trade_as_pct_adv = (trades * pv) / (adv + 1e-6)
    impact_cost = (cfg.impact_coeff / 10_000) * trade_as_pct_adv * trades

    total_cost = (commission_cost + slippage_cost + impact_cost).sum(axis=1)
    net_return = port_gross_ret - total_cost
    turnover   = trades.sum(axis=1)

    return BacktestResult(
        returns=net_return,
        turnover=turnover,
        costs=total_cost,
    )

# Toy example
rng = np.random.default_rng(0)
T, N = 252, 5
dates  = pd.date_range("2024-01-01", periods=T, freq="B")
prices = pd.DataFrame(100 + np.cumsum(rng.normal(0, 1, (T, N)), axis=0),
                      index=dates, columns=list("ABCDE"))
sigs   = pd.DataFrame(rng.normal(0, 1, (T, N)), index=dates, columns=list("ABCDE"))
adv    = pd.DataFrame(np.full((T, N), 5e6), index=dates, columns=list("ABCDE"))
res    = backtest_signals(prices, sigs, adv)
ann_ret = res.returns.mean() * 252
ann_vol = res.returns.std() * np.sqrt(252)
print(f"Net ann. return: {ann_ret:.4f}")
print(f"Ann. vol:        {ann_vol:.4f}")
print(f"Sharpe:          {ann_ret/ann_vol:.3f}")
print(f"Avg daily cost:  {res.costs.mean()*1e4:.2f} bps")`,
    explanation:
      "Market impact (price movement caused by your own trading) is the dominant cost for high-frequency strategies and grows super-linearly with trade size as a fraction of ADV — the Almgren-Chriss model uses a square-root impact law for large trades, but linear is sufficient for size < 5% of ADV. Signal normalization to unit leverage ensures the backtest remains consistent when signal magnitude changes across regimes.",
  },
  {
    id: "pyfin-20260706-b1-pca-risk-factor",
    language: "python",
    title: "PCA Statistical Risk Factors for Equity Returns",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def pca_risk_factors(
    returns: pd.DataFrame,   # (T, N) asset return matrix
    n_factors: int = 5,
    window: int | None = None,  # rolling window; None = full-sample
) -> dict:
    """
    Extract statistical risk factors via PCA on the return covariance matrix.
    Returns factor returns, loadings, and % variance explained.
    """
    R = returns.dropna()
    scaler = StandardScaler(with_mean=True, with_std=True)
    R_scaled = scaler.fit_transform(R)

    pca = PCA(n_components=n_factors, random_state=0)
    factor_returns_scaled = pca.fit_transform(R_scaled)  # (T, K)

    # Rescale back to return units
    factor_returns = pd.DataFrame(
        factor_returns_scaled * scaler.scale_.mean(),
        index=R.index,
        columns=[f"PC{i+1}" for i in range(n_factors)],
    )

    loadings = pd.DataFrame(
        pca.components_.T,           # (N, K)
        index=returns.columns,
        columns=factor_returns.columns,
    )

    var_explained = pd.Series(
        pca.explained_variance_ratio_,
        index=factor_returns.columns,
    )

    # Residual (specific) returns via regression
    from numpy.linalg import lstsq
    B = loadings.values                       # (N, K)
    F = factor_returns.values.T               # (K, T)
    residuals = R.values.T - B @ F           # (N, T) specific returns

    return {
        "factor_returns": factor_returns,
        "loadings": loadings,
        "var_explained": var_explained,
        "cumvar_explained": var_explained.cumsum(),
        "specific_returns": pd.DataFrame(residuals.T, index=R.index,
                                         columns=returns.columns),
    }

# Synthetic equity universe
rng = np.random.default_rng(0)
T, N = 500, 50
market_factor = rng.normal(0, 0.01, T)
returns_raw   = (np.outer(market_factor, np.ones(N)) * 0.8
                 + rng.normal(0, 0.005, (T, N)))  # high market beta
rets = pd.DataFrame(returns_raw,
                    columns=[f"STK{i:02d}" for i in range(N)])

result = pca_risk_factors(rets, n_factors=3)
print("Variance explained per factor:")
print(result["var_explained"].to_string())
print("\\nCumulative:", result["cumvar_explained"].iloc[-1]:.2%}")`,
    explanation:
      "PCA risk factors are the eigenportfolios of the return covariance matrix — the first principal component almost always aligns with the market factor, explaining 40-70% of cross-sectional variance for equities. Unlike Barra factors, PCA factors are mutually orthogonal by construction, which simplifies factor covariance estimation to a diagonal matrix and accelerates VaR computation.",
  },
  {
    id: "pyfin-20260706-b1-swap-curve-bootstrap",
    language: "python",
    title: "Interest Rate Swap Curve Bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_swap_curve(
    tenors: list[float],     # swap maturities in years [1, 2, 3, 5, 7, 10]
    swap_rates: list[float], # par swap rates (annual, e.g. 0.045 for 4.5%)
    freq: int = 2,           # payment frequency (2 = semi-annual)
) -> dict:
    """
    Bootstrap zero rates from par swap rates.
    Par swap rate s_n satisfies: s_n * sum(df_i) + df_n = 1
    where df_i are discount factors at each payment date.
    """
    dt = 1.0 / freq
    discount_factors = {}  # tenor -> discount factor

    def df(t: float) -> float:
        """Interpolate discount factor (linear in log-df space)."""
        keys = sorted(discount_factors.keys())
        if not keys:
            return np.exp(-swap_rates[0] * t)  # bootstrap seed
        if t <= keys[0]:
            return discount_factors[keys[0]] ** (t / keys[0])
        for i in range(len(keys) - 1):
            if keys[i] <= t <= keys[i+1]:
                w = (t - keys[i]) / (keys[i+1] - keys[i])
                log_df = ((1-w)*np.log(discount_factors[keys[i]])
                          + w*np.log(discount_factors[keys[i+1]]))
                return np.exp(log_df)
        # Extrapolate
        last_z = -np.log(discount_factors[keys[-1]]) / keys[-1]
        return np.exp(-last_z * t)

    zero_rates = {}
    for tenor, sr in zip(tenors, swap_rates):
        payment_times = np.arange(dt, tenor + 1e-9, dt)

        def residual(df_n: float) -> float:
            # Sum of discounted coupons plus principal
            coupon_pv = sum(sr * dt * df(t) for t in payment_times[:-1])
            coupon_pv += (sr * dt + 1.0) * df_n  # last coupon + principal
            return coupon_pv - 1.0                # par = 1

        df_n = brentq(residual, 0.01, 1.5)
        discount_factors[tenor] = df_n
        zero_rates[tenor] = -np.log(df_n) / tenor

    return {"discount_factors": discount_factors, "zero_rates": zero_rates}

tenors     = [1, 2, 3, 5, 7, 10]
swap_rates = [0.045, 0.044, 0.043, 0.042, 0.041, 0.040]
result     = bootstrap_swap_curve(tenors, swap_rates)
print("Tenor  Zero Rate  Disc Factor")
for t in tenors:
    print(f"  {t:2d}Y   {result['zero_rates'][t]:.5f}   {result['discount_factors'][t]:.6f}")`,
    explanation:
      "Bootstrapping extracts the unique zero curve consistent with observable par-swap rates by solving for each discount factor sequentially: at each maturity, the coupon PV from already-bootstrapped shorter tenors is known, so you solve a one-variable equation for the new discount factor. Brent's method is preferred over Newton-Raphson here because it guarantees convergence without needing the derivative of the residual.",
  },
  {
    id: "pyfin-20260706-b1-garch-vol-forecast",
    language: "python",
    title: "GARCH(1,1) Volatility Forecasting and Term Structure",
    tag: "finance",
    code: `import numpy as np
from arch import arch_model
import pandas as pd

def garch_vol_forecast(
    returns: np.ndarray,  # daily log-returns (%)
    horizon: int = 21,    # forecast horizon in trading days
) -> dict:
    """
    Fit GARCH(1,1) via MLE and produce multi-step conditional vol forecasts.
    """
    model = arch_model(
        returns * 100,     # arch library wants returns in % for numerical stability
        vol="Garch",
        p=1, q=1,
        mean="Constant",
        dist="t",          # Student-t captures fat tails
    )
    fit = model.fit(disp="off", show_warning=False)

    # Conditional vol for in-sample
    cond_vol = fit.conditional_volatility / 100  # back to decimal

    # Multi-step forecast: GARCH mean-reverts to long-run vol
    omega = fit.params["omega"]
    alpha = fit.params["alpha[1]"]
    beta  = fit.params["beta[1]"]
    long_run_var = omega / (1 - alpha - beta)

    # h-step ahead variance: var_h = long_run + (alpha+beta)^(h-1) * (var_1 - long_run)
    var_1 = fit.forecast(horizon=1).variance.iloc[-1, 0] / 1e4  # undo % scaling
    var_term = []
    for h in range(1, horizon + 1):
        var_h = long_run_var/1e4 + (alpha + beta)**(h-1) * (var_1 - long_run_var/1e4)
        var_term.append(np.sqrt(var_h))

    # Annualized term-structure
    term_vol = [v * np.sqrt(252) for v in var_term]

    return {
        "params": {"omega": omega, "alpha": alpha, "beta": beta},
        "long_run_vol": np.sqrt(long_run_var / 1e4 * 252),
        "current_vol": cond_vol.iloc[-1] * np.sqrt(252),
        "forecast_term_vol": term_vol,  # annualized vol for days 1..horizon
        "persistence": alpha + beta,
        "aic": fit.aic,
    }

rng = np.random.default_rng(1)
returns = rng.normal(0, 0.01, 500)
result = garch_vol_forecast(returns, horizon=21)
print(f"Persistence (alpha+beta): {result['persistence']:.4f}")
print(f"Long-run annual vol:      {result['long_run_vol']:.4f}")
print(f"Current annual vol:       {result['current_vol']:.4f}")
print("21-day term vol:", [f"{v:.4f}" for v in result['forecast_term_vol'][:5]])`,
    explanation:
      "The GARCH persistence parameter alpha+beta measures how slowly volatility mean-reverts: near 1.0 means shocks decay slowly (vol clustering), while values around 0.9 are typical for equity returns. Using a Student-t innovation distribution (dist='t') is critical for risk estimation because normal-GARCH systematically underestimates tail probabilities at the 99th percentile by 20-30%.",
  },
  {
    id: "pyfin-20260706-b1-numpy-rolling-ols",
    language: "python",
    title: "Fast Rolling OLS via Numpy Matrix Operations",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def rolling_ols_vectorized(
    y: np.ndarray,      # dependent variable, shape (T,)
    X: np.ndarray,      # features including constant, shape (T, K)
    window: int,
) -> dict:
    """
    Rolling OLS using numpy strided trick — O(T*K^2) vs O(T*K^2*window)
    for repeated QR decompositions. Returns betas, R^2, and residuals.
    Equivalent to statsmodels RollingOLS but ~10x faster via vectorization.
    """
    T, K = X.shape
    betas  = np.full((T, K), np.nan)
    r2     = np.full(T, np.nan)
    resids = np.full(T, np.nan)

    for t in range(window - 1, T):
        y_w = y[t - window + 1 : t + 1]
        X_w = X[t - window + 1 : t + 1, :]
        try:
            XtX = X_w.T @ X_w
            Xty = X_w.T @ y_w
            b   = np.linalg.solve(XtX, Xty)     # faster than lstsq for small K
            y_hat = X_w @ b
            ss_res = np.sum((y_w - y_hat)**2)
            ss_tot = np.sum((y_w - y_w.mean())**2)
            betas[t]  = b
            r2[t]     = 1 - ss_res / (ss_tot + 1e-12)
            resids[t] = y_w[-1] - X_w[-1] @ b   # one-step prediction error
        except np.linalg.LinAlgError:
            pass

    return {"betas": betas, "r2": r2, "residuals": resids}

# Rolling market beta estimation
rng    = np.random.default_rng(0)
T      = 500
market = rng.normal(0, 0.01, T)
stock  = 1.2 * market + rng.normal(0, 0.005, T)  # beta=1.2

X = np.column_stack([np.ones(T), market])  # intercept + market
result = rolling_ols_vectorized(stock, X, window=60)

print("Rolling beta (last 5 days):", np.round(result["betas"][-5:, 1], 4))
print("Rolling R²  (last 5 days):", np.round(result["r2"][-5:], 4))`,
    explanation:
      "Solving the normal equations via np.linalg.solve(X'X, X'y) is 2-5x faster than np.linalg.lstsq for small K (<10 factors) because it avoids computing the full SVD; however, lstsq is preferred when X is near-singular (multi-collinear factors). Rolling window OLS is the workhorse of time-varying beta estimation and residual momentum signal construction in systematic equity strategies.",
  },
  {
    id: "pyfin-20260706-b1-cds-hazard-rate",
    language: "python",
    title: "CDS Spread to Hazard Rate Bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_hazard_bootstrap(
    tenors: list[float],    # CDS maturities in years [1, 3, 5, 7, 10]
    spreads: list[float],   # CDS par spreads in bps (e.g. 50 bps)
    r: float = 0.04,        # risk-free rate (flat for simplicity)
    recovery: float = 0.40, # LGD = 1 - recovery
    freq: int = 4,          # payment frequency (quarterly)
) -> dict:
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    CDS par condition: spread * RPV01 = (1 - R) * DefPV
    where RPV01 = risky annuity, DefPV = default leg PV.
    """
    dt = 1.0 / freq
    LGD = 1 - recovery
    hazard_rates = {}

    def survival(t: float) -> float:
        """Piecewise-constant hazard → survival probability."""
        s = 1.0
        knots = sorted(hazard_rates.keys())
        t_prev = 0.0
        for knot in knots:
            if t <= knot:
                s *= np.exp(-hazard_rates[knot] * (t - t_prev))
                return s
            s *= np.exp(-hazard_rates[knot] * (knot - t_prev))
            t_prev = knot
        # Extrapolate with last hazard rate
        h_last = hazard_rates[knots[-1]] if knots else 0.0
        s *= np.exp(-h_last * (t - t_prev))
        return s

    def df(t: float) -> float:
        return np.exp(-r * t)

    zero_rates = {}
    for tenor, spread_bps in zip(tenors, spreads):
        s = spread_bps / 10_000
        pay_times = np.arange(dt, tenor + 1e-9, dt)

        def cds_pv(h_new: float) -> float:
            # Temporarily add new hazard rate
            hazard_rates[tenor] = h_new

            rpv01, def_pv = 0.0, 0.0
            for t in pay_times:
                q = survival(t)
                rpv01  += dt * df(t) * q                     # premium leg annuity

            # Default leg: integrate over payment intervals
            t_vals = np.concatenate([[0], pay_times])
            for i in range(len(t_vals) - 1):
                t_mid = 0.5 * (t_vals[i] + t_vals[i+1])
                dq = survival(t_vals[i]) - survival(t_vals[i+1])
                def_pv += LGD * df(t_mid) * dq

            par_spread = def_pv / (rpv01 + 1e-12) * 10_000  # bps
            return par_spread - spread_bps

        h = brentq(cds_pv, 1e-6, 5.0)
        hazard_rates[tenor] = h
        zero_rates[tenor] = h  # in piecewise-constant approximation h ≈ z-spread

    return {"hazard_rates": hazard_rates}

tenors  = [1, 3, 5, 7, 10]
spreads = [50, 80, 100, 110, 120]  # bps
result  = cds_hazard_bootstrap(tenors, spreads)
print("Hazard rates (annualized):")
for t, h in result["hazard_rates"].items():
    print(f"  {t:3}Y: {h:.4f}  ({h*100:.2f}%)")`,
    explanation:
      "CDS bootstrapping extracts the implied probability of default at each tenor by matching the model par spread to the market quote, analogous to yield-curve bootstrapping for rate products. The key insight is that the par spread equals LGD × (default leg PV) / (premium annuity) — once you have survival probabilities, pricing any credit derivative (CLN, CDO tranche) is just numerical integration over the hazard curve.",
  },
];
