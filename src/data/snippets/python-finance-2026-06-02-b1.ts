import type { Snippet } from "./types";

export const pythonFinanceSnippets20260602B1: Snippet[] = [
  {
    id: "pyfin-20260602-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal execution trajectory",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X: float,       # shares to liquidate
    T: float,       # time horizon (days)
    sigma: float,   # daily volatility
    eta: float,     # temporary market impact coefficient
    tau: float,     # risk-aversion parameter
    n: int = 100,
) -> np.ndarray:
    """Returns remaining shares x(t) at each of n+1 time steps."""
    t = np.linspace(0, T, n + 1)
    kappa = np.sqrt(tau * sigma**2 / eta)
    # Closed-form AC trajectory: exponential shape controlled by kappa.
    traj = X * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)
    return traj

# High tau -> trade fast (timing risk dominates impact cost)
# Low tau  -> trade slowly (impact cost dominates)
traj = almgren_chriss_trajectory(X=1_000_000, T=1.0,
                                  sigma=0.02, eta=1e-6, tau=1e-5)
print(f"midpoint remaining: {traj[50]:,.0f} shares")`,
    explanation:
      "Almgren-Chriss (2001) is the foundational optimal execution model: it balances permanent/temporary market impact (cost of trading fast) against timing risk (cost of trading slowly). The hyperbolic sine trajectory is the closed-form solution to a mean-variance optimal control problem.",
  },
  {
    id: "pyfin-20260602-b1-gpd-evt",
    language: "python",
    title: "Extreme Value Theory — GPD tail risk beyond VaR",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto

# Peaks-over-threshold (POT) approach: fit a Generalized Pareto
# Distribution to exceedances beyond a high threshold u.
np.random.seed(42)
returns = np.random.standard_t(df=4, size=5000) * 0.01  # fat-tailed

u = np.quantile(returns, 0.95)          # threshold at 95th percentile
exceedances = returns[returns > u] - u  # excesses above u

# Fit GPD shape (xi) and scale (beta) to the tail.
xi, loc, beta = genpareto.fit(exceedances, floc=0)
print(f"GPD shape xi={xi:.3f}, scale beta={beta:.5f}")

# EVT-based VaR at 99.9% (beyond historical simulation range).
alpha = 0.999
n_total = len(returns)
n_tail  = len(exceedances)
var_evt = u + (beta / xi) * ((n_total / n_tail * (1 - alpha))**(-xi) - 1)
print(f"EVT 99.9% VaR: {var_evt:.4f}")`,
    explanation:
      "The Peaks-over-Threshold method fits a Generalized Pareto Distribution to the tail beyond a threshold, allowing you to estimate extreme quantiles (99.9%, 99.99%) far beyond the data range. The shape parameter xi > 0 confirms a fat tail; xi near 0 is exponential (Gaussian-like).",
  },
  {
    id: "pyfin-20260602-b1-black-karasinski",
    language: "python",
    title: "Black-Karasinski short-rate model — log-normal mean reversion",
    tag: "finance",
    code: `import numpy as np

def black_karasinski_mc(r0: float, kappa: float, theta: float,
                         sigma: float, T: float,
                         n_steps: int = 252, n_paths: int = 10_000,
                         seed: int = 42) -> np.ndarray:
    """
    Simulate log-normal mean-reverting short rate:
      d(ln r) = kappa*(theta - ln r) dt + sigma dW
    Returns (n_paths, n_steps+1) array of short rates.
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    ln_r = np.full((n_paths, n_steps + 1), np.log(r0))
    for t in range(n_steps):
        dW = rng.standard_normal(n_paths) * np.sqrt(dt)
        ln_r[:, t + 1] = (ln_r[:, t]
                          + kappa * (theta - ln_r[:, t]) * dt
                          + sigma * dW)
    return np.exp(ln_r)

rates = black_karasinski_mc(r0=0.03, kappa=0.5, theta=np.log(0.04),
                             sigma=0.15, T=1.0)
print(f"mean terminal rate: {rates[:, -1].mean():.4f}")`,
    explanation:
      "Black-Karasinski models the log of the short rate as an Ornstein-Uhlenbeck process, ensuring rates stay positive (unlike Vasicek). The parameter theta is the long-run mean of ln(r), so the long-run mean rate is exp(theta). Calibrate to cap/floor volatility quotes.",
  },
  {
    id: "pyfin-20260602-b1-margrabe",
    language: "python",
    title: "Margrabe's formula — spread option on two assets",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def margrabe(S1: float, S2: float, sigma1: float, sigma2: float,
             rho: float, T: float, q1: float = 0.0, q2: float = 0.0) -> float:
    """
    Price of option to exchange asset 2 for asset 1: max(S1 - S2, 0).
    Closed form under log-normal dynamics with correlation rho.
    """
    sigma = np.sqrt(sigma1**2 + sigma2**2 - 2 * rho * sigma1 * sigma2)
    F1 = S1 * np.exp(-q1 * T)
    F2 = S2 * np.exp(-q2 * T)
    if sigma < 1e-12 or T < 1e-12:
        return max(F1 - F2, 0.0)
    d1 = (np.log(F1 / F2) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return F1 * norm.cdf(d1) - F2 * norm.cdf(d2)

# Crack spread option: right to exchange crude for gasoline
price = margrabe(S1=95.0, S2=90.0, sigma1=0.30, sigma2=0.25,
                 rho=0.80, T=0.25)
print(f"spread option: {price:.4f}")`,
    explanation:
      "Margrabe (1978) prices the option to exchange one asset for another in closed form — it generalises Black-Scholes by using the second asset as numeraire. The effective vol is the spread vol: sqrt(sigma1^2 + sigma2^2 - 2*rho*sigma1*sigma2), which shrinks when the assets are highly correlated.",
  },
  {
    id: "pyfin-20260602-b1-yield-pca",
    language: "python",
    title: "PCA on yield curve — parallel shift, twist, butterfly",
    tag: "finance",
    code: `import numpy as np
from sklearn.decomposition import PCA

# Simulated weekly yield changes (rows) for tenors 2Y, 5Y, 10Y, 20Y, 30Y.
np.random.seed(0)
n_obs   = 200
tenors  = [2, 5, 10, 20, 30]
# Generate correlated changes: 3 underlying factors.
F  = np.random.standard_normal((n_obs, 3))
L  = np.array([[0.9, 0.0, 0.1],   # 2Y loading
               [0.8, 0.3, 0.0],   # 5Y
               [0.7, 0.5,-0.2],   # 10Y
               [0.6, 0.4,-0.4],   # 20Y
               [0.5, 0.3,-0.5]])  # 30Y
changes = F @ L.T + np.random.standard_normal((n_obs, 5)) * 0.02

pca = PCA(n_components=3)
pca.fit(changes)
print("variance explained:", pca.explained_variance_ratio_.round(3))
# PC1 ~ parallel shift, PC2 ~ twist (slope), PC3 ~ butterfly (curvature)
for i, comp in enumerate(pca.components_):
    print(f"PC{i+1}: {dict(zip(tenors, comp.round(3)))}")`,
    explanation:
      "The first three PCA components of a yield curve explain 95%+ of its daily moves: PC1 is a parallel shift (~85%), PC2 is a slope twist (~10%), PC3 is a curvature butterfly (~3%). This decomposition is the basis of DV01 bucketing and yield-curve delta hedging.",
  },
  {
    id: "pyfin-20260602-b1-hrp",
    language: "python",
    title: "Hierarchical Risk Parity (HRP) portfolio construction",
    tag: "finance",
    code: `import numpy as np
from scipy.cluster.hierarchy import linkage, to_tree
from scipy.spatial.distance import squareform

def hrp_weights(cov: np.ndarray) -> np.ndarray:
    """Inverse-variance HRP weights from a covariance matrix."""
    n = cov.shape[0]
    # Correlation-based distance matrix for clustering.
    corr = cov / np.sqrt(np.outer(np.diag(cov), np.diag(cov)))
    dist = np.sqrt(0.5 * (1 - corr))

    # Hierarchical clustering (Ward linkage).
    link = linkage(squareform(dist), method="ward")

    # Bisect the tree, allocating risk inverse-proportionally to variance.
    w = np.ones(n)
    items = list(range(n))

    def recurse(ids):
        if len(ids) == 1:
            return
        mid = len(ids) // 2
        left, right = ids[:mid], ids[mid:]
        v_left  = float(w[left] @ cov[np.ix_(left, left)] @ w[left])
        v_right = float(w[right] @ cov[np.ix_(right, right)] @ w[right])
        alpha   = v_right / (v_left + v_right)   # allocate less to riskier cluster
        w[left]  *= alpha
        w[right] *= (1 - alpha)
        recurse(left)
        recurse(right)

    recurse(items)
    return w / w.sum()

np.random.seed(1)
cov = np.cov(np.random.standard_normal((10, 252)))
print(hrp_weights(cov).round(4))`,
    explanation:
      "HRP (Lopez de Prado 2016) avoids inverting the covariance matrix — which amplifies estimation error in mean-variance optimisation — by allocating risk via hierarchical clustering. It produces well-diversified portfolios that outperform naive equal-weight out-of-sample on many datasets.",
  },
  {
    id: "pyfin-20260602-b1-kelly-fractional",
    language: "python",
    title: "Kelly criterion with estimation error — fractional Kelly",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(mu: float, sigma: float, rf: float = 0.0) -> float:
    """Full Kelly fraction for a normally distributed excess return."""
    excess = mu - rf
    return excess / sigma**2

def fractional_kelly(mus: np.ndarray, sigma: float,
                     rf: float = 0.0, fraction: float = 0.5) -> float:
    """
    Fractional Kelly accounts for parameter uncertainty.
    mus: bootstrap or Bayesian posterior samples of expected return.
    """
    # Average Kelly over the posterior distribution of mu.
    # This naturally shrinks toward zero when there is estimation error.
    full_kelly = np.mean([kelly_fraction(m, sigma, rf) for m in mus])
    return fraction * full_kelly   # 0.5 Kelly is common in practice

# Simulate uncertainty in expected return estimate.
np.random.seed(42)
mu_hat   = 0.12     # point estimate
sigma_mu = 0.06     # standard error of mu estimate
sigma    = 0.20     # asset volatility

posterior_mus = np.random.normal(mu_hat, sigma_mu, size=10_000)
f = fractional_kelly(posterior_mus, sigma)
print(f"full Kelly: {kelly_fraction(mu_hat, sigma):.3f}")
print(f"fractional Kelly (0.5x): {f:.3f}")`,
    explanation:
      "Full Kelly maximises long-run log-wealth but is extraordinarily sensitive to mu estimation error — a 2x overestimate of expected return leads to double the Kelly bet and can bankrupt the portfolio. Fractional Kelly (typically 0.25–0.5x) provides substantial downside protection at modest long-run cost.",
  },
  {
    id: "pyfin-20260602-b1-merton-jump",
    language: "python",
    title: "Merton jump diffusion — Monte Carlo with Poisson jumps",
    tag: "finance",
    code: `import numpy as np

def merton_call_mc(S: float, K: float, r: float, sigma: float, T: float,
                   lam: float, mu_j: float, sigma_j: float,
                   n: int = 200_000, seed: int = 42) -> float:
    """
    Merton (1976) jump diffusion. Jumps arrive as Poisson(lam*T) process;
    each jump size is log-normal: ln(J) ~ N(mu_j, sigma_j^2).
    """
    rng = np.random.default_rng(seed)
    # Drift adjusted so E[S_T] = S * exp(r*T) (risk-neutral).
    r_adj = r - lam * (np.exp(mu_j + 0.5 * sigma_j**2) - 1)

    # Continuous part of the return.
    z   = rng.standard_normal(n)
    ST  = S * np.exp((r_adj - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * z)

    # Add Poisson number of log-normal jumps to each path.
    n_jumps  = rng.poisson(lam * T, size=n)
    for path_i in range(n):
        k = n_jumps[path_i]
        if k > 0:
            jump_sizes = rng.normal(mu_j, sigma_j, size=k)
            ST[path_i] *= np.exp(np.sum(jump_sizes))

    return np.exp(-r * T) * np.maximum(ST - K, 0.0).mean()

price = merton_call_mc(100, 100, 0.05, 0.15, 1.0,
                        lam=1.0, mu_j=-0.10, sigma_j=0.15)
print(f"Merton call: {price:.4f}")`,
    explanation:
      "Merton's jump diffusion adds sudden discontinuous moves to GBM, producing fatter tails and a volatility smile. The compensator r_adj ensures the discounted stock price is a martingale. Calibrate lambda (jump intensity), mu_j (mean log-jump), and sigma_j (jump vol) to the observed implied vol smile.",
  },
  {
    id: "pyfin-20260602-b1-cross-gamma",
    language: "python",
    title: "Cross-gamma P&L — joint moves in two underlyings",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / sT
    d2 = d1 - sT
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def cross_gamma_pnl(S1, S2, K, r, sigma1, sigma2, rho, T,
                     dS1, dS2) -> dict:
    """
    P&L decomposition for a spread-like position across two correlated
    underlyings. Cross-gamma = d^2V / (dS1 dS2).
    """
    h = 1e-3
    # Numerical cross-gamma via mixed partial derivative.
    v_uu = bs_call(S1 + h * S1, K, r, sigma1, T) + bs_call(S2 + h * S2, K, r, sigma2, T)
    v_ud = bs_call(S1 + h * S1, K, r, sigma1, T) + bs_call(S2 - h * S2, K, r, sigma2, T)
    v_du = bs_call(S1 - h * S1, K, r, sigma1, T) + bs_call(S2 + h * S2, K, r, sigma2, T)
    v_dd = bs_call(S1 - h * S1, K, r, sigma1, T) + bs_call(S2 - h * S2, K, r, sigma2, T)
    cross_gam = (v_uu - v_ud - v_du + v_dd) / (4 * h**2 * S1 * S2)

    return {
        "cross_gamma": cross_gam,
        "cross_gamma_pnl": 0.5 * cross_gam * dS1 * dS2 * rho,
    }

result = cross_gamma_pnl(100, 100, 100, 0.05, 0.2, 0.2, 0.6, 0.5,
                          dS1=1.0, dS2=1.0)
print(result)`,
    explanation:
      "Cross-gamma (d²V/dS₁dS₂) measures P&L sensitivity to simultaneous moves in two underlyings — the 'correlation risk' component of a multi-asset book. It appears naturally in basket options, spread options, and any dispersion trade, and is missed entirely by single-asset delta-gamma attribution.",
  },
  {
    id: "pyfin-20260602-b1-factor-alpha-decay",
    language: "python",
    title: "Factor alpha half-life estimation via AR(1) autocorrelation",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm

def alpha_half_life(signal: np.ndarray) -> float:
    """
    Estimate the half-life of a mean-reverting signal using AR(1).
    Returns the number of periods for the signal to decay by 50%.
    """
    lagged = signal[:-1]
    current = signal[1:]
    X = sm.add_constant(lagged)
    res = sm.OLS(current, X).fit()
    beta = res.params[1]           # AR(1) coefficient
    if beta >= 1.0 or beta <= 0:
        return float("inf")        # non-stationary or no persistence
    return -np.log(2) / np.log(beta)

# Simulate a decaying alpha signal with 20-day half-life.
np.random.seed(42)
n = 500
beta_true = np.exp(-np.log(2) / 20)   # ~0.966 for 20-day HL
signal = np.zeros(n)
for t in range(1, n):
    signal[t] = beta_true * signal[t - 1] + np.random.normal(0, 0.1)
signal += np.random.normal(0, 0.01, n)   # add noise

hl = alpha_half_life(signal)
print(f"estimated half-life: {hl:.1f} days")   # ~20`,
    explanation:
      "Alpha half-life governs how quickly to act on a signal: a 5-day half-life demands daily rebalancing; a 60-day half-life is compatible with weekly. Estimating it via AR(1) gives you both the decay rate and its statistical significance — a t-stat below 2 on the AR coefficient means the 'persistence' may be noise.",
  },
  {
    id: "pyfin-20260602-b1-cvxpy-mv",
    language: "python",
    title: "Mean-variance optimisation with cvxpy — constrained efficient frontier",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def mv_optimize(mu: np.ndarray, cov: np.ndarray,
                 target_return: float,
                 max_weight: float = 0.30) -> np.ndarray:
    """
    Minimum variance portfolio for a given target return.
    Constraints: long-only, max single weight, fully invested.
    """
    n = len(mu)
    w = cp.Variable(n)
    port_var  = cp.quad_form(w, cov)
    port_ret  = mu @ w

    prob = cp.Problem(
        cp.Minimize(port_var),
        [
            port_ret >= target_return,
            cp.sum(w) == 1.0,
            w >= 0,
            w <= max_weight,
        ]
    )
    prob.solve(solver=cp.OSQP, warm_start=True)
    return w.value

np.random.seed(7)
n_assets = 10
mu  = np.random.uniform(0.05, 0.15, n_assets)
cov = np.cov(np.random.standard_normal((n_assets, 252))) * 252

weights = mv_optimize(mu, cov, target_return=0.10)
if weights is not None:
    print(f"weights: {weights.round(3)}")
    print(f"portfolio vol: {np.sqrt(weights @ cov @ weights):.3f}")`,
    explanation:
      "cvxpy formulates portfolio optimisation as a disciplined convex program: the objective (minimize variance) and constraints (returns, weights) are declared symbolically and solved by an interior-point QP solver. The warm_start flag re-uses the previous solution — critical for real-time rebalancing across a frontier grid.",
  },
  {
    id: "pyfin-20260602-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model — 2-state volatility regime detection",
    tag: "finance",
    code: `import numpy as np
# pip install hmmlearn
from hmmlearn.hmm import GaussianHMM

np.random.seed(42)
# Simulate returns: low-vol regime (0) and high-vol regime (1).
n = 500
regimes = np.random.choice([0, 1], size=n, p=[0.7, 0.3])
rets = np.where(regimes == 0,
                np.random.normal(0.0005, 0.008, n),   # low-vol
                np.random.normal(-0.001, 0.025, n))   # high-vol

model = GaussianHMM(n_components=2, covariance_type="diag",
                     n_iter=200, random_state=0)
model.fit(rets.reshape(-1, 1))

hidden = model.predict(rets.reshape(-1, 1))
# State with higher variance = high-vol regime.
vars_ = [model.covars_[i][0, 0] for i in range(2)]
hi_vol_state = int(np.argmax(vars_))
print(f"high-vol state: {hi_vol_state}")
print(f"transition matrix:\\n{model.transmat_.round(3)}")`,
    explanation:
      "A 2-state HMM captures the well-documented bull/bear or low-vol/high-vol duality in equity returns. The Baum-Welch EM algorithm fits transition probabilities and emission parameters jointly. In practice, combine HMM regime estimates with VIX levels for a robust real-time regime indicator.",
  },
  {
    id: "pyfin-20260602-b1-robust-cov",
    language: "python",
    title: "Robust covariance (MinCovDet) — outlier-resistant correlation",
    tag: "finance",
    code: `import numpy as np
from sklearn.covariance import MinCovDet

np.random.seed(3)
n, p = 200, 5
# Clean returns plus 10% contamination (fat-tail shocks).
X_clean   = np.random.multivariate_normal(np.zeros(p), np.eye(p), n)
X_outlier = np.random.uniform(-8, 8, (20, p))
X = np.vstack([X_clean, X_outlier])

# Standard sample covariance — massively distorted by outliers.
cov_sample = np.cov(X.T)

# Minimum Covariance Determinant: finds the subset of h observations
# with smallest determinant, iteratively refining a robust estimate.
mcd = MinCovDet(support_fraction=0.85, random_state=0)
mcd.fit(X)
cov_robust = mcd.covariance_

print("sample cov max off-diag:", np.abs(cov_sample - np.diag(np.diag(cov_sample))).max())
print("robust cov max off-diag:", np.abs(cov_robust - np.diag(np.diag(cov_robust))).max())`,
    explanation:
      "The Minimum Covariance Determinant estimator (Rousseeuw 1984) is breakdown-point 0.5: up to 50% of observations can be outliers without corrupting the estimate. This is critical for risk models built on daily equity returns that include earnings gaps, flash crashes, and crisis days.",
  },
  {
    id: "pyfin-20260602-b1-epps-effect",
    language: "python",
    title: "Epps effect — correlation underestimation at high frequency",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def epps_demo(n_obs: int = 10_000, true_rho: float = 0.70) -> pd.DataFrame:
    """
    Generate two correlated assets sampled asynchronously, then
    measure realised correlation at different sampling frequencies.
    The Epps effect: correlation -> 0 as frequency -> tick level.
    """
    rng = np.random.default_rng(42)
    # True underlying: bivariate normal increments.
    cov = np.array([[1.0, true_rho], [true_rho, 1.0]]) * 0.001
    increments = rng.multivariate_normal([0, 0], cov, n_obs)
    prices = np.exp(np.cumsum(increments, axis=0))

    records = []
    for freq in [1, 5, 10, 30, 60, 120, 240]:
        r1 = np.diff(np.log(prices[::freq, 0]))
        r2 = np.diff(np.log(prices[::freq, 1]))
        rho = np.corrcoef(r1, r2)[0, 1]
        records.append({"sampling_interval": freq, "measured_rho": round(rho, 4)})
    return pd.DataFrame(records)

print(epps_demo())`,
    explanation:
      "The Epps effect (1979) states that pairwise correlation measured from tick data is severely underestimated because two assets are never traded at the exact same millisecond. Synchronisation methods (refresh time, Hayashi-Yoshida estimator) correct for this. Always report the sampling frequency alongside any HF correlation estimate.",
  },
  {
    id: "pyfin-20260602-b1-carry-futures",
    language: "python",
    title: "Futures roll yield and carry decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def futures_carry(spot: float, futures_price: float,
                  cost_of_carry: float, T_years: float,
                  dividend_yield: float = 0.0) -> dict:
    """
    Decompose the futures basis into carry components:
      F = S * exp((r - q + c) * T)
    where r = risk-free, q = dividend yield, c = storage/convenience.
    """
    implied_carry = np.log(futures_price / spot) / T_years
    r_minus_q     = implied_carry - cost_of_carry
    roll_yield    = -implied_carry   # positive when futures < spot (backwardation)
    return {
        "implied_net_carry": round(implied_carry, 4),
        "roll_yield_annualised": round(roll_yield, 4),
        "r_minus_q": round(r_minus_q, 4),
        "backwardation": futures_price < spot,
    }

# S&P 500 example: spot 5000, Jun future 4985, r=5.2%, q=1.5%, T=3/12
result = futures_carry(spot=5000, futures_price=4985,
                        cost_of_carry=0.052 - 0.015, T_years=3/12)
print(result)`,
    explanation:
      "The roll yield is the return earned by rolling a futures position (selling expiring contract, buying deferred) independent of spot price movement. In backwardation the roll yield is positive — a key driver of commodity carry strategies. Decomposing basis into r, q, and convenience yield is fundamental to basis trading.",
  },
  {
    id: "pyfin-20260602-b1-lvar",
    language: "python",
    title: "Liquidity-adjusted VaR (LVaR) — exogenous liquidity cost",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def liquidity_adjusted_var(position_value: float,
                             daily_vol: float,
                             bid_ask_spread: float,
                             confidence: float = 0.99,
                             holding_days: int = 1) -> dict:
    """
    LVaR = Market Risk VaR + Liquidity Cost.
    Exogenous liquidity: cost = 0.5 * spread * position_value.
    """
    z          = norm.ppf(confidence)
    market_var = position_value * daily_vol * z * np.sqrt(holding_days)
    # Liquidity cost: half the bid-ask spread to unwind the position.
    liq_cost   = 0.5 * bid_ask_spread * position_value
    lvar       = market_var + liq_cost
    return {
        "market_VaR": round(market_var, 2),
        "liquidity_cost": round(liq_cost, 2),
        "LVaR": round(lvar, 2),
        "liq_fraction": round(liq_cost / lvar, 4),
    }

result = liquidity_adjusted_var(
    position_value=10_000_000,
    daily_vol=0.015,
    bid_ask_spread=0.0050,   # 50 bps spread (illiquid small-cap)
    confidence=0.99,
)
print(result)`,
    explanation:
      "Standard VaR ignores the cost of actually unwinding a position under stress. LVaR adds the exogenous liquidity cost (half the bid-ask spread) to the market risk component — this can dominate for illiquid positions. Endogenous LVaR also models how large trades move prices (Almgren-Chriss impact).",
  },
  {
    id: "pyfin-20260602-b1-backtest-costs",
    language: "python",
    title: "Backtest with realistic transaction costs and slippage",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def realistic_backtest(
    prices: pd.Series,
    signal: pd.Series,
    half_spread_bps: float = 2.0,
    market_impact_bps: float = 3.0,
    borrow_cost_bps_pa: float = 50.0,
) -> pd.DataFrame:
    """
    Vectorised backtest with three cost layers:
      1. Half-spread: paid on every trade entry/exit
      2. Market impact: price impact of filling the order
      3. Borrow cost: daily accrual on short positions
    """
    pos     = signal.shift(1).fillna(0).clip(-1, 1)
    ret     = np.log(prices / prices.shift(1)).fillna(0)
    trades  = pos.diff().fillna(0).abs()   # turnover per day

    spread_cost  = trades * half_spread_bps * 1e-4
    impact_cost  = trades * market_impact_bps * 1e-4
    borrow_cost  = (pos < 0).astype(float) * borrow_cost_bps_pa / 252 * 1e-4

    gross_pnl = pos * ret
    net_pnl   = gross_pnl - spread_cost - impact_cost - borrow_cost

    result = pd.DataFrame({
        "gross_pnl": gross_pnl,
        "net_pnl":   net_pnl,
        "costs":     spread_cost + impact_cost + borrow_cost,
    })
    result["equity"] = (result["net_pnl"]).cumsum().apply(np.exp)
    return result

# summary stats
np.random.seed(0)
px = pd.Series(100 * np.exp(np.cumsum(np.random.normal(0, 0.01, 500))))
sig = pd.Series(np.sin(np.linspace(0, 10 * np.pi, 500)))
bt = realistic_backtest(px, sig)
print(f"gross Sharpe: {np.sqrt(252)*bt.gross_pnl.mean()/bt.gross_pnl.std():.2f}")
print(f"net Sharpe:   {np.sqrt(252)*bt.net_pnl.mean()/bt.net_pnl.std():.2f}")`,
    explanation:
      "A 'Sharpe 3' strategy can easily become 'Sharpe 0.5' after costs. Separating spread, impact, and borrow cost layers lets you diagnose which cost is killing the strategy: high turnover kills spread-sensitive strategies; large sizes kill impact-sensitive ones; short-only bias is punished by borrow rates.",
  },
  {
    id: "pyfin-20260602-b1-numerical-greeks",
    language: "python",
    title: "Numerical Greeks via central finite differences (vectorised)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    """Vectorised Black-Scholes call price (arrays OK)."""
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / sT
    d2 = d1 - sT
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def numerical_greeks(S, K, r, sigma, T):
    hS  = S * 1e-4
    hv  = 1e-4
    hr  = 1e-4
    hT  = 1.0 / 252.0

    v0  = bs_call(S, K, r, sigma, T)
    vup = bs_call(S + hS, K, r, sigma, T)
    vdn = bs_call(S - hS, K, r, sigma, T)

    return {
        "delta": (vup - vdn) / (2 * hS),
        "gamma": (vup - 2 * v0 + vdn) / hS**2,
        "vega":  (bs_call(S, K, r, sigma + hv, T) - bs_call(S, K, r, sigma - hv, T)) / (2 * hv),
        "theta": -(bs_call(S, K, r, sigma, T - hT) - v0) / hT,
        "rho":   (bs_call(S, K, r + hr, sigma, T) - bs_call(S, K, r - hr, sigma, T)) / (2 * hr),
    }

g = numerical_greeks(S=100, K=100, r=0.05, sigma=0.20, T=1.0)
for name, val in g.items():
    print(f"{name}: {val:.6f}")`,
    explanation:
      "Central differences give O(h²) accuracy — much better than one-sided bumps for the same h. This pattern is model-agnostic: replace bs_call with a Monte Carlo pricer or a binomial tree and the same greek calculator works without modification.",
  },
  {
    id: "pyfin-20260602-b1-bond-ladder",
    language: "python",
    title: "Bond ladder — duration-matched liability immunisation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import linprog

def bond_ladder(
    liabilities: np.ndarray,   # cash flows needed at each year
    coupons: np.ndarray,       # coupon rates for each bond (row = bond, col = year)
    prices: np.ndarray,        # dirty prices
) -> np.ndarray:
    """
    Minimum-cost portfolio of bonds whose cash flows cover the liabilities.
    Uses linear programming: min sum(prices * holdings)
    subject to: (coupons + face_value) @ holdings >= liabilities
    """
    n_bonds, n_years = coupons.shape
    # Objective: minimise total cost.
    c = prices
    # Constraints: bond cash flows must cover each year's liability.
    # -A_ub @ x <= -b_ub  i.e. sum of CFs >= liabilities
    A_ub = -coupons.T           # shape (n_years, n_bonds)
    b_ub = -liabilities
    bounds = [(0, None)] * n_bonds   # non-negative holdings

    res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")
    return res.x if res.success else np.zeros(n_bonds)

# Simple 3-year example: 4 bonds, 3 years of liabilities.
liabilities = np.array([100_000.0, 150_000.0, 200_000.0])
coupons     = np.array([[5_000, 5_000, 105_000],
                         [0,     0,     110_000],
                         [6_000, 106_000, 0    ],
                         [4_500, 4_500,   104_500]])
prices      = np.array([99.5, 95.0, 101.0, 98.0])

holdings = bond_ladder(liabilities, coupons, prices)
print("bond holdings:", holdings.round(2))`,
    explanation:
      "Bond laddering via LP is the core tool of liability-driven investing (LDI): pension funds and insurers minimise the cost of a bond portfolio whose cash flows exactly cover future liability streams. The LP dual solution gives the shadow prices (zero-coupon rates) that price the liabilities.",
  },
];
