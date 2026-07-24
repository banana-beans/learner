import type { Snippet } from "./types";

export const pythonFinanceSnippets20260724B1: Snippet[] = [
  {
    id: "pyfin-20260724-b1-efficient-frontier",
    language: "python",
    title: "Markowitz efficient frontier (analytic)",
    tag: "portfolio",
    code: `import numpy as np

def efficient_frontier(mu, Sigma, n_points=200):
    """Trace the minimum-variance frontier analytically."""
    mu    = np.asarray(mu, dtype=float)
    Sigma = np.asarray(Sigma, dtype=float)
    n     = len(mu)
    ones  = np.ones(n)
    Sinv  = np.linalg.inv(Sigma)

    # Three scalars that define the entire parabola in (σ², μ) space.
    A = float(ones @ Sinv @ mu)
    B = float(mu   @ Sinv @ mu)
    C = float(ones @ Sinv @ ones)
    D = B * C - A * A              # determinant — always > 0

    mu_range = np.linspace(mu.min(), mu.max(), n_points)
    # Minimum portfolio variance for each target return:
    # σ²(μ_p) = (C·μ_p² - 2A·μ_p + B) / D
    sigmas = np.sqrt((C * mu_range**2 - 2*A*mu_range + B) / D)
    return mu_range, sigmas

mu    = np.array([0.10, 0.12, 0.15])
Sigma = np.array([[0.04, 0.01, 0.02],
                  [0.01, 0.09, 0.03],
                  [0.02, 0.03, 0.16]])
mus, sigs = efficient_frontier(mu, Sigma)
# Global minimum-variance point: μ* = A/C, σ*² = 1/C
print(f"Min-var return: {A/C:.4f}  vol: {1/C**0.5:.4f}")`,
    explanation: "The Markowitz frontier follows a parabola in (σ², μ) space defined by three scalars (A, B, C) derived from the inverse covariance matrix; the analytic form is faster than quadratic programming and illuminates why the frontier is parameterized entirely by any two efficient portfolios.",
  },
  {
    id: "pyfin-20260724-b1-cvxpy-port",
    language: "python",
    title: "cvxpy maximum-Sharpe portfolio with constraints",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def max_sharpe_portfolio(mu, Sigma, rf=0.0, max_weight=0.40):
    """
    Maximize Sharpe ratio via the Dinkelbach / homogeneous trick:
    let y = w/kappa where kappa = 1/(w'(mu-rf)), then minimize
    portfolio variance subject to y'(mu-rf)=1.  Solution: w = y/sum(y).
    """
    mu    = np.asarray(mu, dtype=float)
    Sigma = np.asarray(Sigma, dtype=float)
    n     = len(mu)
    exc   = mu - rf                       # excess return vector

    y     = cp.Variable(n, nonneg=True)   # auxiliary variable
    kappa = cp.Variable(nonneg=True)      # 1 / (excess return of unit portfolio)

    constraints = [
        exc @ y == 1,                      # normalisation
        cp.sum(y) == kappa,                # budget constraint translated
        y <= max_weight * kappa,           # position limit per asset
    ]
    prob = cp.Problem(cp.Minimize(cp.quad_form(y, Sigma)), constraints)
    prob.solve(solver=cp.OSQP)

    w      = (y.value / kappa.value).round(6)
    sharpe = (w @ mu - rf) / np.sqrt(w @ Sigma @ w)
    print(f"Weights:      {w}")
    print(f"Sharpe ratio: {sharpe:.4f}")
    return w, sharpe

mu    = np.array([0.10, 0.12, 0.15, 0.08])
Sigma = np.diag([0.04, 0.09, 0.16, 0.03])
max_sharpe_portfolio(mu, Sigma)`,
    explanation: "The Dinkelbach change of variables converts the non-convex Sharpe maximization into a standard QCQP that any convex solver handles; the homogeneous reformulation is the standard approach when adding inequality constraints that would otherwise destroy the analytic closed form.",
  },
  {
    id: "pyfin-20260724-b1-arima",
    language: "python",
    title: "ARIMA model fitting and one-step forecast",
    tag: "time-series",
    code: `import numpy as np
from statsmodels.tsa.arima.model import ARIMA

def fit_arima(returns, order=(1, 0, 1)):
    """Fit ARIMA(p,d,q) and produce a one-step-ahead forecast with CI."""
    model  = ARIMA(returns, order=order)
    result = model.fit()

    # AIC/BIC for model selection across (p,d,q) grid
    print(f"AIC: {result.aic:.2f}  BIC: {result.bic:.2f}")

    # One-step forecast with 95% confidence interval
    fc   = result.get_forecast(steps=1)
    mean = fc.predicted_mean.iloc[0]
    ci   = fc.conf_int(alpha=0.05)
    lo, hi = ci.iloc[0, 0], ci.iloc[0, 1]
    print(f"Forecast: {mean:.6f}  95% CI: [{lo:.6f}, {hi:.6f}]")
    return result

# Simulate AR(1) process: r_t = 0.3 r_{t-1} + ε_t
np.random.seed(42)
eps = np.random.normal(0, 0.01, 500)
r   = np.zeros(500)
for t in range(1, 500):
    r[t] = 0.3 * r[t-1] + eps[t]

fit_arima(r, order=(1, 0, 0))`,
    explanation: "ARIMA models return dynamics as a combination of autoregressive (past returns), integration (differencing for stationarity), and moving-average (past shock) terms; AIC/BIC guide order selection, and the in-sample residuals should resemble white noise if the model is correctly specified.",
  },
  {
    id: "pyfin-20260724-b1-garch11",
    language: "python",
    title: "GARCH(1,1) conditional volatility forecast",
    tag: "volatility",
    code: `import numpy as np
from arch import arch_model

def fit_garch(returns, p=1, q=1):
    """
    Fit GARCH(p,q) and forecast one-day-ahead conditional variance.
    σ²_t = ω + α ε²_{t-1} + β σ²_{t-1}
    Persistence = α + β; if ≥ 1 the process is non-stationary.
    """
    # arch_model works best on percentage returns (scale 100) for numerics.
    am  = arch_model(returns * 100, vol="Garch", p=p, q=q, dist="Normal")
    res = am.fit(disp="off")

    omega = res.params["omega"]
    alpha = res.params["alpha[1]"]
    beta  = res.params["beta[1]"]
    persist = alpha + beta
    print(f"ω={omega:.6f}  α={alpha:.4f}  β={beta:.4f}  α+β={persist:.4f}")

    # One-step forecast (in variance of pct returns, scale back)
    fc  = res.forecast(horizon=1)
    var = fc.variance.iloc[-1, 0] / 10_000  # undo ×100 scaling
    print(f"Forecast daily vol: {var**0.5:.6f}  ({var**0.5*100:.4f}%)")
    return res

np.random.seed(7)
r = np.random.normal(0, 0.01, 1000)
fit_garch(r)`,
    explanation: "GARCH(1,1) captures volatility clustering — periods of high vol tend to follow high-vol days — through the β persistence parameter; a sum α+β close to 1 indicates near-integrated volatility (IGARCH), common in daily equity and FX returns.",
  },
  {
    id: "pyfin-20260724-b1-johansen",
    language: "python",
    title: "Johansen cointegration test for pairs/baskets",
    tag: "time-series",
    code: `import numpy as np
from statsmodels.tsa.vector_ar.vecm import coint_johansen

def johansen_test(prices, det_order=0, k_ar_diff=1):
    """
    Johansen test for cointegration among multiple price series.
    det_order: -1=no constant, 0=restricted const, 1=unrestricted const.
    Returns the first cointegrating vector (hedge ratio).
    """
    result = coint_johansen(prices, det_order, k_ar_diff)

    # Trace statistic: H0 = at most r cointegrating relations.
    print("Trace stat vs 5% CV  →  verdict")
    for i, (tr, cv) in enumerate(zip(result.lr1, result.cvt[:, 1])):
        print(f"  r≤{i}: {tr:7.2f} vs {cv:6.2f}  → "
              f"{'reject H0 (cointegrated)' if tr > cv else 'fail to reject'}")

    beta = result.evec[:, 0]   # first cointegrating vector (eigenvector)
    print(f"Cointegrating vector: {beta}")
    spread = prices @ beta     # stationary spread
    print(f"Spread: mean={spread.mean():.4f}  std={spread.std():.4f}")
    return beta

np.random.seed(0)
noise = np.cumsum(np.random.normal(0, 1, (500, 1)), axis=0)
P1 = noise + np.random.normal(0, 0.3, (500, 1))
P2 = 2.0 * noise + np.random.normal(0, 0.3, (500, 1))
johansen_test(np.hstack([P1, P2]))`,
    explanation: "The Johansen trace test identifies how many linearly independent cointegrating vectors exist among a set of price series; the cointegrating vector gives the hedge ratio for constructing the stationary spread used in statistical arbitrage pairs or basket strategies.",
  },
  {
    id: "pyfin-20260724-b1-return-pca",
    language: "python",
    title: "PCA on a return matrix for factor extraction",
    tag: "factor-models",
    code: `import numpy as np

def pca_returns(R, n_factors=3):
    """
    PCA on a T×N return matrix.
    PC1 ≈ market factor, PC2 ≈ size, PC3 ≈ value in equity cross-sections.
    Returns: loadings (N×k), factor returns (T×k), explained ratios.
    """
    R_c      = R - R.mean(axis=0)               # demean each asset
    Sigma    = np.cov(R_c.T)                     # N×N covariance matrix
    # eigh returns ascending eigenvalues — reverse for descending order.
    eigvals, eigvecs = np.linalg.eigh(Sigma)
    idx              = np.argsort(eigvals)[::-1]
    eigvals, eigvecs = eigvals[idx], eigvecs[:, idx]

    loadings  = eigvecs[:, :n_factors]           # N×k factor loadings
    factors   = R_c @ loadings                   # T×k factor returns
    explained = eigvals[:n_factors] / eigvals.sum()

    labels = ["market", "size", "value"]
    for i, (ev, lab) in enumerate(zip(explained, labels)):
        print(f"PC{i+1} ({lab}): {ev:.1%} of variance "
              f"  loading range [{loadings[:,i].min():.3f}, "
              f"{loadings[:,i].max():.3f}]")
    return loadings, factors, explained

T, N = 500, 20
np.random.seed(0)
R = np.random.randn(T, N) * 0.01
pca_returns(R)`,
    explanation: "PCA on the return covariance matrix extracts orthogonal risk factors ranked by explanatory power; the first few principal components typically capture the market, size, and sector effects that dominate cross-asset covariance, making them useful for hedging residual risk.",
  },
  {
    id: "pyfin-20260724-b1-rf-alpha",
    language: "python",
    title: "Random forest alpha signal with time-series CV",
    tag: "ml-finance",
    code: `import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit

def rf_alpha(X, y, n_splits=5):
    """
    Out-of-sample IC from a random forest predictor of next-period returns.
    TimeSeriesSplit prevents look-ahead: training always precedes test.
    X: T×d feature matrix  |  y: T next-period returns
    """
    tscv      = TimeSeriesSplit(n_splits=n_splits)
    oos_preds = np.full(len(y), np.nan)

    for train_idx, test_idx in tscv.split(X):
        rf = RandomForestRegressor(n_estimators=100,
                                   max_depth=4,
                                   min_samples_leaf=10,
                                   random_state=42)
        rf.fit(X[train_idx], y[train_idx])
        oos_preds[test_idx] = rf.predict(X[test_idx])

    valid = ~np.isnan(oos_preds)
    ic    = np.corrcoef(oos_preds[valid], y[valid])[0, 1]
    icir  = ic / np.std(oos_preds[valid])  # crude ICIR (signal-to-noise)
    print(f"OOS IC: {ic:.4f}  crude ICIR: {icir:.4f}")
    return oos_preds, ic

# Example: 4 features (momentum, reversal, ATR, volume ratio)
T, d = 600, 4
np.random.seed(99)
X = np.random.randn(T, d)
# Weak relationship: y ≈ 0.05 * X[:,0] + noise
y = 0.05 * X[:, 0] + np.random.randn(T) * 0.02
rf_alpha(X, y)`,
    explanation: "Information Coefficient (IC) measures the rank correlation between a model's predictions and realized returns; using TimeSeriesSplit instead of k-fold prevents look-ahead bias that would inflate IC on financial time series with autocorrelation.",
  },
  {
    id: "pyfin-20260724-b1-antithetic",
    language: "python",
    title: "Antithetic variates for Monte Carlo variance reduction",
    tag: "simulation",
    code: `import numpy as np
from scipy.stats import norm

def mc_call_antithetic(S, K, r, sigma, T, n_sims=100_000):
    """
    European call via MC with antithetic variates.
    Each draw Z pairs with -Z; E[payoff(Z) + payoff(-Z)] / 2 has
    lower variance because payoff is monotone in Z (negative correlation).
    """
    np.random.seed(0)
    n_half = n_sims // 2
    Z      = np.random.standard_normal(n_half)

    def terminal(z):
        return S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*z)

    ST_pos  = terminal(Z)
    ST_anti = terminal(-Z)                   # antithetic path
    # Average the two payoffs: V[X+Y] = V[X]+V[Y]+2Cov(X,Y) < 2V[X] when Cov < 0
    payoffs = 0.5 * (np.maximum(ST_pos - K, 0) + np.maximum(ST_anti - K, 0))

    price  = np.exp(-r*T) * payoffs.mean()
    se     = payoffs.std() / np.sqrt(n_half)
    bs_ref = (S * norm.cdf((np.log(S/K)+(r+0.5*sigma**2)*T)/(sigma*T**0.5))
              - K*np.exp(-r*T)*norm.cdf((np.log(S/K)+(r-0.5*sigma**2)*T)/(sigma*T**0.5)))
    print(f"MC (antithetic): {price:.4f}  SE: {se:.6f}  BS: {bs_ref:.4f}")
    return price

mc_call_antithetic(100, 105, 0.05, 0.20, 1.0)`,
    explanation: "Antithetic variates exploit the monotonicity of the Black-Scholes payoff in the Brownian increment: Z and -Z produce negatively correlated payoffs, so averaging them halves variance without increasing the number of random draws or model evaluations.",
  },
  {
    id: "pyfin-20260724-b1-clayton-copula",
    language: "python",
    title: "Clayton copula: lower-tail dependent joint loss model",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm, kendalltau

def clayton_sample(n, theta):
    """
    Sample (U1, U2) from a Clayton copula C(u,v) = (u^{-θ}+v^{-θ}-1)^{-1/θ}.
    θ > 0; larger θ → stronger lower-tail dependence.
    Uses conditional inverse sampling (Genest-MacKay algorithm).
    """
    U1 = np.random.uniform(size=n)
    V  = np.random.uniform(size=n)   # independent uniform
    # Conditional CDF of U2|U1=u: C^{-1}_{u}(v)
    U2 = (V**(-theta/(theta+1)) * (U1**(-theta) - 1) + 1)**(-1/theta)
    U2 = np.clip(U2, 1e-9, 1 - 1e-9)  # numerical guard
    return U1, U2

def kendall_to_theta(returns_a, returns_b):
    """Estimate Clayton θ from Kendall τ: τ = θ/(θ+2)."""
    tau, _ = kendalltau(returns_a, returns_b)
    tau    = max(tau, 1e-6)           # avoid division by zero
    return 2 * tau / (1 - tau)

np.random.seed(1)
theta = 2.0
U1, U2 = clayton_sample(5000, theta)
# Transform uniform margins to standard normal
X, Y = norm.ppf(U1), norm.ppf(U2)

# Lower-tail dependence coefficient: λ_L = 2^{-1/θ}
print(f"Theoretical λ_L = {2**(-1/theta):.4f}")
# Empirical: fraction of (X,Y) jointly below -1.645 (5th percentile)
q = norm.ppf(0.05)
empirical = np.mean((X < q) & (Y < q)) / 0.05
print(f"Empirical  λ_L ≈ {empirical:.4f}")`,
    explanation: "The Clayton copula has positive lower-tail dependence (λ_L = 2^{-1/θ} > 0) and zero upper-tail dependence, making it a natural model for credit portfolios and commodity pairs where simultaneous large losses are more likely than simultaneous large gains.",
  },
  {
    id: "pyfin-20260724-b1-evt-pot",
    language: "python",
    title: "EVT peaks-over-threshold for tail risk",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto

def evt_pot_var(losses, threshold_pct=0.90, confidence=0.99):
    """
    Peaks-Over-Threshold EVT: fit a Generalized Pareto Distribution (GPD)
    to exceedances above the threshold u = quantile(losses, threshold_pct).
    Provides more accurate tail risk estimates than historical or normal VaR.
    """
    u           = np.quantile(losses, threshold_pct)
    exceedances = losses[losses > u] - u     # excess loss above threshold

    # MLE fit of GPD(ξ, σ): ξ=shape (>0 heavy tail), σ=scale
    xi, _, sigma = genpareto.fit(exceedances, floc=0)
    print(f"GPD fit: ξ={xi:.4f}  σ={sigma:.4f}")

    n, Nu   = len(losses), len(exceedances)
    alpha   = 1 - confidence
    # Pickands-Balkema-de Haan formula for high quantile
    raw_var = u + (sigma / xi) * ((n / Nu * alpha)**(-xi) - 1)

    # CVaR (expected shortfall) above VaR
    cvar = (raw_var + sigma - xi * u) / (1 - xi)
    print(f"EVT VaR({confidence:.0%}): {raw_var:.4f}  CVaR: {cvar:.4f}")
    return raw_var, cvar

np.random.seed(5)
# Student-t losses: heavier tails than normal
from scipy.stats import t as student_t
losses = student_t.rvs(df=4, scale=0.02, size=2000)
losses = -losses[losses < 0]   # keep only loss side
evt_pot_var(losses)`,
    explanation: "The Peaks-Over-Threshold method fits a GPD only to extreme losses above a threshold, making efficient use of tail data; when ξ > 0 (heavy tail), the GPD-based VaR is much larger than Gaussian VaR, correctly capturing the fat tails observed in financial returns.",
  },
  {
    id: "pyfin-20260724-b1-fx-forward",
    language: "python",
    title: "FX forward pricing and covered interest parity",
    tag: "fx",
    code: `import math

def fx_forward(spot, r_domestic, r_foreign, T):
    """
    Price an FX forward via Covered Interest Parity (CIP):
        F = S · exp((r_d - r_f) · T)    [continuous compounding]
        F = S · (1+r_d)^T / (1+r_f)^T  [simple compounding]

    CIP is a near-arbitrage condition: any deviation (cross-currency basis)
    implies funding costs or dollar scarcity in the FX swap market.
    """
    F_cont   = spot * math.exp((r_domestic - r_foreign) * T)
    F_simple = spot * (1 + r_domestic)**T / (1 + r_foreign)**T
    basis_bp = (F_cont / spot - 1 - (r_domestic - r_foreign)) * 10_000
    premium  = (F_cont / spot - 1) * 100
    print(f"Spot:            {spot:.5f}")
    print(f"F (continuous):  {F_cont:.5f}  F (simple): {F_simple:.5f}")
    print(f"Forward premium: {premium:+.4f}%")
    print(f"CIP basis (residual): {basis_bp:+.2f} bp")
    return F_cont

# EUR/USD: US rate 5%, EUR rate 3%, spot=1.10, 1-year forward
F = fx_forward(spot=1.10, r_domestic=0.05, r_foreign=0.03, T=1.0)
# F ≈ 1.10 · e^{0.02} ≈ 1.1222 — USD at premium because higher US rates`,
    explanation: "Covered interest parity states that the forward premium equals the interest rate differential, ensuring no riskless arbitrage via spot + money market + forward; deviations (cross-currency basis) reflect real-world frictions such as dollar funding scarcity and balance-sheet constraints.",
  },
  {
    id: "pyfin-20260724-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal execution trajectory",
    tag: "execution",
    code: `import numpy as np

def almgren_chriss(X0, T, N, sigma, eta, gamma, lam):
    """
    Almgren-Chriss (2001) optimal execution.
    Minimises E[cost] + λ·Var[cost] subject to selling X0 shares in [0,T].

    Parameters
    ----------
    X0    : initial position (shares)
    T     : horizon (days)
    N     : number of trading intervals
    sigma : daily price volatility (fraction)
    eta   : temporary impact coefficient  (cost ∝ η · n²)
    gamma : permanent impact coefficient  (cost ∝ γ · n)
    lam   : risk-aversion (larger → faster execution)
    """
    dt      = T / N
    kappa   = np.sqrt(lam * sigma**2 / eta)    # urgency: larger → more front-loaded
    sinh_kT = np.sinh(kappa * T)

    t_grid = np.linspace(0, T, N + 1)
    # Optimal holdings: X(t) = X0 · sinh(κ(T-t)) / sinh(κT)
    X = X0 * np.sinh(kappa * (T - t_grid)) / sinh_kT
    n = -np.diff(X) / dt                       # shares traded per interval

    # Breakdown of execution cost
    temp_cost = eta  * np.sum(n**2) * dt       # temporary impact cost
    perm_cost = gamma * np.sum(np.abs(n)) * dt # permanent impact cost
    risk      = sigma**2 * np.sum(X[:-1]**2) * dt

    print(f"Urgency κ: {kappa:.4f}  (high κ → TWAP-like fast execution)")
    print(f"Temporary impact cost: {temp_cost:.2f}")
    print(f"Permanent impact cost: {perm_cost:.2f}")
    print(f"Execution risk (var):  {risk:.2f}")
    return X, n

almgren_chriss(X0=1_000_000, T=1.0, N=10,
               sigma=0.015, eta=1e-6, gamma=5e-7, lam=1e-6)`,
    explanation: "The Almgren-Chriss model trades off market impact against execution risk: risk-neutral traders use TWAP, while risk-averse traders front-load execution (high κ), paying more impact to reduce timing risk—the optimal schedule is a sinh-shaped inventory decay.",
  },
  {
    id: "pyfin-20260724-b1-param-var",
    language: "python",
    title: "Parametric (variance-covariance) VaR",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm

def parametric_var(weights, mu, Sigma, confidence=0.99,
                   portfolio_val=1_000_000):
    """
    Delta-normal VaR under the assumption of jointly normal returns.
    VaR_α = -(μ_p + z_α · σ_p) × portfolio_value
    where z_α = Φ^{-1}(1-α) is negative (e.g. -2.326 at 99%).
    """
    w       = np.asarray(weights)
    mu_p    = float(w @ mu)               # portfolio mean daily return
    var_p   = float(w @ Sigma @ w)        # portfolio daily variance
    sigma_p = np.sqrt(var_p)

    z_alpha = norm.ppf(1 - confidence)   # critical value (negative → loss)
    var_1d  = -(mu_p + z_alpha * sigma_p) * portfolio_val
    var_10d = var_1d * np.sqrt(10)        # Basel II square-root scaling

    print(f"Portfolio μ_daily: {mu_p:.4%}  σ_daily: {sigma_p:.4%}")
    print(f"1-day  {confidence:.0%} VaR: \${var_1d:>12,.0f}")
    print(f"10-day {confidence:.0%} VaR: \${var_10d:>12,.0f}")
    return var_1d, var_10d

weights = np.array([0.40, 0.35, 0.25])
mu      = np.array([0.0005, 0.0003, 0.0007])
Sigma   = np.array([[0.000400, 0.000150, 0.000100],
                    [0.000150, 0.000900, 0.000200],
                    [0.000100, 0.000200, 0.001600]])
parametric_var(weights, mu, Sigma)`,
    explanation: "Parametric VaR is the delta-normal benchmark: it is analytically tractable and decomposes naturally into marginal VaR contributions per asset, but understates risk when return distributions are fat-tailed—exactly why Basel III supplements it with stressed VaR and CVaR.",
  },
  {
    id: "pyfin-20260724-b1-ts-pca",
    language: "python",
    title: "Yield-curve PCA (term-structure factor model)",
    tag: "rates",
    code: `import numpy as np

def yield_curve_pca(dy, n_factors=3):
    """
    PCA on daily yield changes (T×n_tenors matrix, in basis points).
    PC1 ≈ parallel shift (~80% of variance).
    PC2 ≈ slope (steepening / flattening).
    PC3 ≈ curvature (butterfly).
    """
    cov     = np.cov(dy.T)                  # n_tenors × n_tenors
    eigvals, eigvecs = np.linalg.eigh(cov)
    idx     = np.argsort(eigvals)[::-1]     # sort descending
    eigvals, eigvecs = eigvals[idx], eigvecs[:, idx]

    loadings  = eigvecs[:, :n_factors]      # n_tenors × k
    factors   = dy @ loadings               # T × k  (factor time series)
    explained = eigvals[:n_factors] / eigvals.sum()

    labels = ["level (parallel)", "slope", "curvature (butterfly)"]
    for i, (ev, lab) in enumerate(zip(explained, labels)):
        lo, hi = loadings[:,i].min(), loadings[:,i].max()
        print(f"PC{i+1} {lab}: {ev:.1%} "
              f"  loading [{lo:.3f}, {hi:.3f}]")

    # Duration-matched hedge: solve for weights w s.t. w'*loadings ≈ 0
    return loadings, factors

tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]
np.random.seed(0)
dy = np.random.randn(500, len(tenors)) * 3.0   # ~3 bp daily vol
yield_curve_pca(dy)`,
    explanation: "Three PCA factors explain over 95% of yield curve movement in most markets: the level shift explains parallel moves in all rates, slope captures short vs long divergence, and curvature captures belly-versus-wings moves — these factors form the basis for DV01/KRD hedging.",
  },
  {
    id: "pyfin-20260724-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy (BDT) binomial rate tree",
    tag: "rates",
    code: `import numpy as np

def bdt_tree(sigma_vec, zero_prices, dt=0.5):
    """
    Simplified BDT tree calibrated to market zero prices and volatilities.
    Short rate: r_{i,j} = median_i · exp(2 · σ_i · j · sqrt(dt))
    where j = node index (j=0 lowest, j=i highest at time step i).
    Median rates bootstrapped from zero prices via forward rates.
    """
    steps = len(sigma_vec)
    zero_prices = np.asarray(zero_prices, dtype=float)
    sigma_vec   = np.asarray(sigma_vec,   dtype=float)

    # Bootstrap median (approximation) short rate from forward rates
    fwd_rates = np.zeros(steps)
    for i in range(steps):
        fwd_rates[i] = np.log(zero_prices[i] / zero_prices[i+1]) / dt

    # Build tree: r[i] is a list of (i+1) rates at time i
    tree = []
    for i in range(steps):
        r_median = fwd_rates[i]    # approximate calibration
        nodes    = [r_median * np.exp(2 * sigma_vec[i] * j * np.sqrt(dt))
                    for j in range(i + 1)]
        tree.append(nodes)
        print(f"t={i*dt:.1f}: " + "  ".join(f"{r:.4f}" for r in nodes))
    return tree

sigma_vec   = [0.18, 0.17, 0.16, 0.15]
zero_prices = [1.0, 0.952, 0.905, 0.860, 0.816]  # P(0, T_i) discount factors
bdt_tree(sigma_vec, zero_prices)`,
    explanation: "The BDT tree calibrates to both the yield curve (via median rates) and cap volatility surface (via σ_i), making it the practical precursor to more general short-rate models; each node's rate follows a lognormal distribution, ensuring non-negative rates in the tree.",
  },
  {
    id: "pyfin-20260724-b1-commodity-fwd",
    language: "python",
    title: "Commodity forward and convenience yield",
    tag: "commodities",
    code: `import math

def commodity_forward(spot, r, storage, convenience_yield, T):
    """
    Commodity forward price with cost-of-carry model:
        F = S · exp((r + c - y) · T)

    r : risk-free rate (continuous)
    c : storage + insurance cost (% of spot, continuous)
    y : convenience yield (continuous) — benefit of holding physical
    Net carry = r + c - y:
      > 0 → contango (futures above spot)
      < 0 → backwardation (futures below spot)
    """
    net_carry = r + storage - convenience_yield
    F = spot * math.exp(net_carry * T)
    term_structure = "contango" if F > spot else "backwardation"

    print(f"Net carry:   {net_carry:+.4f}  ({term_structure})")
    print(f"Spot: {spot:.2f}  →  {T:.1f}Y Forward: {F:.4f}")
    print(f"Forward premium/discount: {(F/spot - 1)*100:+.2f}%")

    # Implied convenience yield from market forward price
    def implied_cy(F_mkt):
        return r + storage - math.log(F_mkt / spot) / T
    print(f"Implied cy if market F={F*0.98:.2f}: "
          f"{implied_cy(F*0.98):.4f}")
    return F

# Crude oil: high storage cost, moderate convenience yield → mild backwardation
commodity_forward(spot=80.0, r=0.05, storage=0.02,
                  convenience_yield=0.08, T=1.0)`,
    explanation: "The convenience yield captures the benefit of holding physical inventory (e.g. production optionality, avoiding supply disruption), and when it exceeds the net cost of carry the forward curve is in backwardation—a signal of tight near-term supply common in energy and agricultural markets.",
  },
  {
    id: "pyfin-20260724-b1-impl-shortfall",
    language: "python",
    title: "Implementation shortfall decomposition",
    tag: "execution",
    code: `def impl_shortfall(decision_px, arrival_px, fills, total_shares):
    """
    Decompose implementation shortfall (IS) into its three components:
      Total IS = Delay cost + Trading cost + Opportunity cost

    decision_px  : price when portfolio manager decided to trade
    arrival_px   : price when order arrived at the market
    fills        : list of (price, qty) execution tuples
    total_shares : target order size
    """
    filled_qty = sum(q for _, q in fills)
    unfilled   = total_shares - filled_qty

    # 1. Delay cost: market moved between decision and arrival
    delay = (arrival_px - decision_px) * total_shares

    # 2. Trading cost: average execution price vs arrival (slippage + impact)
    avg_fill    = sum(p*q for p, q in fills) / filled_qty if filled_qty else arrival_px
    trading     = (avg_fill - arrival_px) * filled_qty

    # 3. Opportunity cost: missed gain on unexecuted shares
    last_px     = fills[-1][0] if fills else arrival_px
    opportunity = (last_px - arrival_px) * unfilled

    total_is = delay + trading + opportunity
    basis_pts = total_is / (arrival_px * total_shares) * 10_000

    print(f"Delay cost:       {delay:+.4f}")
    print(f"Trading cost:     {trading:+.4f}")
    print(f"Opportunity cost: {opportunity:+.4f}")
    print(f"Total IS:         {total_is:+.4f}  ({basis_pts:+.2f} bp)")
    return total_is

fills = [(100.05, 5000), (100.10, 3000), (100.15, 1500)]
impl_shortfall(100.00, 100.02, fills, total_shares=10_000)`,
    explanation: "Implementation shortfall is the standard framework for attributing execution costs: delay cost judges the portfolio manager's timing, trading cost judges the execution desk, and opportunity cost quantifies what was lost on shares that never got filled.",
  },
  {
    id: "pyfin-20260724-b1-rolling-beta",
    language: "python",
    title: "Rolling OLS beta with Vasicek shrinkage",
    tag: "factor-models",
    code: `import numpy as np

def rolling_beta(r_stock, r_market, window=60, vasicek_prior=0.33):
    """
    Rolling 60-day OLS beta:  β = Cov(r_i, r_m) / Var(r_m)
    then applies Vasicek shrinkage toward 1.0 (Blume adjustment):
      β_adj = prior_weight · 1.0 + (1 - prior_weight) · β_raw
    This reduces the well-documented regression-to-the-mean in beta estimates.
    """
    n     = len(r_stock)
    betas = np.full(n, np.nan)

    for t in range(window, n + 1):
        rs = r_stock[t - window:t]
        rm = r_market[t - window:t]
        cov = np.cov(rs, rm, ddof=1)[0, 1]
        var = np.var(rm, ddof=1)
        betas[t - 1] = cov / var if var > 1e-12 else np.nan

    # Vasicek shrinkage: pull extreme betas toward 1
    beta_adj = vasicek_prior * 1.0 + (1 - vasicek_prior) * betas
    return betas, beta_adj

np.random.seed(3)
mkt   = np.random.normal(0.0, 0.01, 300)
stock = 1.4 * mkt + np.random.normal(0, 0.008, 300)
raw, adj = rolling_beta(stock, mkt)
print(f"Raw beta (last): {raw[-1]:.4f}  Adjusted: {adj[-1]:.4f}  (true: 1.40)")`,
    explanation: "Rolling beta captures time-varying market exposure, but short-window estimates are noisy; Vasicek shrinkage toward 1.0 reduces estimation error by exploiting the prior that most stocks have market betas near 1—a practice used by risk systems including MSCI Barra.",
  },
  {
    id: "pyfin-20260724-b1-xsec-momentum",
    language: "python",
    title: "Cross-sectional momentum (Jegadeesh-Titman)",
    tag: "factor-models",
    code: `import numpy as np

def xsec_momentum(returns, lookback=12, skip=1, n_long=3, n_short=3):
    """
    Jegadeesh-Titman (1993) cross-sectional momentum strategy.
    Formation: cumulative return over [t-lookback-skip, t-skip).
    Skipping the most recent month avoids short-term reversal.
    Long top-n, short bottom-n assets; returns are value-weighted within group.
    """
    T, N    = returns.shape
    signals = np.full((T, N), np.nan)

    for t in range(lookback + skip, T):
        start = t - lookback - skip
        end   = t - skip
        # Cumulative return over formation window
        cum_ret = np.prod(1 + returns[start:end], axis=0) - 1  # N-vector
        ranks   = cum_ret.argsort().argsort()              # 0 = worst

        sig = np.zeros(N)
        sig[ranks >= N - n_long]  =  1.0 / n_long    # long winners
        sig[ranks <  n_short]     = -1.0 / n_short   # short losers
        signals[t] = sig

    # Forward return of the portfolio each period
    port_ret = np.nansum(signals[:-1] * returns[1:], axis=1)
    valid    = port_ret[lookback + skip:]
    ann_sharpe = valid.mean() / valid.std() * np.sqrt(12)
    print(f"Mean monthly return: {valid.mean():.4%}")
    print(f"Annualised Sharpe:   {ann_sharpe:.2f}")
    return signals, port_ret

np.random.seed(42)
R = np.random.normal(0.01, 0.06, (120, 20))
xsec_momentum(R)`,
    explanation: "Cross-sectional momentum buys recent winners and sells recent losers across a universe, assuming persistence in relative performance over 3–12 month horizons; the one-month skip avoids microstructure-driven short-term reversal (bid-ask bounce, price impact).",
  },
  {
    id: "pyfin-20260724-b1-factor-neutral",
    language: "python",
    title: "Factor exposure neutralization via OLS projection",
    tag: "factor-models",
    code: `import numpy as np

def neutralize_alpha(alpha, F):
    """
    Remove factor exposures from an alpha signal via OLS residualization.
    α = F β + ε  →  ε_neutral = α - F(F'F)^{-1}F'α

    alpha : N-vector of raw signal values
    F     : N×K matrix of factor exposures (market, size, value, ...)
    Returns the factor-neutral alpha residual.
    """
    alpha = np.asarray(alpha, dtype=float)
    F     = np.asarray(F, dtype=float)

    # Fit α onto factors and subtract the systematic component
    beta  = np.linalg.lstsq(F, alpha, rcond=None)[0]  # K-vector
    alpha_resid = alpha - F @ beta                     # N-vector

    # Verify neutrality: residual correlations with each factor ≈ 0
    for k in range(F.shape[1]):
        corr = np.corrcoef(alpha_resid, F[:, k])[0, 1]
        print(f"Residual corr with factor {k}: {corr:.8f}")
    return alpha_resid

N, K = 300, 5
np.random.seed(7)
F    = np.random.randn(N, K)                           # market, size, value, mom, rev
# Raw alpha has deliberate factor tilts (mixed signal + factor noise)
alpha_raw = F @ np.array([0.5, -0.2, 0.1, 0.3, -0.1]) + np.random.randn(N) * 0.5
alpha_neutral = neutralize_alpha(alpha_raw, F)
print(f"Corr(raw, neutral): {np.corrcoef(alpha_raw, alpha_neutral)[0,1]:.4f}")`,
    explanation: "Factor neutralization via OLS projection ensures the alpha signal carries no systematic risk exposures (market beta, size, etc.), so when the portfolio is constructed the active positions reflect only the idiosyncratic views—this is standard practice in quantitative equity before optimization.",
  },
  {
    id: "pyfin-20260724-b1-vega-bucket",
    language: "python",
    title: "Vega bucketing by expiry tenor",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_vega(S, K, r, sigma, T):
    """∂C/∂σ = S · √T · N'(d1)  (same for calls and puts)."""
    d1 = (np.log(S / K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return S * np.sqrt(T) * norm.pdf(d1)

def vega_buckets(options, S, r, bucket_tenors):
    """
    Aggregate dollar vega into discrete tenor buckets.
    Dollar vega = vega × position × multiplier ($ per 1 vol pt, i.e. 1%).
    Assigns each option to its nearest tenor bucket.
    """
    buckets = {t: 0.0 for t in bucket_tenors}
    for opt in options:
        v   = bs_vega(S, opt["K"], r, opt["sigma"], opt["T"])
        dv  = v * opt["position"] * opt["multiplier"] * 0.01  # per 1 vol pt
        nearest = min(bucket_tenors, key=lambda t: abs(t - opt["T"]))
        buckets[nearest] += dv

    print("Vega by tenor ($ per 1 vol pt):")
    for t in sorted(buckets):
        print(f"  {t:.2f}Y: \${buckets[t]:>+12,.0f}")
    net = sum(buckets.values())
    print(f"  Net vega: \${net:>+12,.0f}")
    return buckets

options = [
    {"K": 100, "T": 0.25, "sigma": 0.20, "position":  1000, "multiplier": 100},
    {"K": 105, "T": 0.25, "sigma": 0.22, "position": -2000, "multiplier": 100},
    {"K": 100, "T": 1.00, "sigma": 0.18, "position":  1500, "multiplier": 100},
]
vega_buckets(options, S=100.0, r=0.05,
             bucket_tenors=[0.25, 0.5, 1.0, 2.0])`,
    explanation: "Vega bucketing groups option positions by expiry to show the term structure of volatility exposure; traders monitor the net vega in each tenor bucket to ensure their book is not inadvertently long short-dated vol and short long-dated vol (or vice versa).",
  },
  {
    id: "pyfin-20260724-b1-stress-var",
    language: "python",
    title: "Historical stress VaR (regulatory approach)",
    tag: "risk",
    code: `import numpy as np

def stress_var(portfolio_weights, historical_returns,
               stress_windows, confidence=0.99):
    """
    Stressed VaR: replay defined stress periods through the current portfolio.
    stress_windows: dict of {label: (start_idx, end_idx)}.
    Returns max(historical VaR, scenario-augmented VaR).
    """
    w = np.asarray(portfolio_weights)
    R = np.asarray(historical_returns)

    pnl_full = R @ w                          # full-history portfolio P&L
    var_hist = -np.quantile(pnl_full, 1 - confidence)

    stress_pnls = []
    for label, (s, e) in stress_windows.items():
        pnl_s    = R[s:e] @ w
        worst    = pnl_s.min()
        cumul    = (1 + pnl_s).prod() - 1
        stress_pnls.append(pnl_s)
        print(f"{label}: worst day={worst:.2%}  cumulative={cumul:.2%}")

    # Augmented distribution: historical + stress returns
    combined   = np.concatenate([pnl_full] + stress_pnls)
    var_stress = -np.quantile(combined, 1 - confidence)

    print(f"Historical VaR({confidence:.0%}): {var_hist:.4%}")
    print(f"Stressed    VaR({confidence:.0%}): {var_stress:.4%}")
    # Basel 2.5 uses max(current VaR, stressed VaR) × scaling factor
    return max(var_hist, var_stress)

np.random.seed(0)
R = np.random.normal(0.0005, 0.01, (1000, 5))
w = np.array([0.30, 0.25, 0.20, 0.15, 0.10])
scenarios = {"2008-GFC": (100, 200), "COVID-2020": (600, 650)}
stress_var(w, R, scenarios)`,
    explanation: "Stressed VaR augments historical simulation with explicit crisis periods (GFC, COVID, dot-com crash), ensuring the VaR model is calibrated to periods of extreme market stress rather than the relatively calm periods that dominate a multi-year history.",
  },
];
