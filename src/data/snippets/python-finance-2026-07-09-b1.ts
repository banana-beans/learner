import type { Snippet } from "./types";

export const pythonFinanceSnippets20260709B1: Snippet[] = [
  {
    id: "pyfin-20260709-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading Spread",
    tag: "finance",
    code: `import numpy as np

class KalmanPairFilter:
    """
    Online Kalman filter for estimating the hedge ratio beta in Y = beta*X + alpha.
    State: [alpha, beta], observation: y_t.
    Transition: state random walk; observation: H = [1, x_t].
    """
    def __init__(self, delta: float = 1e-4, noise_obs: float = 1e-3):
        self.delta     = delta                    # process noise (controls speed of learning)
        self.noise_obs = noise_obs
        self.theta     = np.zeros(2)              # [alpha, beta]
        self.P         = np.eye(2)                # error covariance
        self.R         = noise_obs                # observation noise variance

    def update(self, y: float, x: float) -> float:
        """Update filter with new (x, y) pair. Returns current spread."""
        H  = np.array([1.0, x])                  # observation matrix
        # Predict
        Q  = self.delta / (1 - self.delta) * np.eye(2)  # process noise
        P_pred = self.P + Q

        # Kalman gain
        S  = H @ P_pred @ H + self.R             # innovation variance
        K  = P_pred @ H / S                      # Kalman gain vector

        # Update
        innovation    = y - H @ self.theta
        self.theta   += K * innovation
        self.P        = (np.eye(2) - np.outer(K, H)) @ P_pred

        return innovation / np.sqrt(S)           # normalised spread (z-score)

# Simulate a cointegrated pair with drift in beta
np.random.seed(0)
T = 500
X = np.cumsum(np.random.randn(T) * 0.5) + 50    # random walk ~50
beta_true = 1.2 + np.linspace(0, 0.3, T)         # slowly drifting beta
Y = beta_true * X + 5.0 + np.random.randn(T) * 0.3

kf = KalmanPairFilter(delta=1e-3)
z_scores = [kf.update(Y[t], X[t]) for t in range(T)]

# Simple mean-reversion signal
signals = [1 if z < -2 else (-1 if z > 2 else 0) for z in z_scores]
print(f"Beta estimate at T=500: {kf.theta[1]:.4f} (true: {beta_true[-1]:.4f})")
print(f"Long entries: {signals.count(1)}  Short entries: {signals.count(-1)}")`,
    explanation:
      "The Kalman filter tracks a time-varying hedge ratio online without re-fitting the whole regression at each tick. The delta parameter controls the random-walk process noise: larger delta means faster adaptation (tracks a rapidly drifting beta) at the cost of more noise in the estimate.",
  },
  {
    id: "pyfin-20260709-b1-hamilton-regime",
    language: "python",
    title: "Hamilton Regime-Switching Model via Baum-Welch EM",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def hamilton_em(returns: np.ndarray, n_states: int = 2,
                max_iter: int = 200, tol: float = 1e-6) -> dict:
    """
    Hamilton (1989) Markov regime-switching for returns.
    States differ in mean and volatility. Estimate via EM (Baum-Welch).
    Returns: mu, sigma, transition matrix P, state probs.
    """
    T = len(returns)
    # Initialise parameters (low/high vol states)
    mu    = np.array([-0.001, 0.002])
    sigma = np.array([0.02, 0.008])
    P     = np.array([[0.95, 0.05], [0.10, 0.90]])   # transition matrix

    log_lik_prev = -np.inf

    for iteration in range(max_iter):
        # --- E-step: forward-backward algorithm ---
        # Emission probabilities
        f = np.column_stack([norm.pdf(returns, mu[s], sigma[s]) for s in range(n_states)])
        f = np.clip(f, 1e-300, None)

        # Forward probs (scaled)
        alpha = np.zeros((T, n_states))
        scale = np.zeros(T)
        pi_init = np.ones(n_states) / n_states
        alpha[0] = pi_init * f[0]; scale[0] = alpha[0].sum(); alpha[0] /= scale[0]
        for t in range(1, T):
            alpha[t] = (alpha[t - 1] @ P) * f[t]
            scale[t] = alpha[t].sum(); alpha[t] /= scale[t]

        # Backward probs (scaled)
        beta = np.ones((T, n_states))
        for t in range(T - 2, -1, -1):
            beta[t] = P @ (f[t + 1] * beta[t + 1])
            beta[t] /= beta[t].sum()

        gamma = alpha * beta; gamma /= gamma.sum(axis=1, keepdims=True)

        xi = np.zeros((n_states, n_states))
        for t in range(T - 1):
            xi_t = alpha[t, :, None] * P * f[t + 1] * beta[t + 1]
            xi  += xi_t / xi_t.sum()

        # --- M-step ---
        mu    = (gamma * returns[:, None]).sum(axis=0) / gamma.sum(axis=0)
        sigma = np.sqrt((gamma * (returns[:, None] - mu) ** 2).sum(axis=0) / gamma.sum(axis=0))
        sigma = np.clip(sigma, 1e-5, None)
        P     = xi / xi.sum(axis=1, keepdims=True)

        log_lik = np.log(scale).sum()
        if abs(log_lik - log_lik_prev) < tol:
            break
        log_lik_prev = log_lik

    return {"mu": mu, "sigma": sigma, "P": P, "gamma": gamma,
            "log_lik": log_lik_prev, "iterations": iteration + 1}

np.random.seed(42)
# Simulate 2-regime return series: 300 days bear, 200 days bull
bear  = np.random.randn(300) * 0.015 - 0.0005
bull  = np.random.randn(200) * 0.008 + 0.0015
returns = np.concatenate([bear, bull])

res = hamilton_em(returns, n_states=2)
print(f"Regime 0 (bear?): mu={res['mu'][0]:.5f}  sigma={res['sigma'][0]:.5f}")
print(f"Regime 1 (bull?): mu={res['mu'][1]:.5f}  sigma={res['sigma'][1]:.5f}")
print(f"Transition P:\\n{np.round(res['P'], 3)}")
print(f"Converged in {res['iterations']} iterations")`,
    explanation:
      "Hamilton's regime-switching model explains the fat tails and volatility clustering of financial returns as mixtures of two Gaussian regimes (bull/bear), each with its own drift and volatility. The Baum-Welch EM algorithm iterates E-step (infer regime probabilities via forward-backward) and M-step (update parameters) until convergence.",
  },
  {
    id: "pyfin-20260709-b1-risk-parity",
    language: "python",
    title: "Equal Risk Contribution (Risk Parity) Optimization",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_contributions(w: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """Component risk contributions: RC_i = w_i * (Sigma w)_i / sigma_p"""
    port_var = w @ cov @ w
    mrc = (cov @ w) / np.sqrt(port_var)   # marginal risk contributions
    return w * mrc                          # component contributions (sum = sigma_p)

def risk_parity_weights(cov: np.ndarray) -> np.ndarray:
    """Find weights where all RC_i are equal (equal risk contribution)."""
    n = cov.shape[0]
    target_rc = 1.0 / n   # each asset contributes 1/n of total risk

    def objective(w):
        w = np.abs(w)
        port_var = w @ cov @ w
        if port_var < 1e-12:
            return 1e10
        mrc = cov @ w / np.sqrt(port_var)
        rc = w * mrc
        rc_normalised = rc / rc.sum()
        return np.sum((rc_normalised - target_rc) ** 2)

    x0 = np.ones(n) / n
    result = minimize(
        objective,
        x0,
        method="SLSQP",
        bounds=[(1e-4, 1.0)] * n,
        constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1}],
        options={"ftol": 1e-12, "maxiter": 2000},
    )
    w = np.abs(result.x)
    return w / w.sum()

np.random.seed(1)
n = 5
vols = np.array([0.20, 0.15, 0.30, 0.12, 0.25])
corr = np.array([
    [1.00, 0.30, 0.10, 0.05, 0.20],
    [0.30, 1.00, 0.15, 0.10, 0.25],
    [0.10, 0.15, 1.00, 0.08, 0.35],
    [0.05, 0.10, 0.08, 1.00, 0.12],
    [0.20, 0.25, 0.35, 0.12, 1.00],
])
cov = np.outer(vols, vols) * corr

w_rp = risk_parity_weights(cov)
rc   = risk_contributions(w_rp, cov)
print("Equal Risk Contribution weights:")
for i, (w, r) in enumerate(zip(w_rp, rc)):
    print(f"  Asset {i}: w={w:.4f}  RC={r:.5f} ({r/rc.sum()*100:.1f}%)")`,
    explanation:
      "Risk parity equalises each asset's contribution to total portfolio risk rather than allocating by dollar weight, giving high-volatility assets less capital. The optimisation objective is the sum of squared deviations from the equal-RC target; scipy SLSQP finds the ERC portfolio in milliseconds for typical asset-count universes.",
  },
  {
    id: "pyfin-20260709-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import curve_fit

def nelson_siegel(T: np.ndarray, beta0: float, beta1: float,
                  beta2: float, tau: float) -> np.ndarray:
    """
    Nelson-Siegel (1987) yield curve:
      y(T) = beta0 + beta1*(1-exp(-T/tau))/(T/tau)
           + beta2*((1-exp(-T/tau))/(T/tau) - exp(-T/tau))
    beta0: long-run level, beta1: slope (short rate - long rate),
    beta2: curvature (hump), tau: decay factor.
    """
    x  = T / tau
    ex = np.exp(-x)
    factor1 = (1 - ex) / x
    factor2 = factor1 - ex
    return beta0 + beta1 * factor1 + beta2 * factor2

def svensson(T: np.ndarray, b0, b1, b2, b3, tau1, tau2) -> np.ndarray:
    """Svensson (1994) extension: adds a second hump term."""
    x1, x2 = T / tau1, T / tau2
    ex1, ex2 = np.exp(-x1), np.exp(-x2)
    f1 = (1 - ex1) / x1
    f2 = (1 - ex2) / x2
    return b0 + b1*f1 + b2*(f1 - ex1) + b3*(f2 - ex2)

# Market zero rates (% annualised)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
yields     = np.array([3.50, 3.90, 4.30, 4.60, 4.70, 4.75, 4.80, 4.85, 4.90, 4.92, 4.95])
yields    /= 100.0   # convert % to decimal

# Fit Nelson-Siegel
p0_ns = [0.05, -0.02, 0.03, 2.0]
bounds_ns = ([0, -0.1, -0.1, 0.1], [0.15, 0.1, 0.1, 30])
popt_ns, _ = curve_fit(nelson_siegel, maturities, yields, p0=p0_ns, bounds=bounds_ns)

# Fit Svensson
p0_sv = [0.05, -0.02, 0.03, 0.01, 2.0, 10.0]
bounds_sv = ([0, -0.1, -0.1, -0.1, 0.1, 0.1], [0.15, 0.1, 0.1, 0.1, 30, 30])
popt_sv, _ = curve_fit(svensson, maturities, yields, p0=p0_sv, bounds=bounds_sv, maxfev=10000)

fitted_ns = nelson_siegel(maturities, *popt_ns)
fitted_sv = svensson(maturities, *popt_sv)

print(f"Nelson-Siegel params: beta0={popt_ns[0]:.4f} beta1={popt_ns[1]:.4f} "
      f"beta2={popt_ns[2]:.4f} tau={popt_ns[3]:.2f}")
print(f"RMSE NS: {np.sqrt(np.mean((fitted_ns - yields)**2))*1e4:.2f} bps")
print(f"RMSE SV: {np.sqrt(np.mean((fitted_sv - yields)**2))*1e4:.2f} bps")`,
    explanation:
      "Nelson-Siegel is the central bank standard for parametric yield curve representation: beta0 controls the long-end level, beta1 the slope (short-long spread), and beta2 a mid-maturity hump. Svensson adds a second hump term to better fit unusual curve shapes; both models provide smooth interpolation and meaningful extrapolation to unobserved maturities.",
  },
  {
    id: "pyfin-20260709-b1-hazard-rate-cds",
    language: "python",
    title: "CDS Pricing and Hazard Rate Bootstrapping",
    tag: "finance",
    code: `import numpy as np

def cds_hazard_bootstrap(tenors: list, spreads_bps: list,
                          r: float = 0.04, recovery: float = 0.4) -> dict:
    """
    Bootstrap a piecewise-constant hazard rate curve from CDS spreads.
    Returns hazard rates and survival probabilities at each tenor.
    spread in bps, r = risk-free rate, recovery = LGD complement.
    """
    lgd = 1.0 - recovery
    h      = []        # hazard rates (one per interval)
    q_prev = 1.0       # Q(0) = 1.0

    hazards = []
    surv    = {0.0: 1.0}

    for i, (T, s_bps) in enumerate(zip(tenors, spreads_bps)):
        s = s_bps / 10_000  # bps to decimal
        T_prev = tenors[i - 1] if i > 0 else 0.0
        dt     = T - T_prev

        # Approximate: for constant hazard h on (T_prev, T]:
        # PV_premium = s * sum_t df_t * Q(t)
        # PV_protection = LGD * sum_t df_t * (Q(t-dt) - Q(t))
        # => CDS par spread: s ≈ LGD * h  (simplified flat approximation)
        # Exact: solve CDS NPV = 0 numerically per period

        # Solve for h_i: CDS NPV = 0
        # Using the identity for constant h and quarterly coupons (simplified to annual)
        def cds_npv(h_trial):
            # Build survival curve
            h_full = hazards + [h_trial]
            tenors_full = tenors[:i] + [T]
            Q = 1.0
            prem_pv = 0.0; prot_pv = 0.0
            t_prev2 = 0.0
            for j, tj in enumerate(tenors_full):
                hj = h_full[j]
                dtj = tj - t_prev2
                Qj = Q * np.exp(-hj * dtj)
                df = np.exp(-r * tj)
                # Approximate: premium on avg survival
                prem_pv += s * 0.5 * (Q + Qj) * df * dtj
                prot_pv += lgd * (Q - Qj) * df
                Q = Qj; t_prev2 = tj
            return prem_pv - prot_pv

        from scipy.optimize import brentq
        h_i = brentq(cds_npv, 1e-6, 2.0)
        hazards.append(h_i)
        q_prev *= np.exp(-h_i * dt)
        surv[T] = q_prev

    return {"hazards": dict(zip(tenors, hazards)), "survival": surv}

tenors  = [1, 2, 3, 5, 7, 10]
spreads = [50, 70, 85, 110, 130, 150]  # bps

res = cds_hazard_bootstrap(tenors, spreads)
print("Hazard rates and survival probs:")
for T in tenors:
    print(f"  T={T:2d}y  h={res['hazards'][T]:.4f}  Q={res['survival'][T]:.4f}")`,
    explanation:
      "CDS bootstrapping recovers a piecewise-constant hazard rate curve by solving NPV=0 for each maturity in sequence, using survival probabilities from shorter tenors as inputs. The hazard rate h connects directly to the par spread: h ≈ s / LGD in the simplified case, making it intuitive as the risk-neutral default intensity.",
  },
  {
    id: "pyfin-20260709-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Joint Default Simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_defaults(
    n_obligors: int,
    corr: float,           # single-factor correlation
    pd: float,             # uniform PD per obligor
    n_sims: int = 100_000,
    seed: int = 1,
) -> dict:
    """
    Gaussian copula (Li 2000) single-factor model for CDO pricing.
    Each obligor defaults if its latent variable X_i < threshold.
    X_i = sqrt(rho)*M + sqrt(1-rho)*Z_i where M, Z_i ~ N(0,1).
    """
    rng = np.random.default_rng(seed)
    threshold = norm.ppf(pd)   # default threshold: Phi^{-1}(PD)

    # Single common factor M
    M = rng.standard_normal(n_sims)

    # Conditional on M, Z_i are i.i.d. N(0,1)
    # P(default | M) = Phi((threshold - sqrt(rho)*M) / sqrt(1-rho))
    cond_threshold = (threshold - np.sqrt(corr) * M) / np.sqrt(1 - corr)
    cond_pd = norm.cdf(cond_threshold)   # shape (n_sims,)

    # Simulate idiosyncratic shocks for each obligor
    Z = rng.standard_normal((n_sims, n_obligors))
    defaults = Z < cond_pd[:, None]     # True if obligor defaults in this sim

    loss_rate = defaults.mean(axis=1)   # portfolio loss rate per sim

    return {
        "mean_loss":    loss_rate.mean(),
        "std_loss":     loss_rate.std(),
        "var_99":       np.percentile(loss_rate, 99),   # tranche attachment calibration
        "var_999":      np.percentile(loss_rate, 99.9),
        "correlation":  corr,
    }

# Compare low vs high asset correlation
for rho in [0.0, 0.1, 0.3, 0.5]:
    res = gaussian_copula_defaults(n_obligors=125, corr=rho, pd=0.02)
    print(f"rho={rho:.1f}: E[Loss]={res['mean_loss']:.4f}  "
          f"99th%={res['var_99']:.4f}  99.9th%={res['var_999']:.4f}")`,
    explanation:
      "The Gaussian copula single-factor model was the industry standard for CDO pricing pre-2008: it collapses all pairwise correlations into one number rho (systematic risk factor loading). Higher rho concentrates losses — the 99.9th percentile tranche loss jumps dramatically with correlation, explaining why senior CDO tranches proved far riskier than AAA ratings implied.",
  },
  {
    id: "pyfin-20260709-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory: GPD Tail Risk Estimation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_mle(losses: np.ndarray, threshold: float) -> tuple:
    """
    Fit Generalised Pareto Distribution to exceedances over threshold.
    Returns (xi, sigma): shape and scale parameters.
    GPD CDF: F(x) = 1 - (1 + xi*x/sigma)^(-1/xi) for xi != 0
    """
    exceedances = losses[losses > threshold] - threshold
    if len(exceedances) < 20:
        raise ValueError("Too few exceedances for reliable GPD fit")

    def neg_log_lik(params):
        xi, sigma = params
        if sigma <= 0:
            return 1e10
        if xi != 0:
            arg = 1 + xi * exceedances / sigma
            if np.any(arg <= 0):
                return 1e10
            return np.sum(np.log(sigma) + (1 + 1/xi) * np.log(arg))
        else:  # exponential case
            return np.sum(np.log(sigma) + exceedances / sigma)

    result = minimize(neg_log_lik, [0.1, exceedances.mean()],
                      method="Nelder-Mead", options={"xatol": 1e-8, "maxiter": 5000})
    return result.x[0], result.x[1]

def gpd_var_es(xi: float, sigma: float, threshold: float,
               n_total: int, n_exceed: int, confidence: float) -> tuple:
    """Compute VaR and ES at given confidence level from fitted GPD."""
    p_exceed = n_exceed / n_total
    p_u = (1 - confidence) / p_exceed   # relative exceedance probability

    if xi != 0:
        var_excess = sigma / xi * (p_u ** (-xi) - 1)
        es_excess  = (var_excess + sigma - xi * threshold) / (1 - xi)
    else:  # exponential tail
        var_excess = -sigma * np.log(p_u)
        es_excess  = var_excess + sigma

    return threshold + var_excess, threshold + es_excess

np.random.seed(7)
# Heavy-tailed returns: mix of normal + occasional large shocks
losses = np.concatenate([
    np.abs(np.random.randn(950) * 0.01),
    np.abs(np.random.randn(50) * 0.05),    # tail events
])

u = np.percentile(losses, 90)   # threshold at 90th percentile
xi, sigma = fit_gpd_mle(losses, threshold=u)
n_exceed = (losses > u).sum()
var99, es99 = gpd_var_es(xi, sigma, u, len(losses), n_exceed, 0.99)

print(f"GPD fit: xi={xi:.4f}  sigma={sigma:.5f}")
print(f"99% VaR (EVT): {var99:.4f}")
print(f"99% ES  (EVT): {es99:.4f}")
print(f"Normal 99% VaR: {np.abs(np.random.randn(100000)*0.012).mean() + 2.326*0.012:.4f}")`,
    explanation:
      "Extreme Value Theory's Pickands-Balkema-de Haan theorem guarantees that exceedances over a high threshold converge in distribution to a Generalised Pareto Distribution regardless of the parent distribution — making GPD the principled way to estimate tail risk without assuming normality. The shape parameter xi > 0 signals a heavy tail (Pareto-type), which is typical for equity returns.",
  },
  {
    id: "pyfin-20260709-b1-importance-sampling-otm",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

np.random.seed(2)
S0, K, T, r, sigma = 100, 130, 1.0, 0.05, 0.20   # deep OTM: K/S = 1.30
N = 100_000

# Plain MC: very few paths reach K=130; high variance
Z_plain  = np.random.randn(N)
ST_plain = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_plain)
pay_plain = np.maximum(ST_plain - K, 0) * np.exp(-r*T)
mean_plain = pay_plain.mean()
se_plain   = pay_plain.std() / np.sqrt(N)

# Importance sampling: shift the mean of Z to put more weight on S_T > K
# Optimal mu shift: put terminal distribution at F = S0*exp(r*T)*exp(0.5*sigma^2*T)
# Simpler: shift mean such that E[S_T] = K (centre of mass at strike)
mu_shift = (np.log(K / S0) - (r - 0.5*sigma**2)*T) / (sigma*np.sqrt(T))

Z_is   = np.random.randn(N) + mu_shift      # shifted samples
ST_is  = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_is)
pay_is = np.maximum(ST_is - K, 0) * np.exp(-r*T)

# Likelihood ratio (Radon-Nikodym derivative): f(Z) / g(Z) where g is shifted Normal
lr     = np.exp(-mu_shift * Z_is + 0.5 * mu_shift**2)  # LR = exp(-mu*z + 0.5*mu^2)
pay_is_corrected = pay_is * lr

mean_is = pay_is_corrected.mean()
se_is   = pay_is_corrected.std() / np.sqrt(N)

bs_exact = bs_call(S0, K, T, r, sigma)
print(f"BS exact price:      {bs_exact:.6f}")
print(f"Plain MC:   {mean_plain:.6f}  SE={se_plain:.7f}")
print(f"IS MC:      {mean_is:.6f}   SE={se_is:.7f}")
print(f"Variance reduction: {(se_plain/se_is)**2:.0f}x")`,
    explanation:
      "For deep out-of-the-money options, plain Monte Carlo wastes nearly all paths on zero payoffs. Importance sampling shifts the simulation distribution toward the payoff region and corrects with a likelihood ratio weight — variance reduction of 100-1000× is typical for options with moneyness K/S > 1.2, making accurate pricing feasible with far fewer paths.",
  },
  {
    id: "pyfin-20260709-b1-digital-option-greeks",
    language: "python",
    title: "Digital (Binary) Option Pricing and Greeks",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def digital_call(S, K, T, r, sigma):
    """Cash-or-nothing digital call: pays $1 if S_T > K."""
    d2 = (np.log(S / K) + (r - 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return np.exp(-r * T) * norm.cdf(d2)

def digital_call_delta(S, K, T, r, sigma):
    """dC_digital/dS = exp(-rT) * N'(d2) / (S * sigma * sqrt(T))"""
    d2 = (np.log(S / K) + (r - 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return np.exp(-r * T) * norm.pdf(d2) / (S * sigma * np.sqrt(T))

def digital_call_vega(S, K, T, r, sigma):
    """dC_digital/dsigma: digital vega can be very large near ATM at expiry."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return -np.exp(-r * T) * norm.pdf(d2) * d1 / sigma

def digital_call_gamma(S, K, T, r, sigma):
    """d^2C/dS^2 for digital: can be negative (concave price)."""
    d2 = (np.log(S / K) + (r - 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d1 = d2 + sigma * np.sqrt(T)
    return -np.exp(-r * T) * norm.pdf(d2) * d1 / (S**2 * sigma**2 * T)

S0, K, T, r, sigma = 100.0, 100.0, 1.0, 0.05, 0.20

# Sensitivity across spot
for S in [85, 90, 95, 100, 105, 110, 115]:
    price = digital_call(S, K, T, r, sigma)
    delta = digital_call_delta(S, K, T, r, sigma)
    vega  = digital_call_vega(S, K, T, r, sigma)
    print(f"S={S:3d}  price={price:.4f}  delta={delta:.5f}  vega={vega:.5f}")

# Vol sensitivity near expiry (T=0.01): pin risk
print("\\nNear-expiry pin risk (T=0.01):")
for sig in [0.10, 0.20, 0.30]:
    print(f"  sigma={sig:.2f}  vega={digital_call_vega(100, 100, 0.01, 0.05, sig):.4f}")`,
    explanation:
      "Digital options exhibit 'pin risk': near expiry when S ≈ K, small moves cause the price to jump discontinuously between 0 and 1, making delta and gamma extreme and vega very sensitive. Market makers hedge digitals with tight call spreads (long a small-strike call, short a large-strike call) to avoid maintaining an infinitely sharp delta at expiry.",
  },
  {
    id: "pyfin-20260709-b1-kelly-criterion",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly Bet Sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(p: float, b: float) -> float:
    """
    Kelly fraction for binary bet: win b*stake with prob p, lose stake with prob 1-p.
    f* = p - (1-p)/b = (p*b - (1-p)) / b
    """
    return (p * b - (1 - p)) / b

def kelly_continuous(mu: float, sigma: float) -> float:
    """
    Kelly fraction for continuous lognormal returns: f* = mu / sigma^2.
    For a stock with excess return mu and volatility sigma.
    """
    return mu / sigma**2

def fractional_kelly_growth(f: float, mu: float, sigma: float) -> float:
    """Geometric growth rate G(f) = mu*f - 0.5*sigma^2*f^2."""
    return mu * f - 0.5 * sigma**2 * f**2

def max_drawdown_estimate(f: float, sigma: float, horizon: int = 252) -> float:
    """
    Approximate expected maximum drawdown for Kelly-fractional position.
    (Simplified: uses Brownian motion large-deviations approximation)
    """
    # For GBM: E[max DD] ≈ sigma * sqrt(horizon) * f for small f
    return f * sigma * np.sqrt(horizon) * 1.5   # rough scaling

# Example: strategy with Sharpe 0.8
mu, sigma = 0.10, 0.20   # annual excess return and volatility
f_kelly = kelly_continuous(mu, sigma)

fractions = np.linspace(0, 2, 100)
growth = [fractional_kelly_growth(f, mu, sigma) for f in fractions]
opt_idx = np.argmax(growth)

print(f"Full Kelly fraction: {f_kelly:.4f}  ({f_kelly*100:.1f}%)")
print(f"Half-Kelly fraction: {f_kelly/2:.4f}  ({f_kelly/2*100:.1f}%)")
print(f"Quarter-Kelly: {f_kelly/4:.4f}")

print("\\nFractional Kelly tradeoffs:")
for frac in [0.25, 0.5, 1.0, 1.5, 2.0]:
    f  = frac * f_kelly
    g  = fractional_kelly_growth(f, mu, sigma)
    dd = max_drawdown_estimate(f, sigma)
    print(f"  {frac:.2f}x Kelly: f={f:.3f}  G={g:.4f}  ~MaxDD={dd:.3f}")`,
    explanation:
      "The Kelly criterion maximises geometric growth rate but is rarely used at full Kelly because the associated drawdowns are extreme (50%+ are common). Professional quant funds typically run at 1/4 to 1/2 Kelly, accepting lower growth for dramatically reduced drawdowns — the growth rate penalty is second-order (G(f/2) ≈ 0.75 × G(f)) but the drawdown reduction is linear.",
  },
  {
    id: "pyfin-20260709-b1-transaction-cost-model",
    language: "python",
    title: "Almgren-Chriss Market Impact and Transaction Cost Model",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def almgren_chriss_cost(
    x0: float,       # shares to liquidate
    T: float,        # execution horizon (days)
    n: int,          # number of trading periods
    eta: float,      # temporary impact coefficient
    gamma: float,    # permanent impact coefficient
    sigma: float,    # daily volatility ($ per share)
    lam: float,      # risk aversion (penalty per unit variance)
) -> dict:
    """
    Almgren-Chriss (2001) optimal execution of a single-asset liquidation.
    Minimises E[cost] + lam * Var[cost].
    Closed-form: optimal trajectory is linear in remaining inventory.
    """
    dt = T / n
    kappa2 = lam * sigma**2 / eta  # decay rate squared
    kappa  = np.sqrt(kappa2)

    # Closed-form optimal trading trajectory
    times = np.linspace(0, T, n + 1)
    # Hyperbolic schedule: x(t) = x0 * sinh(kappa*(T-t)) / sinh(kappa*T)
    denom = np.sinh(kappa * T)
    if denom < 1e-12:   # risk-neutral limit (kappa -> 0): linear schedule
        x_path = x0 * (1 - times / T)
    else:
        x_path = x0 * np.sinh(kappa * (T - times)) / denom

    # Trade rates (shares per period)
    trade_list = np.diff(-x_path)  # positive = selling

    # Expected cost components
    temp_impact  = eta * np.sum(trade_list**2 / dt)
    perm_impact  = 0.5 * gamma * x0**2
    timing_risk  = lam * sigma**2 * dt * np.sum(x_path[:-1]**2)

    total_expected_cost = temp_impact + perm_impact

    return {
        "trajectory": x_path,
        "trades": trade_list,
        "temp_impact": temp_impact,
        "perm_impact": perm_impact,
        "timing_risk": timing_risk,
        "IS_cost": total_expected_cost / x0,   # implementation shortfall per share
    }

# Example: liquidate 100,000 shares over 10 days
result = almgren_chriss_cost(
    x0=100_000, T=10, n=10,
    eta=0.1e-6, gamma=0.1e-7, sigma=0.50,
    lam=1e-5,
)
print("Optimal liquidation trajectory:")
for i, (x, q) in enumerate(zip(result["trajectory"], result["trades"])):
    print(f"  Day {i}: hold={x:10.0f}  sell={q:8.0f}")
print(f"\\nIS cost/share: \${result['IS_cost']:.6f}")
print(f"Temp impact: \${result['temp_impact']:.2f}")
print(f"Perm impact: \${result['perm_impact']:.2f}")`,
    explanation:
      "Almgren-Chriss optimal execution balances temporary market impact (which is quadratic in trade rate) against timing risk (variance of the unrealised position). The optimal schedule is hyperbolic — aggressive early when the urgency parameter kappa is large (high risk aversion or high volatility), degenerating to a linear TWAP schedule in the risk-neutral limit.",
  },
  {
    id: "pyfin-20260709-b1-turnover-constrained-opt",
    language: "python",
    title: "Turnover-Constrained Portfolio Rebalancing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def rebalance_with_turnover_limit(
    w_current: np.ndarray,
    mu: np.ndarray,
    cov: np.ndarray,
    risk_aversion: float = 2.0,
    max_turnover: float = 0.20,   # max 20% one-way turnover
    txn_cost_bps: float = 10.0,   # 10 bps per unit of turnover
) -> np.ndarray:
    """
    Find target weights maximising risk-adjusted return minus transaction costs,
    subject to a one-way turnover constraint.
    """
    n = len(mu)
    tc = txn_cost_bps / 10_000   # to decimal

    def objective(w):
        # Negative of: alpha - 0.5*lambda*variance - txn_cost * turnover
        ret  = w @ mu
        var  = w @ cov @ w
        turn = np.abs(w - w_current).sum() / 2
        return -(ret - 0.5 * risk_aversion * var - tc * turn)

    constraints = [
        {"type": "eq", "fun": lambda w: w.sum() - 1.0},
        {"type": "ineq", "fun": lambda w: max_turnover - np.abs(w - w_current).sum() / 2},
    ]
    bounds = [(0.0, 0.25)] * n    # max 25% per asset (concentration limit)

    result = minimize(
        objective,
        x0=w_current.copy(),
        method="SLSQP",
        bounds=bounds,
        constraints=constraints,
        options={"ftol": 1e-10, "maxiter": 2000},
    )
    return result.x

np.random.seed(5)
n = 8
w_curr = np.ones(n) / n               # equal weight starting point
mu = np.random.randn(n) * 0.01 + 0.005
A  = np.random.randn(n, n) * 0.05
cov = A @ A.T + np.eye(n) * 0.005

w_target = rebalance_with_turnover_limit(w_curr, mu, cov, max_turnover=0.15)
turnover = np.abs(w_target - w_curr).sum() / 2

print("Optimal target weights (with 15% turnover cap):")
for i, (wc, wt) in enumerate(zip(w_curr, w_target)):
    print(f"  Asset {i}: {wc:.4f} -> {wt:.4f} (trade {wt-wc:+.4f})")
print(f"One-way turnover: {turnover:.4f}")`,
    explanation:
      "Unconstrained mean-variance optimisation often prescribes extreme turnover that is unprofitable after transaction costs. Adding a turnover constraint and explicit transaction cost penalty in the objective steers the solution toward a portfolio with a better net-of-cost Sharpe, especially important for signal-driven quant funds where alpha is small relative to trading friction.",
  },
  {
    id: "pyfin-20260709-b1-factor-residualise",
    language: "python",
    title: "Alpha Signal Residualisation Against Risk Factors",
    tag: "finance",
    code: `import numpy as np

def residualise_alpha(
    raw_alpha: np.ndarray,        # raw signal, shape (N,)
    factor_loadings: np.ndarray,  # factor exposures, shape (N, K)
    w_mkt: np.ndarray,            # market-cap weights for WLS, shape (N,)
) -> np.ndarray:
    """
    Remove factor exposure from a raw alpha signal via weighted cross-sectional regression.
    Returns residual alpha that is orthogonal to all K factors.
    Steps:
      1. WLS-regress raw_alpha on factors with sqrt(w_mkt) weights
      2. Subtract fitted values -> residual is factor-neutral
    """
    N, K = factor_loadings.shape
    W = np.diag(np.sqrt(w_mkt))    # weight matrix

    X = W @ factor_loadings        # weighted design matrix (N x K)
    y = W @ raw_alpha              # weighted signal (N,)

    # WLS via OLS on weighted system
    beta = np.linalg.lstsq(X, y, rcond=None)[0]  # OLS coefficients
    fitted   = factor_loadings @ beta              # predicted factor contribution
    residual = raw_alpha - fitted                  # factor-neutral alpha

    # Demean (remove market-weighted average to zero out residual alpha sum)
    residual -= residual @ w_mkt / w_mkt.sum()

    return residual

np.random.seed(3)
N = 100  # stocks
K = 5    # factors: market, size, value, momentum, quality

# Random signal and factor loadings
raw_alpha = np.random.randn(N) * 0.01
factor_loadings = np.random.randn(N, K)

# Market cap weights (log-normal)
w_mkt = np.exp(np.random.randn(N) * 0.5)
w_mkt /= w_mkt.sum()

residual = residualise_alpha(raw_alpha, factor_loadings, w_mkt)

# Verify: residual should be orthogonal to all factors (weighted inner product near zero)
for k in range(K):
    corr = np.abs(np.dot(w_mkt, residual * factor_loadings[:, k]))
    print(f"  Factor {k} weighted corr with residual: {corr:.2e}")

print(f"\\nIC (raw):      {np.corrcoef(raw_alpha, factor_loadings[:,0])[0,1]:.4f}")
print(f"IC (residual): {np.corrcoef(residual, factor_loadings[:,0])[0,1]:.4f}")`,
    explanation:
      "Residualising removes the fraction of an alpha signal that is explained by common risk factors (size, value, momentum), leaving only the idiosyncratic component. Without residualisation, a signal correlated with the size factor would inadvertently tilt the portfolio toward small caps — desirable only if the small-cap effect is the intended alpha, not a latent exposure.",
  },
  {
    id: "pyfin-20260709-b1-pca-yield-curve",
    language: "python",
    title: "PCA Decomposition of Yield Curve Movements",
    tag: "finance",
    code: `import numpy as np

np.random.seed(12)
# Simulate 252 days of yield curve changes across 10 maturities
tenors = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
n_days = 252

# Stylised: 3 factors drive >95% of yield variance
# PC1: parallel shift, PC2: slope, PC3: curvature
def synthetic_curve_changes(n, seed=12):
    rng = np.random.default_rng(seed)
    # Factor returns
    f1 = rng.standard_normal(n) * 0.005   # level factor
    f2 = rng.standard_normal(n) * 0.003   # slope factor
    f3 = rng.standard_normal(n) * 0.001   # curvature factor
    # Loadings
    L1 = np.ones(10)
    L2 = np.linspace(1, -1, 10)           # negative slope at long end
    L3 = np.concatenate([np.linspace(-1, 1, 5), np.linspace(1, -1, 5)])
    # Yield changes
    return (np.outer(f1, L1) + np.outer(f2, L2) + np.outer(f3, L3)
            + rng.standard_normal((n, 10)) * 0.001)

dy = synthetic_curve_changes(n_days)

# PCA via SVD (more numerically stable than eigendecomposition of cov)
dy_centered = dy - dy.mean(axis=0)
U, s, Vt = np.linalg.svd(dy_centered, full_matrices=False)

explained_var = s**2 / (s**2).sum()
cumvar = np.cumsum(explained_var)

print("PCA of yield curve changes:")
print(f"{'PC':<4} {'Var%':>8} {'Cumul%':>8}  Loadings (short→long)")
for k in range(5):
    loadings = Vt[k]
    # Sign convention: first loading of PC1 should be positive (parallel shift up)
    if loadings[0] < 0:
        loadings = -loadings
    print(f"PC{k+1:<2} {explained_var[k]*100:7.2f}%  {cumvar[k]*100:7.2f}%  "
          + "  ".join(f"{l:+.3f}" for l in loadings[::2]))

# Hedge 1-year yield against PC1 (level) risk using 10-year yield
w_hedge = -Vt[0, 2] / Vt[0, 7]   # -loading_1y / loading_10y
print(f"\\nPC1 hedge: short {w_hedge:.4f} units of 10y per 1 unit of 1y")`,
    explanation:
      "The first three principal components of daily yield changes explain 95%+ of variance in most markets: PC1 is a parallel shift (~70%), PC2 is a flattening/steepening (~20%), PC3 is a butterfly/curvature (~5%). Rate desks use PCA loadings to construct duration-neutral hedges that are also slope-neutral and curvature-neutral, achieving multi-factor immunisation.",
  },
  {
    id: "pyfin-20260709-b1-pandas-ohlcv-resample",
    language: "python",
    title: "OHLCV Aggregation and Rolling Metrics with pandas resample",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

np.random.seed(21)
# Simulate 1-minute tick data for one trading day (390 minutes)
dates = pd.date_range("2024-01-15 09:30", periods=390, freq="1min")
price = 100 + np.cumsum(np.random.randn(390) * 0.05)
volume = np.random.randint(100, 10_000, 390).astype(float)

ticks = pd.DataFrame({"price": price, "volume": volume}, index=dates)

# Resample to 5-minute OHLCV bars
ohlcv = ticks["price"].resample("5min").ohlc()
ohlcv["volume"] = ticks["volume"].resample("5min").sum()

# VWAP: volume-weighted average price
ticks["pv"] = ticks["price"] * ticks["volume"]
vwap = ticks["pv"].resample("5min").sum() / ticks["volume"].resample("5min").sum()
ohlcv["vwap"] = vwap

# Rolling 20-bar (= 100 min) indicators on 5-min bars
ohlcv["sma20"]  = ohlcv["close"].rolling(20).mean()
ohlcv["std20"]  = ohlcv["close"].rolling(20).std()
ohlcv["bb_up"]  = ohlcv["sma20"] + 2 * ohlcv["std20"]
ohlcv["bb_dn"]  = ohlcv["sma20"] - 2 * ohlcv["std20"]

# Realised volatility (annualised) from log returns
ohlcv["log_ret"] = np.log(ohlcv["close"] / ohlcv["close"].shift(1))
ohlcv["rvol20"]  = ohlcv["log_ret"].rolling(20).std() * np.sqrt(252 * 78)  # 78 bars/day

print(ohlcv[["open","high","low","close","volume","vwap","sma20","rvol20"]].tail(10).to_string(
    float_format="{:.4f}".format))`,
    explanation:
      "pandas resample().ohlc() computes Open-High-Low-Close bars from tick data in one line, and resample().sum() accumulates volume — the canonical pattern for building a 5-minute bar dataset from raw trade prints. Annualising rolling volatility requires multiplying by sqrt(bars_per_year) = sqrt(252 days × 78 five-minute bars per day) rather than sqrt(252), since the observation frequency is intraday.",
  },
  {
    id: "pyfin-20260709-b1-ou-param-estimation",
    language: "python",
    title: "Ornstein-Uhlenbeck Parameter Estimation via OLS",
    tag: "finance",
    code: `import numpy as np

def fit_ou(x: np.ndarray, dt: float = 1.0) -> dict:
    """
    Estimate Ornstein-Uhlenbeck parameters (kappa, mu, sigma) from a time series.
    OU process: dx = kappa*(mu - x) dt + sigma dW
    Discrete approximation: x_{t+1} - x_t = alpha + beta*x_t + eps
    => kappa = -log(1+beta)/dt, mu = -alpha/beta, sigma from residuals.
    """
    x_lag = x[:-1]
    x_next = x[1:]
    dx = x_next - x_lag

    # OLS: dx = alpha + beta*x_lag + eps
    X  = np.column_stack([np.ones(len(x_lag)), x_lag])
    b  = np.linalg.lstsq(X, dx, rcond=None)[0]
    alpha, beta = b

    kappa = -np.log(1.0 + beta) / dt         # mean-reversion speed
    mu    = -alpha / beta if abs(beta) > 1e-10 else 0.0
    resid = dx - X @ b
    sigma = resid.std(ddof=2) / np.sqrt(dt)   # instantaneous vol

    # Half-life: time to mean-revert halfway
    half_life = np.log(2) / kappa if kappa > 0 else np.inf

    return {"kappa": kappa, "mu": mu, "sigma": sigma, "half_life": half_life,
            "beta": beta, "alpha": alpha}

def simulate_ou(kappa, mu, sigma, x0, T, dt, seed=0) -> np.ndarray:
    """Euler-Maruyama simulation of OU process."""
    rng = np.random.default_rng(seed)
    n   = int(T / dt)
    x   = np.empty(n + 1)
    x[0] = x0
    for t in range(n):
        x[t+1] = x[t] + kappa*(mu - x[t])*dt + sigma*np.sqrt(dt)*rng.standard_normal()
    return x

# True parameters
true = {"kappa": 0.5, "mu": 10.0, "sigma": 0.3}
x = simulate_ou(**true, x0=10.0, T=500, dt=1.0)
est = fit_ou(x, dt=1.0)

print("Parameter recovery:")
print(f"  kappa: true={true['kappa']:.3f}  est={est['kappa']:.3f}")
print(f"  mu:    true={true['mu']:.3f}  est={est['mu']:.3f}")
print(f"  sigma: true={true['sigma']:.3f}  est={est['sigma']:.3f}")
print(f"  half-life: {est['half_life']:.2f} periods  (true: {np.log(2)/true['kappa']:.2f})")`,
    explanation:
      "The OU process is the canonical model for mean-reverting spreads in pairs trading and short-rate models. Its parameters can be estimated by OLS on the discrete-time AR(1) regression, with the continuous-time parameters recovered by log-transformation — the half-life is particularly actionable as it tells the trader how quickly the spread is expected to converge.",
  },
  {
    id: "pyfin-20260709-b1-garch-mle",
    language: "python",
    title: "GARCH(1,1) Maximum Likelihood Estimation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_log_lik(params: np.ndarray, returns: np.ndarray) -> float:
    """Negative log-likelihood for GARCH(1,1)."""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10

    T = len(returns)
    h = np.empty(T)
    h[0] = returns.var()   # unconditional variance as start

    ll = 0.0
    for t in range(1, T):
        h[t] = omega + alpha * returns[t - 1]**2 + beta * h[t - 1]
        ll  += 0.5 * (np.log(h[t]) + returns[t]**2 / h[t])

    return ll   # returns negative log-lik (to minimise)

def fit_garch(returns: np.ndarray) -> dict:
    """Fit GARCH(1,1) to a return series."""
    var0  = returns.var()
    x0    = [var0 * 0.1, 0.1, 0.85]   # initial guess
    bounds = [(1e-8, 1e-3), (1e-6, 0.4), (0.5, 0.999)]

    res = minimize(garch_log_lik, x0, args=(returns,),
                   method="L-BFGS-B", bounds=bounds,
                   options={"ftol": 1e-12, "maxiter": 5000})

    omega, alpha, beta = res.x
    sigma_inf = np.sqrt(omega / (1 - alpha - beta))   # unconditional vol
    hl = -np.log(2) / np.log(alpha + beta)             # vol persistence half-life

    return {"omega": omega, "alpha": alpha, "beta": beta,
            "sigma_inf": sigma_inf, "half_life_days": hl,
            "persistence": alpha + beta}

np.random.seed(7)
# True params: omega=0.00002, alpha=0.10, beta=0.85
T  = 2000
h  = np.empty(T); h[0] = 0.0002
r  = np.empty(T); r[0] = 0.0
for t in range(1, T):
    h[t] = 0.00002 + 0.10 * r[t-1]**2 + 0.85 * h[t-1]
    r[t] = np.sqrt(h[t]) * np.random.randn()

res = fit_garch(r)
print(f"GARCH(1,1) fit:")
print(f"  omega = {res['omega']:.6f}  (true: 0.000020)")
print(f"  alpha = {res['alpha']:.4f}    (true: 0.10)")
print(f"  beta  = {res['beta']:.4f}    (true: 0.85)")
print(f"  Persistence (a+b) = {res['persistence']:.4f}")
print(f"  Unconditional vol = {res['sigma_inf']:.4f}")
print(f"  Vol shock half-life = {res['half_life_days']:.1f} days")`,
    explanation:
      "GARCH(1,1) models time-varying volatility with two ingredients: alpha (how much yesterday's shock amplifies today's vol) and beta (how persistent the current vol level is). High persistence (alpha + beta near 1) means volatility shocks die slowly — typical for equity indices where vol clusters for weeks. The half-life formula log(2) / log(alpha+beta) quantifies this directly.",
  },
  {
    id: "pyfin-20260709-b1-random-forest-alpha",
    language: "python",
    title: "Random Forest Alpha Signal from Market Features",
    tag: "finance",
    code: `import numpy as np

class SimpleRandomForest:
    """Minimal random forest for alpha prediction using numpy only (no sklearn)."""

    class Tree:
        """Axis-aligned decision tree with random feature subset at each split."""
        def __init__(self, max_depth=5, max_features=4, seed=None):
            self.max_depth = max_depth
            self.max_features = max_features
            self.rng = np.random.default_rng(seed)
            self.node = {}

        def fit(self, X, y, node_id=0, depth=0):
            n, p = X.shape
            if depth >= self.max_depth or n <= 2:
                self.node[node_id] = {"leaf": True, "value": y.mean()}
                return
            # Random feature subset
            feats = self.rng.choice(p, size=min(self.max_features, p), replace=False)
            best_gain, best_feat, best_thr = -np.inf, -1, 0.0
            for f in feats:
                thresholds = np.percentile(X[:, f], [25, 50, 75])
                for thr in thresholds:
                    left  = y[X[:, f] <= thr]
                    right = y[X[:, f] >  thr]
                    if len(left) < 1 or len(right) < 1:
                        continue
                    gain = (n * y.var() - len(left) * left.var() - len(right) * right.var())
                    if gain > best_gain:
                        best_gain, best_feat, best_thr = gain, f, thr
            if best_feat < 0:
                self.node[node_id] = {"leaf": True, "value": y.mean()}
                return
            self.node[node_id] = {"feat": best_feat, "thr": best_thr}
            mask = X[:, best_feat] <= best_thr
            self.fit(X[mask],  y[mask],  2*node_id+1, depth+1)
            self.fit(X[~mask], y[~mask], 2*node_id+2, depth+1)

        def predict_one(self, x, node_id=0):
            nd = self.node.get(node_id)
            if nd is None or nd.get("leaf"):
                return nd["value"] if nd else 0.0
            return (self.predict_one(x, 2*node_id+1) if x[nd["feat"]] <= nd["thr"]
                    else self.predict_one(x, 2*node_id+2))

        def predict(self, X):
            return np.array([self.predict_one(x) for x in X])

    def __init__(self, n_trees=20, max_depth=4, max_features=3, seed=42):
        self.trees = [self.Tree(max_depth, max_features, seed+i) for i in range(n_trees)]

    def fit(self, X, y):
        n = len(y)
        for tree in self.trees:
            idx = np.random.default_rng(id(tree)).choice(n, n, replace=True)
            tree.fit(X[idx], y[idx])

    def predict(self, X):
        return np.mean([t.predict(X) for t in self.trees], axis=0)

np.random.seed(0)
n, p = 2000, 8
# Features: momentum, reversal, vol, turnover, etc.
X = np.random.randn(n, p)
# True signal: combination of first 3 features with noise
y = 0.2*X[:,0] - 0.1*X[:,1] + 0.15*X[:,2] + np.random.randn(n)*0.5

train, test = int(0.8*n), int(0.2*n)
rf = SimpleRandomForest(n_trees=30, max_depth=5, max_features=4)
rf.fit(X[:train], y[:train])
yhat = rf.predict(X[train:])
ic = np.corrcoef(yhat, y[train:])[0,1]
print(f"Out-of-sample IC: {ic:.4f}  (expected ~0.15 for SNR=0.3)")`,
    explanation:
      "Random forests aggregate many decorrelated decision trees, each trained on a bootstrap sample with a random feature subset, making them robust to overfitting in small-sample financial datasets. Information Coefficient (IC = rank correlation of predictions with forward returns) is the standard alpha model evaluation metric — an IC of 0.05 is considered meaningful in equities.",
  },
];
