import type { Snippet } from "./types";

export const pythonFinanceSnippets20260628B1: Snippet[] = [
  {
    id: "pyfin-20260628-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Correlated Asset Returns",
    tag: "risk",
    code: `import numpy as np
from scipy import stats

def gaussian_copula_samples(rho_matrix: np.ndarray,
                             marginals: list,
                             n_samples: int,
                             seed: int = 42) -> np.ndarray:
    """
    Simulate correlated samples via Gaussian copula.
    marginals: list of scipy.stats frozen distributions (e.g. stats.norm(...))
    Returns array of shape (n_samples, n_assets).
    """
    rng = np.random.default_rng(seed)
    n  = rho_matrix.shape[0]
    L  = np.linalg.cholesky(rho_matrix)        # Cholesky factor of correlation matrix

    # Step 1: draw independent standard normals
    Z = rng.standard_normal((n_samples, n))

    # Step 2: induce correlation via Cholesky transform X = Z @ L.T
    X = Z @ L.T                                 # shape (n_samples, n)

    # Step 3: convert to uniform via the standard normal CDF
    U = stats.norm.cdf(X)                       # U ~ Uniform(0,1) with Gauss copula structure

    # Step 4: apply per-asset inverse CDF (quantile transform)
    samples = np.column_stack([
        m.ppf(U[:, i]) for i, m in enumerate(marginals)
    ])
    return samples

# Example: 3 correlated lognormal assets
rho = np.array([[1.0, 0.6, 0.3],
                [0.6, 1.0, 0.5],
                [0.3, 0.5, 1.0]])

marginals = [
    stats.norm(loc=0.08, scale=0.20),   # equity-like
    stats.norm(loc=0.03, scale=0.05),   # bond-like
    stats.t(df=4, loc=0.00, scale=0.15) # fat-tailed credit spread
]

sims = gaussian_copula_samples(rho, marginals, n_samples=10_000)
print("Empirical correlations:")
print(np.corrcoef(sims.T).round(2))`,
    explanation: "The Gaussian copula separates the dependence structure (encoded in the correlation matrix) from the marginal distributions, allowing you to combine, say, a lognormal equity return with a t-distributed credit spread while preserving a specified rank correlation — the same approach (misused) that underpinned CDO pricing in the mid-2000s.",
  },
  {
    id: "pyfin-20260628-b1-t-copula",
    language: "python",
    title: "Student-t Copula for Fat-Tail Joint Risk",
    tag: "risk",
    code: `import numpy as np
from scipy import stats, linalg

def t_copula_samples(rho_matrix: np.ndarray,
                     df: float,
                     n_samples: int,
                     seed: int = 0) -> np.ndarray:
    """
    Simulate from a Student-t copula with df degrees of freedom.
    Returns uniform marginals with t-copula dependence (shape n_samples x n).
    t-copula has upper/lower tail dependence unlike Gaussian copula.
    """
    rng = np.random.default_rng(seed)
    n   = rho_matrix.shape[0]
    L   = np.linalg.cholesky(rho_matrix)

    # Draw correlated multivariate normal
    Z = rng.standard_normal((n_samples, n)) @ L.T   # (n_samples, n)

    # Draw chi-squared scaling factor (same for all components)
    W = rng.chisquare(df=df, size=(n_samples, 1)) / df  # (n_samples, 1)

    # Multivariate t samples
    T = Z / np.sqrt(W)   # (n_samples, n)

    # Map to uniform via t CDF — t_copula uniform marginals
    U = stats.t.cdf(T, df=df)   # (n_samples, n) in (0,1)
    return U

# Tail dependence coefficient for t-copula (upper or lower are equal)
def t_tail_dependence(rho: float, df: float) -> float:
    """Lambda_U = 2 * t_{df+1}(-sqrt((df+1)*(1-rho)/(1+rho)))"""
    x = -np.sqrt((df + 1) * (1 - rho) / (1 + rho))
    return 2 * stats.t.cdf(x, df=df + 1)

# Example
rho = np.array([[1.0, 0.7], [0.7, 1.0]])
U   = t_copula_samples(rho, df=4, n_samples=10_000)
lam = t_tail_dependence(0.7, df=4)
print(f"Tail dependence (df=4, rho=0.7): {lam:.4f}")
# ~0.29 vs 0 for Gaussian copula — far more stress-scenario co-movement`,
    explanation: "The t-copula has non-zero tail dependence (lambda_U > 0), meaning extreme losses are more likely to occur simultaneously than the Gaussian copula implies; this matters enormously for CDO tranching, credit-default swap pricing, and stressed VaR calculations where co-crashes dominate the tail loss distribution.",
  },
  {
    id: "pyfin-20260628-b1-regime-switching-hmm",
    language: "python",
    title: "Regime-Switching Returns Model via Hidden Markov Model",
    tag: "time-series",
    code: `import numpy as np
from hmmlearn import hmm

# Fit a 2-state Gaussian HMM to daily returns
# State 0 = low-vol bull, State 1 = high-vol bear (or vice versa)

np.random.seed(42)
# Simulate ground-truth: 300 days bull, 100 days bear
bull = np.random.normal(0.05/252, 0.12/np.sqrt(252), 300)
bear = np.random.normal(-0.10/252, 0.30/np.sqrt(252), 100)
returns = np.concatenate([bull, bear]).reshape(-1, 1)

# Fit 2-state Gaussian HMM
model = hmm.GaussianHMM(n_components=2,
                         covariance_type="diag",
                         n_iter=100,
                         random_state=42)
model.fit(returns)

# Decode most likely state sequence (Viterbi)
states = model.predict(returns)

# Identify which state is bull/bear by mean return
means = model.means_.flatten()
bull_state = int(np.argmax(means))
bear_state = 1 - bull_state

print("Transition matrix:")
print(model.transmat_.round(4))
print(f"Bull state (#{bull_state}): mean={means[bull_state]:.6f}, "
      f"vol={np.sqrt(model.covars_[bull_state].flatten()[0]):.6f}")
print(f"Bear state (#{bear_state}): mean={means[bear_state]:.6f}, "
      f"vol={np.sqrt(model.covars_[bear_state].flatten()[0]):.6f}")

# Smoothed regime probabilities (forward-backward algorithm)
log_prob, posteriors = model.score_samples(returns)
# posteriors[t, k] = P(state=k | all observations)`,
    explanation: "The Viterbi algorithm decodes the most probable state path in O(T × K²) and gives a hard assignment, while the forward-backward algorithm gives soft posterior probabilities P(state_t | all data) — the posteriors are more useful for risk management because they quantify regime uncertainty rather than committing to a binary label.",
  },
  {
    id: "pyfin-20260628-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading (Dynamic Hedge Ratio)",
    tag: "stat-arb",
    code: `import numpy as np
from typing import Tuple

class KalmanPairsFilter:
    """
    Estimates a time-varying hedge ratio beta such that
    y_t = beta_t * x_t + alpha_t + noise,
    where (alpha_t, beta_t) follow a random walk.
    """
    def __init__(self, delta: float = 1e-4, noise_var: float = 1e-3):
        # State: [alpha, beta]
        self.x     = np.zeros(2)          # state estimate
        self.P     = np.eye(2) * 1.0      # state covariance
        self.Q     = np.eye(2) * delta    # process noise (transition uncertainty)
        self.R     = noise_var            # observation noise variance
        self.F     = np.eye(2)            # state transition (random walk)

    def update(self, y: float, x_obs: float) -> Tuple[float, float, float]:
        """
        Returns (alpha, beta, spread) after incorporating new observation (y, x_obs).
        spread = y - beta*x_obs - alpha (the trading signal).
        """
        H = np.array([[1.0, x_obs]])     # observation matrix: y = H @ state + noise

        # Predict step
        self.P = self.F @ self.P @ self.F.T + self.Q

        # Innovation (residual)
        y_hat = H @ self.x               # predicted observation
        S     = H @ self.P @ H.T + self.R   # innovation variance
        K     = self.P @ H.T / S            # Kalman gain (2,)

        # Update step
        self.x = self.x + K.flatten() * (y - y_hat)
        self.P = (np.eye(2) - np.outer(K.flatten(), H)) @ self.P

        alpha, beta = self.x
        spread = y - beta * x_obs - alpha
        return alpha, beta, spread

# Example: GLD and GDX pairs trade
np.random.seed(1)
n  = 200
x  = np.cumsum(np.random.normal(0, 1, n)) + 100   # simulated GDX
y  = 1.5 * x + 5.0 + np.random.normal(0, 2, n)    # simulated GLD

kf = KalmanPairsFilter(delta=1e-5, noise_var=2.0)
spreads = []
for yi, xi in zip(y, x):
    _, beta, spread = kf.update(yi, xi)
    spreads.append(spread)

spreads = np.array(spreads)
z_scores = (spreads - spreads.mean()) / spreads.std()
print(f"Z-score range: [{z_scores.min():.2f}, {z_scores.max():.2f}]")`,
    explanation: "The Kalman filter estimates the hedge ratio dynamically instead of using a fixed OLS coefficient; as the true ratio drifts due to regime changes, the Kalman estimate follows it with a lag controlled by delta (process noise) — small delta = slow adaptation = fewer false signals, large delta = fast adaptation = more noise.",
  },
  {
    id: "pyfin-20260628-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Term Structure Fitting",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(maturities: np.ndarray,
                  beta0: float, beta1: float,
                  beta2: float, lambda_: float) -> np.ndarray:
    """
    Nelson-Siegel yield curve: y(t) = b0 + b1*(1-exp(-t/L))/(t/L)
                                       + b2*((1-exp(-t/L))/(t/L) - exp(-t/L))
    beta0: long-run level (asymptote), beta1: slope (short vs long),
    beta2: hump, lambda: decay factor controlling hump location.
    """
    x = maturities / lambda_
    factor1 = (1 - np.exp(-x)) / x           # loading on beta1
    factor2 = factor1 - np.exp(-x)            # loading on beta2
    return beta0 + beta1 * factor1 + beta2 * factor2

def fit_nelson_siegel(maturities: np.ndarray,
                      market_yields: np.ndarray) -> dict:
    def loss(params):
        b0, b1, b2, lam = params
        if lam <= 0 or b0 <= 0: return 1e9
        fitted = nelson_siegel(maturities, b0, b1, b2, lam)
        return np.sum((fitted - market_yields) ** 2)

    # Initial guess: flat curve at long-end yield
    x0 = [market_yields[-1], -0.01, 0.01, 2.0]
    res = minimize(loss, x0, method='Nelder-Mead',
                   options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 5000})
    b0, b1, b2, lam = res.x
    return {'beta0': b0, 'beta1': b1, 'beta2': b2, 'lambda': lam,
            'fitted': nelson_siegel(maturities, b0, b1, b2, lam)}

# USD Treasury example (approximate 2023 inverted curve)
maturities    = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
market_yields = np.array([5.30, 5.40, 5.35, 4.90, 4.65, 4.35, 4.30, 4.25, 4.45, 4.35]) / 100

result = fit_nelson_siegel(maturities, market_yields)
print(f"beta0={result['beta0']:.4f}, beta1={result['beta1']:.4f}, "
      f"beta2={result['beta2']:.4f}, lambda={result['lambda']:.4f}")`,
    explanation: "Nelson-Siegel decomposes the yield curve into three factors with economic interpretation: beta0 is the long-run level (10yr+ yield), beta1 is the slope (long minus short rate, ~ -1 times the inversion), and beta2 governs the medium-maturity hump; lambda controls where the hump peaks, typically 2-3 years for USD Treasuries.",
  },
  {
    id: "pyfin-20260628-b1-svensson",
    language: "python",
    title: "Svensson Extension of Nelson-Siegel",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import differential_evolution

def svensson(maturities: np.ndarray,
             b0: float, b1: float, b2: float, b3: float,
             lam1: float, lam2: float) -> np.ndarray:
    """Svensson (1994): adds a second hump term to Nelson-Siegel."""
    x1 = maturities / lam1
    x2 = maturities / lam2
    f1 = (1 - np.exp(-x1)) / x1
    f2 = (1 - np.exp(-x2)) / x2
    return (b0
            + b1 * f1
            + b2 * (f1 - np.exp(-x1))
            + b3 * (f2 - np.exp(-x2)))

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> np.ndarray:
    """
    Use differential evolution (global optimiser) to avoid local minima
    from the additional lambda2 parameter.
    """
    def loss(p):
        b0, b1, b2, b3, l1, l2 = p
        if b0 <= 0 or l1 <= 0 or l2 <= 0: return 1e9
        return np.sum((svensson(maturities, b0, b1, b2, b3, l1, l2) - yields) ** 2)

    bounds = [(0.01, 0.15), (-0.10, 0.10), (-0.10, 0.10),
              (-0.10, 0.10), (0.1, 10.0), (0.1, 10.0)]
    res = differential_evolution(loss, bounds, seed=42,
                                  maxiter=2000, tol=1e-10)
    return res.x

# ECB publishes Svensson parameters daily for the Euro Area AAA curve
mats = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
ylds = np.array([3.5, 3.6, 3.7, 3.5, 3.4, 3.2, 3.1, 3.0, 2.9, 2.85, 2.80]) / 100
params = fit_svensson(mats, ylds)
b0,b1,b2,b3,l1,l2 = params
print(f"b0={b0:.4f} b1={b1:.4f} b2={b2:.4f} b3={b3:.4f} l1={l1:.3f} l2={l2:.3f}")`,
    explanation: "Svensson adds a fourth factor (b3, lambda2) that captures a second hump common in curves with unusual shapes at mid-maturities — European government bond curves often show this — but the additional lambda makes the optimisation surface highly non-convex, requiring a global method like differential evolution rather than local gradient descent.",
  },
  {
    id: "pyfin-20260628-b1-evt-tail-risk",
    language: "python",
    title: "Extreme Value Theory (GPD) for Tail Risk Estimation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses: np.ndarray, threshold_quantile: float = 0.95):
    """
    Peaks-over-threshold (POT) method with Generalised Pareto Distribution.
    losses: array of portfolio losses (positive = loss).
    Returns: (xi, sigma, VaR_99, ES_99)
    xi > 0: heavy tail (Frechet), xi = 0: exponential, xi < 0: bounded tail.
    """
    u = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u   # excess over threshold

    # Fit GPD to exceedances
    # GPD CDF: F(y) = 1 - (1 + xi*y/sigma)^(-1/xi) for xi != 0
    xi, loc, sigma = genpareto.fit(exceedances, floc=0)

    n  = len(losses)
    nu = len(exceedances)   # number of exceedances

    # VaR at confidence level p (e.g. 0.99)
    def var_gpd(p: float) -> float:
        return u + (sigma / xi) * ((n / nu * (1 - p)) ** (-xi) - 1)

    # Expected Shortfall (CVaR) at level p
    def es_gpd(p: float) -> float:
        v = var_gpd(p)
        return (v + sigma - xi * u) / (1 - xi)   # analytical ES for GPD

    var_99 = var_gpd(0.99)
    es_99  = es_gpd(0.99)
    return {'xi': xi, 'sigma': sigma, 'threshold': u,
            'VaR_99': var_99, 'ES_99': es_99, 'n_exceedances': nu}

np.random.seed(42)
# Simulate fat-tailed P&L (student-t with df=3)
from scipy.stats import t as student_t
losses = -student_t.rvs(df=3, size=2000)   # positive = loss
losses = losses[losses > 0]

result = fit_gpd_tail(losses, threshold_quantile=0.90)
print(f"xi (tail index): {result['xi']:.4f}")
print(f"99% VaR: {result['VaR_99']:.4f}")
print(f"99% ES:  {result['ES_99']:.4f}")`,
    explanation: "EVT's peaks-over-threshold approach models only the tail of the distribution rather than parametrising the entire P&L distribution, making it robust to misspecification in the body; a positive xi indicates a Pareto tail (infinite variance if xi >= 0.5), and the GPD closed-form for Expected Shortfall is exact — unlike historical simulation which requires an enormous sample to estimate the tail accurately.",
  },
  {
    id: "pyfin-20260628-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly for Position Sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction_discrete(p_win: float, b_win: float, b_loss: float = 1.0) -> float:
    """
    Kelly fraction for a binary bet:
    f* = (p*b - (1-p)) / b  where b = odds (b_win per unit risked, lose b_loss).
    """
    p = p_win
    q = 1 - p
    return (p * b_win - q * b_loss) / (b_win * b_loss)

def kelly_continuous(mu: float, sigma: float, rf: float = 0.0) -> float:
    """
    Continuous-time Kelly fraction: f* = (mu - rf) / sigma^2
    (Assumes log-normal returns, maximises expected log wealth.)
    """
    return (mu - rf) / (sigma ** 2)

def optimal_kelly_multivariate(mu: np.ndarray,
                                Sigma: np.ndarray,
                                rf: float = 0.0) -> np.ndarray:
    """
    Multivariate Kelly (log-optimal portfolio): f* = Sigma^{-1} @ (mu - rf)
    Equivalent to maximum Sharpe ratio scaled by reciprocal of variance.
    """
    return np.linalg.solve(Sigma, mu - rf)

def simulate_growth(f: float, mu: float, sigma: float,
                    n_periods: int = 252, n_sims: int = 10_000) -> np.ndarray:
    """Simulate terminal wealth under fraction f of Kelly."""
    rng  = np.random.default_rng(0)
    logs = rng.normal((mu - 0.5 * sigma**2) * f - 0.5 * (f*sigma)**2,
                       f * sigma, (n_sims, n_periods))
    return np.exp(logs.sum(axis=1))

mu, sigma = 0.15, 0.20   # 15% annual return, 20% vol
f_kelly = kelly_continuous(mu, sigma)
print(f"Full Kelly: {f_kelly:.2%}")                 # 375% — highly leveraged
print(f"Half Kelly: {f_kelly/2:.2%}")               # 187% — typical practical fraction

# Growth rate G(f) = mu*f - 0.5*sigma^2*f^2  (maximised at f=Kelly)
f_range = np.linspace(0, 2 * f_kelly, 100)
G = mu * f_range - 0.5 * sigma**2 * f_range**2
print(f"Max growth rate: {G.max():.4f} at f={f_range[G.argmax()]:.2f}")`,
    explanation: "Full Kelly maximises the long-run geometric growth rate (log wealth) but produces severe drawdowns (up to 50% commonly); fractional Kelly (typically 1/4 to 1/2 Kelly) reduces drawdown approximately quadratically while reducing long-run growth only linearly — a key insight that explains why practical quant strategies are always under-leveraged relative to theoretical optimum.",
  },
  {
    id: "pyfin-20260628-b1-hull-white",
    language: "python",
    title: "Hull-White Short Rate Model (Monte Carlo)",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.interpolate import interp1d

def hull_white_mc(a: float, sigma: float,
                  initial_rates: np.ndarray, maturities: np.ndarray,
                  T: float, n_steps: int, n_paths: int,
                  seed: int = 42) -> np.ndarray:
    """
    Hull-White: dr = (theta(t) - a*r) dt + sigma * dW
    theta(t) calibrated to fit the initial yield curve exactly.
    Returns simulated short rates (n_paths, n_steps+1).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    t   = np.linspace(0, T, n_steps + 1)

    # Build instantaneous forward rate from yield curve (numerical derivative)
    yield_interp = interp1d(maturities, initial_rates,
                             kind='linear', fill_value='extrapolate')

    def f_mkt(t_val: float) -> float:
        """Instantaneous forward rate from market yields."""
        h = 1e-5
        tm, tp = max(t_val - h, 1e-8), t_val + h
        return ((yield_interp(tp) * tp - yield_interp(tm) * tm) / (tp - tm))

    def theta(t_val: float) -> float:
        """Hull-White drift term calibrated to initial curve."""
        df = (f_mkt(t_val + 1e-5) - f_mkt(t_val - 1e-5)) / (2e-5)
        return df + a * f_mkt(t_val) + sigma**2 / (2*a) * (1 - np.exp(-2*a*t_val))

    # Simulate
    r = np.zeros((n_paths, n_steps + 1))
    r[:, 0] = yield_interp(1e-6)   # initial short rate (approx overnight rate)

    dW = rng.standard_normal((n_paths, n_steps)) * np.sqrt(dt)
    for i in range(n_steps):
        r[:, i+1] = (r[:, i]
                     + (theta(t[i]) - a * r[:, i]) * dt
                     + sigma * dW[:, i])
    return r

# Example calibration
mats  = np.array([0.25, 0.5, 1.0, 2.0, 5.0, 10.0])
rates = np.array([5.0, 5.1, 5.2, 5.0, 4.8, 4.6]) / 100

paths = hull_white_mc(a=0.10, sigma=0.01, initial_rates=rates,
                       maturities=mats, T=1.0, n_steps=252, n_paths=1000)
print(f"Mean short rate at T=1: {paths[:,-1].mean()*100:.3f}%")`,
    explanation: "Hull-White is the only affine short-rate model that fits any initial yield curve exactly via the theta(t) function; a controls mean reversion speed (typical value 0.05-0.30) and sigma is the vol of the short rate — together they determine the term structure of vol and the shape of cap/floor smile the model can reproduce.",
  },
  {
    id: "pyfin-20260628-b1-cds-hazard-rate",
    language: "python",
    title: "CDS Hazard Rate Calibration (Bootstrapping)",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def survival_prob(h: float, t: float) -> float:
    """Constant hazard rate h: P(tau > t) = exp(-h*t)."""
    return np.exp(-h * t)

def cds_par_spread(hazard_rates: np.ndarray, tenors: np.ndarray,
                   R: float = 0.40, r: float = 0.05) -> np.ndarray:
    """
    Compute CDS par spreads from a piecewise-constant hazard rate curve.
    tenors: maturities of the CDS (e.g. [1,2,3,5,7,10] years).
    R: recovery rate, r: risk-free rate (flat).
    Returns par spread in bps for each tenor.
    """
    spreads = []
    for T in tenors:
        # Semi-annual coupon payment schedule
        payment_times = np.arange(0.5, T + 0.01, 0.5)

        # Interpolate hazard rate for each time (piecewise constant bootstrap)
        h_interp = np.interp(payment_times, tenors[:len(hazard_rates)], hazard_rates)

        # Survival probability at each payment time
        SP  = np.exp(-h_interp.cumsum() * 0.5)   # cumulative hazard * 0.5yr step
        DF  = np.exp(-r * payment_times)

        # Protection leg PV (default leg)
        dt      = np.diff(np.concatenate([[0], payment_times]))
        Q_prev  = np.concatenate([[1.0], SP[:-1]])
        prot    = np.sum((Q_prev - SP) * DF * (1 - R))

        # Premium leg PV
        prem    = np.sum(SP * DF * 0.5)           # * spread/notional

        par_spread = prot / prem * 10_000          # in bps
        spreads.append(par_spread)
    return np.array(spreads)

# Bootstrap: find hazard rate at each tenor that matches market CDS spread
tenors       = np.array([1.0, 2.0, 3.0, 5.0, 7.0, 10.0])
market_bps   = np.array([80, 100, 115, 130, 140, 150])   # market CDS spreads in bps
hazard_rates = np.zeros(len(tenors))

for i, (T, target_bps) in enumerate(zip(tenors, market_bps)):
    def objective(h):
        hr_bootstrap = hazard_rates[:i].tolist() + [h]
        hr_array     = np.array(hr_bootstrap)
        t_bootstrap  = tenors[:i+1]
        h_interp     = np.interp([T], t_bootstrap, hr_array)[0]
        return h_interp * 10_000 / (1 - 0.40) - target_bps  # approx check
    # Use brentq for exact root
    hazard_rates[i] = brentq(lambda h: cds_par_spread(
        np.array(hazard_rates[:i].tolist() + [h]), tenors, R=0.40)[i] - target_bps,
        1e-6, 0.50)

print("Bootstrapped hazard rates:")
for t, h in zip(tenors, hazard_rates):
    print(f"  T={t:.0f}y: h={h*100:.3f}%,  P(survival)={np.exp(-h*t):.4f}")`,
    explanation: "Bootstrapping the hazard rate curve from CDS par spreads mirrors the bootstrapping of discount factors from swap rates; the key insight is that the par spread equals the ratio of the protection leg PV to the risky annuity (premium leg), and solving for h at each tenor sequentially in increasing maturity order gives a unique piecewise-constant hazard rate curve consistent with all observed market spreads.",
  },
  {
    id: "pyfin-20260628-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Model (OLS Regression + Alphas)",
    tag: "factor-model",
    code: `import numpy as np
import pandas as pd
from statsmodels.api import OLS, add_constant

def fama_french_3f(returns: pd.Series,
                   mkt_rf: pd.Series,
                   smb: pd.Series,
                   hml: pd.Series,
                   rf: pd.Series) -> dict:
    """
    Regress excess portfolio return on FF3 factors.
    returns, mkt_rf, smb, hml, rf: pd.Series indexed by date.
    Returns alpha (annualised), betas, t-stats, R^2.
    """
    excess = returns - rf   # excess return over risk-free

    X = add_constant(pd.DataFrame({
        'MKT-RF': mkt_rf,
        'SMB':    smb,
        'HML':    hml,
    }))
    model = OLS(excess, X, missing='drop').fit(cov_type='HC3')   # heterosked-robust

    alpha_monthly  = model.params['const']
    alpha_annual   = (1 + alpha_monthly) ** 12 - 1

    return {
        'alpha_monthly':  alpha_monthly,
        'alpha_annual':   alpha_annual,
        'alpha_tstat':    model.tvalues['const'],
        'beta_mkt':       model.params['MKT-RF'],
        'beta_smb':       model.params['SMB'],
        'beta_hml':       model.params['HML'],
        'r_squared':      model.rsquared_adj,
        'model':          model,
    }

# Simulate a value-tilted portfolio
np.random.seed(0)
n = 120   # 10 years monthly
mkt_rf = pd.Series(np.random.normal(0.007, 0.045, n))   # ~8.4% annual excess
smb    = pd.Series(np.random.normal(0.002, 0.030, n))   # size factor
hml    = pd.Series(np.random.normal(0.003, 0.025, n))   # value factor
rf     = pd.Series(np.ones(n) * 0.0004)                 # ~5% annual

# Portfolio: market + value tilt + alpha
port   = pd.Series(rf.values + 1.05 * mkt_rf.values
                   + 0.30 * hml.values
                   + 0.15 * smb.values
                   + np.random.normal(0.001, 0.015, n))

result = fama_french_3f(port, mkt_rf, smb, hml, rf)
print(f"Annual alpha: {result['alpha_annual']*100:.2f}% (t={result['alpha_tstat']:.2f})")
print(f"Beta MKT: {result['beta_mkt']:.2f}, SMB: {result['beta_smb']:.2f}, HML: {result['beta_hml']:.2f}")`,
    explanation: "The Fama-French alpha (the constant) is the return unexplained by size (SMB), value (HML), and market risk — it measures genuine stock-picking skill net of known risk premia; using HC3 heteroskedasticity-robust standard errors is important because monthly factor returns exhibit time-varying volatility that inflates the standard OLS t-statistics.",
  },
  {
    id: "pyfin-20260628-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "monte-carlo",
    code: `import numpy as np
from scipy import stats

def importance_sampling_call(S0: float, K: float, r: float,
                              sigma: float, T: float,
                              n_paths: int = 100_000, seed: int = 0) -> dict:
    """
    Price a deep OTM call via importance sampling.
    Shifts the sampling distribution to focus on paths where S_T > K.
    The optimal shift mu* = log(K/S0)/sigma - sigma*T/2 (centred on log(K/S0)).
    """
    rng    = np.random.default_rng(seed)
    disc   = np.exp(-r * T)
    lnS_K  = np.log(K / S0)           # log moneyness

    # Naive MC for comparison
    Z_naive = rng.standard_normal(n_paths)
    S_naive = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_naive)
    price_naive = disc * np.maximum(S_naive - K, 0).mean()
    se_naive    = disc * np.maximum(S_naive - K, 0).std() / np.sqrt(n_paths)

    # Importance sampling: shift mean to lnS_K / (sigma*sqrt(T))
    mu_star = (lnS_K - (r - 0.5*sigma**2)*T) / (sigma * np.sqrt(T))
    Z_is    = rng.standard_normal(n_paths) + mu_star   # shifted

    S_is    = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_is)
    payoffs = np.maximum(S_is - K, 0)

    # Likelihood ratio (Radon-Nikodym derivative): undo the shift
    lr = np.exp(-mu_star * Z_is + 0.5 * mu_star**2)
    weighted = disc * payoffs * lr

    price_is = weighted.mean()
    se_is    = weighted.std() / np.sqrt(n_paths)

    return {
        'price_naive':  price_naive,
        'se_naive':     se_naive,
        'price_is':     price_is,
        'se_is':        se_is,
        'variance_reduction': (se_naive / se_is) ** 2,
    }

# Deep OTM: S0=100, K=150, T=1, sigma=20%
result = importance_sampling_call(100, 150, 0.05, 0.20, 1.0)
print(f"Naive:  {result['price_naive']:.6f} (SE={result['se_naive']:.6f})")
print(f"IS:     {result['price_is']:.6f}   (SE={result['se_is']:.6f})")
print(f"Variance reduction: {result['variance_reduction']:.1f}x")`,
    explanation: "For deep out-of-the-money options, naive Monte Carlo wastes 99%+ of paths on zero payoffs; importance sampling shifts the Brownian motion to generate paths that cross the strike more often, then corrects for the distribution change via the likelihood ratio — achieving the same accuracy with 10-100× fewer paths for options more than 3 standard deviations OTM.",
  },
  {
    id: "pyfin-20260628-b1-control-variates",
    language: "python",
    title: "Control Variates MC: Geometric Average as CV for Arithmetic Asian",
    tag: "monte-carlo",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_analytical(S0, K, r, sigma, T, n):
    """Exact price of geometric average Asian call (closed-form)."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    mu_g    = (r - 0.5*sigma**2) * T * (n+1)/(2*n) + 0.5*sigma_g**2 * T
    d1 = (np.log(S0/K) + mu_g + 0.5*sigma_g**2*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g * np.sqrt(T)
    return np.exp(-r*T) * (S0 * np.exp(mu_g) * norm.cdf(d1) - K * norm.cdf(d2))

def asian_cv_mc(S0, K, r, sigma, T, n_steps, n_paths, seed=0):
    """
    Price arithmetic average Asian call using geometric average as control variate.
    CV formula: E[arith] ≈ mean(arith) - b*(mean(geom_mc) - E[geom_analytical])
    b = Cov(arith, geom) / Var(geom), estimated from pilot.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)

    Z    = rng.standard_normal((n_paths, n_steps))
    incr = np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z)
    S    = S0 * np.cumprod(incr, axis=1)   # (n_paths, n_steps)

    arith_avg = S.mean(axis=1)
    geom_avg  = np.exp(np.log(S).mean(axis=1))

    arith_payoff = disc * np.maximum(arith_avg - K, 0)
    geom_payoff  = disc * np.maximum(geom_avg  - K, 0)

    # Optimal CV coefficient (minimises variance)
    b = np.cov(arith_payoff, geom_payoff)[0, 1] / np.var(geom_payoff)

    geo_analytical = geometric_asian_analytical(S0, K, r, sigma, T, n_steps)
    cv_payoff = arith_payoff - b * (geom_payoff - geo_analytical)

    return {
        'price':     cv_payoff.mean(),
        'se':        cv_payoff.std() / np.sqrt(n_paths),
        'price_raw': arith_payoff.mean(),
        'se_raw':    arith_payoff.std() / np.sqrt(n_paths),
        'beta':      b,
    }

r = asian_cv_mc(100, 100, 0.05, 0.20, 1.0, n_steps=52, n_paths=10_000)
print(f"Control variate price: {r['price']:.4f} (SE={r['se']:.5f})")
print(f"Naive MC price:        {r['price_raw']:.4f} (SE={r['se_raw']:.5f})")
reduction = (r['se_raw'] / r['se'])**2
print(f"Variance reduction: {reduction:.1f}x")`,
    explanation: "The control variate technique exploits the fact that geometric and arithmetic Asian options are highly correlated (same paths, different average); because the geometric price has an analytical formula, the residual error in the control-variate estimator is only the unexplained component of the arithmetic–geometric difference, typically achieving 20-50× variance reduction over naive MC.",
  },
  {
    id: "pyfin-20260628-b1-local-vol-dupire",
    language: "python",
    title: "Dupire Local Volatility Surface from Implied Vols",
    tag: "vol surface",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.stats import norm

def dupire_local_vol(K_grid: np.ndarray,
                     T_grid: np.ndarray,
                     C_surface: np.ndarray,
                     r: float = 0.0,
                     q: float = 0.0) -> np.ndarray:
    """
    Dupire (1994) formula: sigma_loc^2(K,T) =
        (dC/dT + (r-q)*K*dC/dK + q*C) / (0.5 * K^2 * d^2C/dK^2)
    C_surface: call prices on K_grid (rows) x T_grid (cols) grid.
    All inputs are fine-grid (interpolated implied vols -> prices upstream).
    Returns local vol surface (n_K, n_T).
    """
    # Smooth using bivariate spline to enable clean differentiation
    spl = RectBivariateSpline(K_grid, T_grid, C_surface, kx=4, ky=4)

    nK, nT = len(K_grid), len(T_grid)
    local_vol = np.zeros((nK, nT))

    for j, T in enumerate(T_grid):
        for i, K in enumerate(K_grid):
            C    = spl(K, T)[0, 0]
            dCdT = spl(K, T, dy=1)[0, 0]
            dCdK = spl(K, T, dx=1)[0, 0]
            d2CdK2 = spl(K, T, dx=2)[0, 0]

            num = dCdT + (r - q) * K * dCdK + q * C
            den = 0.5 * K**2 * d2CdK2

            if den > 1e-10 and num > 0:
                local_vol[i, j] = np.sqrt(num / den)
            else:
                local_vol[i, j] = np.nan   # arbitrage region

    return local_vol

# Construct a simple implied vol surface (flat vol + skew)
K_grid = np.linspace(80, 120, 25)
T_grid = np.array([0.25, 0.5, 1.0, 1.5, 2.0])
S0, r = 100.0, 0.05

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K)+(r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

# Simple skew: higher vol for lower strikes
C_surface = np.array([
    [bs_call(S0, K, r, 0.20 + 0.001*(100-K), T) for T in T_grid]
    for K in K_grid
])

lv = dupire_local_vol(K_grid, T_grid, C_surface, r=r)
print(f"Local vol ATM 1yr: {lv[len(K_grid)//2, 2]:.4f}")`,
    explanation: "Dupire's formula recovers the unique local vol surface that exactly reprices all European option prices simultaneously; however, the second derivative d²C/dK² is extremely sensitive to noise in the input surface, making robust interpolation (spline or SVI) and careful regularisation essential before applying the formula — directly differencing market quotes produces unreliable local vols.",
  },
  {
    id: "pyfin-20260628-b1-heston-char-fn",
    language: "python",
    title: "Heston Model Price via Characteristic Function (Carr-Madan FFT)",
    tag: "vol surface",
    code: `import numpy as np
from scipy.integrate import quad

def heston_char_fn(phi: complex, S0: float, K: float, T: float,
                   r: float, kappa: float, theta: float,
                   xi: float, rho: float, v0: float) -> complex:
    """
    Heston (1993) characteristic function E[exp(i*phi*log(S_T))].
    kappa: mean-reversion speed, theta: long-run variance,
    xi: vol-of-vol, rho: spot-vol correlation, v0: initial variance.
    """
    i  = 1j
    lnS = np.log(S0)

    d = np.sqrt((rho * xi * phi * i - kappa)**2 + xi**2 * (phi * i + phi**2))
    g = (kappa - rho * xi * phi * i - d) / (kappa - rho * xi * phi * i + d)

    exp_dT = np.exp(-d * T)
    C = (r * phi * i * T
         + kappa * theta / xi**2
           * ((kappa - rho*xi*phi*i - d)*T - 2*np.log((1 - g*exp_dT)/(1 - g))))
    D = ((kappa - rho*xi*phi*i - d)/xi**2
         * (1 - exp_dT) / (1 - g*exp_dT))

    return np.exp(C + D * v0 + i * phi * lnS)

def heston_call(S0, K, T, r, kappa, theta, xi, rho, v0) -> float:
    """Carr-Madan (1999) formula: integrate re-parameterised characteristic function."""
    def integrand(phi):
        cf = heston_char_fn(phi - 0.5j, S0, K, T, r, kappa, theta, xi, rho, v0)
        return np.real(np.exp(-1j * phi * np.log(K)) * cf) / (phi**2 + 0.25)

    integral, _ = quad(integrand, 0, 500, limit=200, epsabs=1e-8)
    return np.exp(-r*T) / np.pi * integral

# Example
price = heston_call(S0=100, K=100, T=1.0, r=0.03,
                    kappa=2.0, theta=0.04, xi=0.5, rho=-0.7, v0=0.04)
print(f"Heston ATM call: {price:.4f}")`,
    explanation: "The Heston model's stochastic vol (mean-reverting CIR process) generates an implied vol smile that fits equity options better than Black-Scholes; the Carr-Madan trick re-parametrises the characteristic function to make the integrand square-integrable, enabling FFT-based simultaneous pricing of all strikes on a grid in O(N log N) time for calibration.",
  },
  {
    id: "pyfin-20260628-b1-cvxpy-cvar",
    language: "python",
    title: "CVaR Portfolio Optimisation with cvxpy",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def cvar_optimise(returns: np.ndarray,
                  alpha: float = 0.95,
                  target_return: float | None = None,
                  max_weight: float = 0.40) -> dict:
    """
    Minimise CVaR (Expected Shortfall) at confidence alpha subject to:
      - weights sum to 1, non-negative (long-only)
      - optional minimum expected return constraint
      - per-asset weight cap
    Rockafellar-Uryasev (2000) linear programming formulation.
    """
    T, n = returns.shape
    mu   = returns.mean(axis=0)

    w = cp.Variable(n, nonneg=True)   # portfolio weights
    z = cp.Variable(T, nonneg=True)   # auxiliary for CVaR
    v = cp.Variable()                  # VaR threshold (scalar)

    portfolio_returns = returns @ w    # (T,)

    # CVaR = v + 1/((1-alpha)*T) * sum(max(-r_t - v, 0))
    # Linearised: z_t >= -r_t - v, z_t >= 0
    cvar = v + (1.0 / ((1 - alpha) * T)) * cp.sum(z)

    constraints = [
        cp.sum(w) == 1,
        w <= max_weight,
        z >= -portfolio_returns - v,
    ]
    if target_return is not None:
        constraints.append(mu @ w >= target_return)

    prob = cp.Problem(cp.Minimize(cvar), constraints)
    prob.solve(solver=cp.CLARABEL)

    return {
        'weights': w.value,
        'cvar':    cvar.value,
        'var':     v.value,
        'expected_return': float(mu @ w.value),
    }

# Example: 5 assets, 500 historical scenarios
np.random.seed(42)
mu_true  = np.array([0.08, 0.10, 0.06, 0.12, 0.09]) / 252
cov_true = np.diag([0.20, 0.25, 0.15, 0.30, 0.22])**2 / 252
returns  = np.random.multivariate_normal(mu_true, cov_true, 500)

result = cvar_optimise(returns, alpha=0.95, target_return=0.0003)
print("Optimal weights:", result['weights'].round(3))
print(f"CVaR (95%): {result['cvar']*100:.3f}% daily")`,
    explanation: "The Rockafellar-Uryasev CVaR formulation converts the non-smooth optimisation of Expected Shortfall into a linear program with auxiliary variables z_t (scenario losses above VaR); this is far more stable numerically than the historical simulation approach and produces portfolios robust to tail risk rather than just variance — CVaR minimisation naturally diversifies across correlated tail scenarios.",
  },
  {
    id: "pyfin-20260628-b1-market-impact",
    language: "python",
    title: "Almgren-Chriss Optimal Execution with Market Impact",
    tag: "execution",
    code: `import numpy as np
from scipy.linalg import solve_banded

def almgren_chriss(X0: float, T: float, N: int,
                   sigma: float, eta: float,
                   gamma: float, lam: float) -> np.ndarray:
    """
    Almgren-Chriss (2000) optimal liquidation trajectory.
    X0: initial position (shares), T: time horizon, N: number of periods.
    sigma: daily vol, eta: temporary impact (linear), gamma: permanent impact,
    lam: risk-aversion (lambda > 0 penalises variance).
    Returns array of shares remaining at each time step [X_0,...,X_N].
    """
    dt   = T / N
    tau  = dt
    kappa_sq = lam * sigma**2 / eta   # characteristic decay rate squared
    kappa    = np.sqrt(kappa_sq)

    # Closed-form solution for X(t): hyperbolic sine profile
    t_vals = np.linspace(0, T, N + 1)

    # X*(t) = X0 * sinh(kappa*(T-t)) / sinh(kappa*T)
    denom = np.sinh(kappa * T)
    if denom < 1e-10:
        # Low risk-aversion limit: linear (TWAP) schedule
        return X0 * np.linspace(1, 0, N + 1)

    trajectory = X0 * np.sinh(kappa * (T - t_vals)) / denom

    # Trade sizes (shares sold each period)
    trade_sizes = -np.diff(trajectory)   # positive = selling

    # Total expected cost
    temp_impact = eta * np.sum(trade_sizes**2 / dt)
    perm_impact = gamma * np.sum(trade_sizes) * X0 / 2  # symmetric impact

    print(f"Expected temporary impact cost: {temp_impact:.2f}")
    print(f"Kappa (urgency): {kappa:.4f}")

    return trajectory

# Liquidate 1M shares over 5 days (20 intraday steps), moderate risk aversion
traj = almgren_chriss(X0=1e6, T=5.0, N=20,
                       sigma=0.02, eta=1e-7, gamma=5e-8, lam=1e-5)
print(f"Remaining at midpoint: {traj[10]/1e6:.3f}M shares")`,
    explanation: "Almgren-Chriss balances execution risk (variance from delayed selling into a volatile market) against market impact (cost of selling too fast); high lambda (risk aversion) front-loads the trajectory toward VWAP, while lambda near zero gives TWAP — the closed-form hyperbolic solution is exact, making it the standard benchmark for evaluating execution algorithms in quant interviews.",
  },
  {
    id: "pyfin-20260628-b1-garch",
    language: "python",
    title: "GARCH(1,1) Estimation and Volatility Forecasting",
    tag: "time-series",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_loglik(params: np.ndarray, returns: np.ndarray) -> float:
    """Negative log-likelihood for GARCH(1,1) with Gaussian innovations."""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e9

    T     = len(returns)
    sigma2 = np.zeros(T)
    sigma2[0] = np.var(returns)   # initialise at unconditional variance

    for t in range(1, T):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    loglik = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + returns**2 / sigma2)
    return -loglik   # minimise negative log-lik

def fit_garch11(returns: np.ndarray) -> dict:
    """Maximum likelihood estimation of GARCH(1,1) parameters."""
    var_uncond = np.var(returns)
    # Unconditional variance: omega / (1 - alpha - beta)
    # Initial guess: omega=0.1*var, alpha=0.1, beta=0.85
    x0 = [0.1 * var_uncond, 0.10, 0.85]
    bounds = [(1e-8, None), (0, 1), (0, 1)]

    res = minimize(garch11_loglik, x0, args=(returns,),
                   method='L-BFGS-B', bounds=bounds)
    omega, alpha, beta = res.x

    # Forecast h-step-ahead conditional variance
    last_ret = returns[-1]
    last_var = np.var(returns[-50:])   # approximate initial
    # GARCH(1,1) h-step forecast: omega/(1-a-b) + (a+b)^h * (sigma_t^2 - uncond_var)
    uncond_var = omega / (1 - alpha - beta)
    forecast_1d = omega + alpha * last_ret**2 + beta * last_var

    return {
        'omega': omega, 'alpha': alpha, 'beta': beta,
        'persistence': alpha + beta,
        'uncond_vol':  np.sqrt(uncond_var * 252),  # annualised
        'forecast_1d_vol': np.sqrt(forecast_1d),
        'half_life': -np.log(2) / np.log(alpha + beta),  # days to mean-revert halfway
    }

np.random.seed(7)
# Simulate GARCH(1,1) returns
omega_true, alpha_true, beta_true = 2e-6, 0.09, 0.90
n = 1000
e = np.random.standard_normal(n)
sigma2 = np.zeros(n); sigma2[0] = omega_true/(1-alpha_true-beta_true)
for t in range(1, n):
    sigma2[t] = omega_true + alpha_true*e[t-1]**2*sigma2[t-1] + beta_true*sigma2[t-1]
returns = e * np.sqrt(sigma2)

result = fit_garch11(returns)
print(f"Fitted: omega={result['omega']:.2e}, alpha={result['alpha']:.4f}, "
      f"beta={result['beta']:.4f}")
print(f"Persistence (alpha+beta): {result['persistence']:.4f}")
print(f"Unconditional vol (ann): {result['uncond_vol']:.2%}")
print(f"Half-life of vol shocks: {result['half_life']:.1f} days")`,
    explanation: "GARCH(1,1) persistence (alpha + beta) near 1 means volatility shocks decay slowly — typical in equity markets where a spike from an earnings surprise takes weeks to revert; the half-life formula quantifies exactly how long that takes, and parameters alpha + beta >= 1 (IGARCH) imply infinite unconditional variance, which breaks the stationarity assumption underlying the VaR backtest.",
  },
];
