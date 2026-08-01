import type { Snippet } from "./types";

export const pythonFinanceSnippets20260801B1: Snippet[] = [
  {
    id: "pyfin-20260801-b1-hull-white-simulation",
    language: "python",
    title: "Hull-White Short-Rate Model Simulation",
    tag: "finance",
    code: `import numpy as np

def hull_white_paths(r0: float, a: float, sigma: float, theta_t,
                     T: float, n_steps: int, n_paths: int,
                     seed: int = 42) -> np.ndarray:
    """
    Simulate Hull-White short rate: dr = (theta(t) - a*r)*dt + sigma*dW
    theta_t: callable theta(t) for time-dependent mean reversion level.
    Returns shape (n_paths, n_steps+1).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    r   = np.full(n_paths, r0)
    paths = np.empty((n_paths, n_steps + 1))
    paths[:, 0] = r
    sqdt = np.sqrt(dt)

    for i in range(n_steps):
        t     = i * dt
        dW    = rng.standard_normal(n_paths) * sqdt
        drift = (theta_t(t) - a * r) * dt
        r     = r + drift + sigma * dW
        paths[:, i + 1] = r
    return paths

# Example: constant theta for simplicity
if __name__ == "__main__":
    theta = lambda t: 0.03 * np.exp(-0.5 * t) + 0.01  # example calibration
    paths = hull_white_paths(0.02, 0.1, 0.01, theta, 1.0, 252, 1000)
    print(f"Mean terminal rate: {paths[:, -1].mean():.4f}")`,
    explanation: "Hull-White's affine mean-reversion allows exact calibration to the initial yield curve via theta(t). The Euler-Maruyama discretisation introduces O(dt) bias; for pricing use the exact conditional distribution: r(t+dt)|r(t) is normal with known mean and variance."
  },
  {
    id: "pyfin-20260801-b1-nelson-siegel-fit",
    language: "python",
    title: "Nelson-Siegel Yield Curve Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def ns_yield(tau: np.ndarray, beta0: float, beta1: float,
             beta2: float, lam: float) -> np.ndarray:
    """Nelson-Siegel yield: y(tau) = b0 + b1*f(tau,lam) + b2*g(tau,lam)."""
    x = tau / lam
    f = (1 - np.exp(-x)) / x
    g = f - np.exp(-x)
    return beta0 + beta1 * f + beta2 * g

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray):
    """Fit NS parameters to observed yields via least-squares."""
    def loss(params):
        b0, b1, b2, lam = params
        if lam <= 0: return 1e10
        fitted = ns_yield(maturities, b0, b1, b2, lam)
        return np.sum((fitted - yields) ** 2)

    x0 = [yields[-1], yields[0] - yields[-1], 0.0, 2.0]
    res = minimize(loss, x0, method="Nelder-Mead",
                   options={"xatol": 1e-8, "fatol": 1e-10, "maxiter": 5000})
    return res.x  # (beta0, beta1, beta2, lambda)

if __name__ == "__main__":
    mats = np.array([0.25, 0.5, 1, 2, 5, 10, 30])
    ylds = np.array([0.04, 0.042, 0.044, 0.046, 0.048, 0.047, 0.044])
    params = fit_nelson_siegel(mats, ylds)
    print(f"NS params: beta0={params[0]:.4f} beta1={params[1]:.4f} "
          f"beta2={params[2]:.4f} lambda={params[3]:.4f}")`,
    explanation: "Nelson-Siegel decomposes the yield curve into level (beta0), slope (beta1), and hump (beta2) factors. The lambda parameter controls the hump's position. Unlike splines, NS extrapolates sensibly: as tau->infinity the yield approaches beta0 (long-run level)."
  },
  {
    id: "pyfin-20260801-b1-cds-hazard-rate",
    language: "python",
    title: "CDS Pricing via Constant Hazard Rate Model",
    tag: "finance",
    code: `import numpy as np

def cds_spread(hazard_rate: float, recovery: float,
               r: float, maturities: np.ndarray) -> float:
    """
    Par CDS spread for constant hazard rate h, recovery R, flat discount r.
    Spread = (1-R)*h * PV01_annuity / protection_leg_PV
    Uses continuous-time formulation.
    """
    dt  = np.diff(np.concatenate([[0], maturities]))
    t   = maturities
    # Survival probability S(t) = exp(-h*t)
    S   = np.exp(-hazard_rate * t)
    # Discount factors
    D   = np.exp(-r * t)
    # Premium leg: S(t)*D(t) paid at each coupon date
    pv_premium = np.sum(S * D * dt)
    # Protection leg: expected PV of loss payment on default
    # Integrate (1-R)*h*S(t)*D(t) dt (approx as sum over coupon dates)
    pv_protection = (1 - recovery) * hazard_rate * np.sum(S * D * dt)
    spread_bps = (pv_protection / pv_premium) * 10_000
    return spread_bps

if __name__ == "__main__":
    t = np.array([0.5, 1.0, 2.0, 3.0, 5.0])
    s = cds_spread(0.02, 0.4, 0.05, t)
    print(f"CDS spread: {s:.1f} bps")  # ~120 bps for h=2%, R=40%`,
    explanation: "Under constant hazard rate, survival probability is exponential: S(t)=exp(-h*t). The par spread equates the protection leg PV to the premium leg PV. Calibrating h from observed spreads gives the risk-neutral default intensity used in CVA and CDO pricing."
  },
  {
    id: "pyfin-20260801-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility MC Pricer",
    tag: "finance",
    code: `import numpy as np

def heston_mc(S0: float, K: float, T: float, r: float,
              v0: float, kappa: float, theta: float,
              xi: float, rho: float,
              n_steps: int = 252, n_paths: int = 50_000,
              seed: int = 42) -> float:
    """
    Heston model (Euler-Maruyama on log-S and v):
      dS = r*S dt + sqrt(v)*S dW1
      dv = kappa*(theta - v) dt + xi*sqrt(v) dW2
      corr(dW1, dW2) = rho
    Returns European call price.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    sqdt = np.sqrt(dt)

    logS = np.full(n_paths, np.log(S0))
    v    = np.full(n_paths, v0)
    disc = np.exp(-r * T)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * rng.standard_normal(n_paths)
        sv = np.sqrt(np.maximum(v, 0))          # full truncation scheme
        logS += (r - 0.5 * v) * dt + sv * sqdt * Z1
        v    += kappa * (theta - v) * dt + xi * sv * sqdt * Z2
        v     = np.maximum(v, 0)               # absorbing boundary

    S_T    = np.exp(logS)
    payoff = np.maximum(S_T - K, 0)
    return disc * payoff.mean()

if __name__ == "__main__":
    price = heston_mc(100, 100, 1.0, 0.05, 0.04, 2.0, 0.04, 0.3, -0.7)
    print(f"Heston call price: {price:.4f}")`,
    explanation: "The full-truncation scheme (max(v,0)) prevents negative variance without Feller condition. rho<0 captures the leverage effect (vol rises when price falls). For production use, the Broadie-Kaya exact simulation eliminates discretisation bias at higher computational cost."
  },
  {
    id: "pyfin-20260801-b1-sabr-approx",
    language: "python",
    title: "SABR Model Implied Volatility (Hagan Approximation)",
    tag: "finance",
    code: `import numpy as np

def sabr_implied_vol(F: float, K: float, T: float,
                     alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) SABR implied vol approximation.
    F: forward, K: strike, T: expiry
    alpha: initial vol, beta: CEV exponent, rho: corr, nu: vol-of-vol
    """
    if abs(F - K) < 1e-10:                      # ATM formula
        FK_mid = F ** (1 - beta)
        z = (nu / alpha) * FK_mid * (F - K)
        A = alpha / (FK_mid * (1 + (1-beta)**2/24 * np.log(F/K)**2
                                + (1-beta)**4/1920 * np.log(F/K)**4))
        B = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**2
                 + rho*beta*nu*alpha/(4*FK_mid)
                 + (2-3*rho**2)/24 * nu**2) * T
        return alpha / FK_mid * B

    z    = (nu / alpha) * (F * K) ** ((1 - beta) / 2) * np.log(F / K)
    x    = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    denom = (F * K) ** ((1-beta)/2) * (
        1 + (1-beta)**2/24 * np.log(F/K)**2
          + (1-beta)**4/1920 * np.log(F/K)**4
    )
    prefactor = alpha / denom * (z / x if abs(x) > 1e-10 else 1.0)
    correction = 1 + ((1-beta)**2/24 * alpha**2 / (F*K)**(1-beta)
                      + rho*beta*nu*alpha / (4*(F*K)**((1-beta)/2))
                      + (2-3*rho**2)/24 * nu**2) * T
    return prefactor * correction

if __name__ == "__main__":
    vol = sabr_implied_vol(0.03, 0.025, 1.0, 0.2, 0.5, -0.3, 0.4)
    print(f"SABR implied vol: {vol:.4f}")`,
    explanation: "Hagan's SABR formula gives closed-form implied vol as a function of (F,K,T,alpha,beta,rho,nu). beta=0.5 is standard for interest-rate swaptions; beta=1 recovers lognormal. The approximation breaks down for very long expiries or extreme strikes — use exact MC or the Antonov extension instead."
  },
  {
    id: "pyfin-20260801-b1-local-vol-dupire",
    language: "python",
    title: "Dupire Local Volatility from Implied Vol Surface",
    tag: "finance",
    code: `import numpy as np

def dupire_local_vol(K: np.ndarray, T: np.ndarray,
                     C: np.ndarray, r: float) -> np.ndarray:
    """
    Dupire formula: sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) /
                                        (0.5*K^2 * d2C/dK2)
    C: 2D array of call prices, shape (len(T), len(K)).
    Uses finite differences for derivatives.
    """
    dT = np.gradient(C, T, axis=0)        # dC/dT
    dK = np.gradient(C, K, axis=1)        # dC/dK
    d2K = np.gradient(dK, K, axis=1)      # d2C/dK2

    K2d = K[np.newaxis, :]  # broadcast K along time axis
    numerator   = dT + r * K2d * dK
    denominator = 0.5 * K2d ** 2 * d2K

    # Clip to avoid sqrt of negative (numerical noise)
    sigma2 = np.where(np.abs(denominator) > 1e-12,
                      numerator / denominator, np.nan)
    return np.sqrt(np.clip(sigma2, 0, None))

# In practice: build (T,K) grid from market quotes via spline interpolation
# then call this function. Local vol is then used in a PDE pricer.`,
    explanation: "Dupire's equation extracts the unique local vol surface consistent with all market option prices — no model assumptions beyond no-arbitrage and Ito diffusion. Numerical differentiation amplifies noise; use regularised cubic splines or SVI parametrisation on the input surface before applying finite differences."
  },
  {
    id: "pyfin-20260801-b1-greeks-autodiff",
    language: "python",
    title: "Option Greeks via JAX Automatic Differentiation",
    tag: "finance",
    code: `import jax
import jax.numpy as jnp
from jax.scipy.special import ndtr   # normal CDF

def bs_price(S: float, K: float, r: float, sigma: float, T: float) -> float:
    """Black-Scholes call price — differentiable via JAX."""
    d1 = (jnp.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * jnp.sqrt(T))
    d2 = d1 - sigma * jnp.sqrt(T)
    return S * ndtr(d1) - K * jnp.exp(-r * T) * ndtr(d2)

# First-order Greeks via grad
delta_fn = jax.jit(jax.grad(bs_price, argnums=0))  # dC/dS
vega_fn  = jax.jit(jax.grad(bs_price, argnums=3))  # dC/dsigma

# Gamma via second derivative (grad of grad)
gamma_fn = jax.jit(jax.grad(jax.grad(bs_price, argnums=0), argnums=0))

# Vanna = d2C/dS dsigma (cross derivative)
vanna_fn = jax.jit(jax.grad(jax.grad(bs_price, argnums=0), argnums=3))

if __name__ == "__main__":
    S, K, r, sig, T = 100.0, 100.0, 0.05, 0.2, 1.0
    print(f"Delta: {delta_fn(S, K, r, sig, T):.4f}")
    print(f"Gamma: {gamma_fn(S, K, r, sig, T):.6f}")
    print(f"Vega:  {vega_fn(S, K, r, sig, T):.4f}")`,
    explanation: "JAX's reverse-mode AD computes exact analytical Greeks at machine precision without deriving formulas manually. Vanna and volga (d2C/dsigma2) emerge 'for free' as higher-order derivatives — critical for volatility surface hedging strategies like vanna-volga pricing of exotics."
  },
  {
    id: "pyfin-20260801-b1-importance-sampling-mc",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def is_otm_call(S0: float, K: float, r: float, sigma: float, T: float,
                n_paths: int = 100_000, seed: int = 42) -> tuple[float, float]:
    """
    Importance sampling for deep OTM call (rare event).
    Shift drift mu* to centre the distribution at log(K/S0)/T.
    Returns (price, std_error).
    """
    rng  = np.random.default_rng(seed)
    mu   = r - 0.5 * sigma ** 2            # risk-neutral drift
    x_star = (np.log(K / S0) - mu * T) / (sigma * np.sqrt(T))  # target shift

    # Sample from N(x_star, 1) instead of N(0,1)
    Z   = rng.standard_normal(n_paths) + x_star
    S_T = S0 * np.exp(mu * T + sigma * np.sqrt(T) * Z)

    # Likelihood ratio (Radon-Nikodym derivative)
    lr  = np.exp(-x_star * Z + 0.5 * x_star ** 2)

    payoff = np.maximum(S_T - K, 0.0)
    weighted = np.exp(-r * T) * payoff * lr
    return weighted.mean(), weighted.std() / np.sqrt(n_paths)

if __name__ == "__main__":
    price, se = is_otm_call(100, 150, 0.05, 0.2, 1.0)
    print(f"IS price: {price:.6f} +/- {se:.6f}")`,
    explanation: "Standard MC wastes 99%+ of paths on zero payoff for deep OTM options. Exponential tilting shifts the sampling measure toward the region K>S_T; the likelihood ratio corrects for the change of measure. IS can reduce variance by 100x+ for 1-in-1000 events."
  },
  {
    id: "pyfin-20260801-b1-evt-var",
    language: "python",
    title: "Extreme Value Theory (EVT) Tail VaR / Expected Shortfall",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import curve_fit

def evt_es(losses: np.ndarray, threshold_quantile: float = 0.90,
           confidence: float = 0.99) -> tuple[float, float]:
    """
    Fit Generalised Pareto Distribution (GPD) to tail exceedances.
    Returns (VaR, ES) at given confidence level.
    """
    u = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u        # excess over threshold

    if len(exceedances) < 30:
        raise ValueError("Too few exceedances for reliable GPD fit")

    # MLE fit of GPD (xi=shape, scale=beta)
    xi, _, beta = genpareto.fit(exceedances, floc=0)

    # Fraction of observations above threshold
    n     = len(losses)
    n_u   = len(exceedances)
    p_exc = n_u / n

    # GPD quantile: VaR - u
    alpha = 1 - confidence
    q_exc = beta / xi * ((alpha / p_exc) ** (-xi) - 1) if xi != 0 \
            else -beta * np.log(alpha / p_exc)
    var   = u + q_exc

    # ES: E[L | L > VaR]
    es = (var + beta - xi * u) / (1 - xi) if xi < 1 else float("inf")
    return var, es

if __name__ == "__main__":
    rng = np.random.default_rng(0)
    losses = rng.standard_t(df=4, size=10_000)  # fat-tailed PnL
    var, es = evt_es(losses, 0.90, 0.99)
    print(f"99% VaR: {var:.3f}, ES: {es:.3f}")`,
    explanation: "GPD tail fitting via Peaks-over-Threshold is the gold standard for fat-tailed loss distributions where historical simulation understates tail risk. The shape parameter xi>0 indicates heavy tails (Pareto-like); xi<0 means bounded tail (Gumbel domain). Regulators accept EVT-based ES for IMA models under Basel III."
  },
  {
    id: "pyfin-20260801-b1-copula-portfolio",
    language: "python",
    title: "Gaussian Copula Portfolio Loss Simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_loss(pd_vec: np.ndarray, lgd: float, corr_rho: float,
                         n_paths: int = 100_000, seed: int = 42) -> np.ndarray:
    """
    Simulate portfolio losses under 1-factor Gaussian copula.
    pd_vec: default probabilities per obligor
    lgd: loss-given-default (homogeneous)
    corr_rho: asset correlation (square root = factor loading)
    Returns array of portfolio loss fractions.
    """
    rng = np.random.default_rng(seed)
    n   = len(pd_vec)
    sqrt_rho = np.sqrt(corr_rho)
    sqrt_1mr = np.sqrt(1 - corr_rho)

    # Default thresholds in standard normal space
    thresh = norm.ppf(pd_vec)

    total_losses = np.empty(n_paths)
    for i in range(n_paths):
        M = rng.standard_normal()              # common market factor
        Z = sqrt_rho * M + sqrt_1mr * rng.standard_normal(n)
        defaults = Z < thresh                  # element-wise comparison
        total_losses[i] = lgd * defaults.sum() / n

    return total_losses

if __name__ == "__main__":
    pds = np.full(100, 0.01)  # 100 obligors, 1% PD each
    losses = gaussian_copula_loss(pds, 0.4, 0.2)
    print(f"Mean loss: {losses.mean():.4f}, 99.9th pctl: {np.percentile(losses, 99.9):.4f}")`,
    explanation: "The 1-factor Gaussian copula (Li 2000) drives all default correlations through a single market factor M. While famously misused for CDO pricing (it understates tail dependence), it remains the regulatory model for correlation trading. Vectorising the inner loop with batch M and Z eliminates the Python loop."
  },
  {
    id: "pyfin-20260801-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading (Dynamic Hedge Ratio)",
    tag: "finance",
    code: `import numpy as np

def kalman_pairs(y: np.ndarray, x: np.ndarray,
                 delta: float = 1e-5, ve: float = 0.001):
    """
    Track dynamic hedge ratio beta_t via Kalman filter.
    State: [beta_t, alpha_t] (slope and intercept)
    Observation: y_t = [x_t, 1] @ beta_t + noise
    delta: state noise variance (controls how fast beta adapts)
    ve: observation noise variance
    Returns: betas (n,2), spread (n,), e (n,) one-step errors
    """
    n  = len(y)
    R  = delta / (1 - delta) * np.eye(2)   # state covariance (process noise)
    H  = np.zeros((n, 2))
    H[:, 0] = x; H[:, 1] = 1.0            # observation matrix rows

    beta   = np.zeros((n, 2))             # state estimates
    P      = np.zeros((2, 2))             # state covariance
    e      = np.zeros(n)                   # one-step prediction errors

    for t in range(n):
        h  = H[t]                          # current obs row vector
        Kgain = P @ h / (h @ P @ h + ve)  # Kalman gain
        e[t]  = y[t] - h @ (beta[t-1] if t else np.zeros(2))
        beta[t] = (beta[t-1] if t else np.zeros(2)) + Kgain * e[t]
        P = (np.eye(2) - np.outer(Kgain, h)) @ P + R

    spread = y - (H * beta).sum(axis=1)
    return beta, spread, e`,
    explanation: "Time-varying hedge ratios captured by the Kalman filter outperform OLS regression in non-stationary pairs: delta controls the speed of adaptation (high delta = fast, noisy tracking; low delta = slow, smooth). The one-step error e is the trading signal — mean-reverting around zero when the pair is cointegrated."
  },
  {
    id: "pyfin-20260801-b1-regime-hmm",
    language: "python",
    title: "Hidden Markov Model for Market Regime Detection",
    tag: "finance",
    code: `import numpy as np

def baum_welch_2state(obs: np.ndarray, n_iter: int = 50,
                      seed: int = 42) -> dict:
    """
    Fit 2-state HMM to return series via Baum-Welch (EM).
    Returns transition matrix A, emission means/vars, state sequence.
    """
    rng = np.random.default_rng(seed)
    T   = len(obs)
    A   = rng.dirichlet([5, 1], size=2)    # init: prefer staying in state
    mu  = np.array([obs.mean() - obs.std(), obs.mean() + obs.std()])
    sig = np.array([obs.std(), obs.std() * 2])
    pi  = np.array([0.5, 0.5])

    def emission(s: int) -> np.ndarray:
        return np.exp(-0.5 * ((obs - mu[s]) / sig[s])**2) / (sig[s] * np.sqrt(2*np.pi))

    for _ in range(n_iter):
        B = np.column_stack([emission(0), emission(1)])  # (T, 2)
        # Forward pass
        alpha = np.zeros((T, 2))
        alpha[0] = pi * B[0]
        alpha[0] /= alpha[0].sum() + 1e-300
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            alpha[t] /= alpha[t].sum() + 1e-300
        # Backward pass
        beta = np.ones((T, 2))
        for t in range(T - 2, -1, -1):
            beta[t] = A @ (B[t+1] * beta[t+1])
            beta[t] /= beta[t].sum() + 1e-300
        # Gamma and xi
        gamma = alpha * beta; gamma /= gamma.sum(axis=1, keepdims=True)
        # M-step
        A   = (alpha[:-1, :, None] * A[None] * B[1:, None, :] * beta[1:, None, :]).sum(0)
        A  /= A.sum(axis=1, keepdims=True)
        mu  = (gamma * obs[:, None]).sum(0) / gamma.sum(0)
        sig = np.sqrt((gamma * (obs[:, None] - mu)**2).sum(0) / gamma.sum(0))
        pi  = gamma[0]

    states = gamma.argmax(axis=1)
    return {"A": A, "mu": mu, "sigma": sig, "states": states, "gamma": gamma}`,
    explanation: "Baum-Welch EM alternates between computing state responsibilities (E-step via forward-backward) and re-estimating parameters (M-step). The two states naturally capture bull/bear or low/high-vol regimes. Viterbi decoding (not shown) gives the most probable state sequence."
  },
  {
    id: "pyfin-20260801-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion: Fractional Kelly Position Sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(win_prob: float, win_odds: float,
                   loss_odds: float = 1.0) -> float:
    """
    Discrete Kelly for binary bets.
    f* = (p * win_odds - (1-p) * loss_odds) / (win_odds * loss_odds)
    """
    p = win_prob; q = 1 - p
    return (p * win_odds - q * loss_odds) / (win_odds * loss_odds)

def continuous_kelly(returns: np.ndarray, half_kelly: bool = True) -> float:
    """
    Kelly fraction for a distribution of returns via maximising E[log(1+f*r)].
    Uses numerical optimisation over leverage f in [0, 5].
    half_kelly: use f/2 to reduce variance (standard practice).
    """
    def neg_log_growth(f):
        log_wealth = np.log1p(f * returns)
        # Penalise ruin (log undefined if 1+f*r <= 0)
        if np.any(log_wealth == -np.inf): return 1e10
        return -log_wealth.mean()

    res = minimize_scalar(neg_log_growth, bounds=(0, 5), method="bounded")
    f   = res.x
    return f * 0.5 if half_kelly else f

if __name__ == "__main__":
    rng = np.random.default_rng(0)
    # Simulate daily returns with positive drift
    rets = rng.normal(0.001, 0.02, 1000)
    f    = continuous_kelly(rets)
    print(f"Half-Kelly leverage: {f:.2f}x")`,
    explanation: "Full Kelly maximises long-run log wealth but has enormous short-term drawdowns; half-Kelly squares the Sharpe ratio while halving the bet size, widely preferred in practice. The continuous formulation handles arbitrary return distributions including fat tails — just pass the empirical returns."
  },
  {
    id: "pyfin-20260801-b1-market-impact-model",
    language: "python",
    title: "Almgren-Chriss Market Impact and Optimal Execution",
    tag: "finance",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class ExecutionParams:
    X0: float      # initial position to liquidate
    T:  float      # time horizon
    N:  int        # number of trading periods
    eta: float     # temporary impact coefficient (linear)
    gamma: float   # permanent impact coefficient
    sigma: float   # price volatility
    lam: float     # risk-aversion parameter

def almgren_chriss_schedule(p: ExecutionParams) -> np.ndarray:
    """
    Almgren-Chriss (2001) optimal liquidation trajectory.
    Returns array of holdings X_j for j=0..N.
    """
    tau  = p.T / p.N            # period length
    kappa = np.sqrt(p.lam * p.sigma**2 / p.eta)
    sinh_kT = np.sinh(kappa * p.T)

    j = np.arange(p.N + 1)
    # Optimal holdings: X_j = X0 * sinh(kappa*(T-j*tau)) / sinh(kappa*T)
    X = p.X0 * np.sinh(kappa * (p.T - j * tau)) / (sinh_kT + 1e-12)
    return X

def expected_shortfall_ac(p: ExecutionParams, X: np.ndarray) -> float:
    """Expected implementation shortfall for the schedule X."""
    tau  = p.T / p.N
    trades = -np.diff(X)                # shares sold each period
    perm  = p.gamma * np.sum(trades**2)
    temp  = p.eta / tau * np.sum(trades**2)
    risk  = 0.5 * p.lam * p.sigma**2 * tau * np.sum(X[1:]**2)
    return perm + temp + risk

if __name__ == "__main__":
    params = ExecutionParams(1e6, 1.0, 10, 0.1, 0.01, 0.02, 1e-6)
    sched  = almgren_chriss_schedule(params)
    es     = expected_shortfall_ac(params, sched)
    print(f"Schedule: {sched[:5].astype(int)} ... ES: {es:.2f}")`,
    explanation: "Almgren-Chriss balances market impact cost (eta*trades^2) against execution risk (sigma^2 * remaining_position^2). Large lambda drives faster liquidation (impact-dominant); small lambda accepts slippage to reduce timing risk. This is the standard reference model for VWAP/TWAP benchmarking."
  },
  {
    id: "pyfin-20260801-b1-fama-french-factor",
    language: "python",
    title: "Fama-French 3-Factor Model Regression",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def fama_french_regression(portfolio_returns: pd.Series,
                            ff_factors: pd.DataFrame) -> dict:
    """
    Regress excess portfolio returns on FF3 factors.
    ff_factors columns: Mkt-RF, SMB, HML (all as fractions, not %)
    Returns alpha (annualised), betas, R2, t-stats.
    """
    y = portfolio_returns.values
    X = ff_factors[["Mkt-RF", "SMB", "HML"]].values

    # OLS with intercept = alpha
    reg = LinearRegression().fit(X, y)
    y_hat = reg.predict(X)
    resid = y - y_hat
    n, k  = X.shape

    # Coefficient standard errors via OLS variance formula
    rss     = np.sum(resid**2)
    sigma2  = rss / (n - k - 1)
    # X_aug = [1, X] for intercept
    X_aug   = np.column_stack([np.ones(n), X])
    cov_b   = sigma2 * np.linalg.inv(X_aug.T @ X_aug)
    se      = np.sqrt(np.diag(cov_b))

    params  = np.concatenate([[reg.intercept_], reg.coef_])
    t_stats = params / se
    r2      = reg.score(X, y)
    alpha_annualised = reg.intercept_ * 252   # daily -> annual

    return {
        "alpha": alpha_annualised,
        "beta_mkt": reg.coef_[0],
        "beta_smb": reg.coef_[1],
        "beta_hml": reg.coef_[2],
        "t_stats": dict(zip(["alpha","Mkt","SMB","HML"], t_stats)),
        "R2": r2,
    }`,
    explanation: "FF3 decomposes alpha by controlling for market, size (SMB), and value (HML) exposures. OLS t-stats on factor loadings test whether a manager has genuine market-beating skill versus mechanical factor tilts. Extending to FF5 adds profitability (RMW) and investment (CMA) factors."
  },
  {
    id: "pyfin-20260801-b1-pca-yield-curve",
    language: "python",
    title: "PCA Decomposition of Yield Curve Moves",
    tag: "finance",
    code: `import numpy as np
from sklearn.preprocessing import StandardScaler

def yield_curve_pca(rate_changes: np.ndarray, n_components: int = 3):
    """
    rate_changes: (T, M) matrix — daily changes in M yields across T days.
    Returns PCA components, eigenvalues, and explained variance.
    PC1 ≈ parallel shift, PC2 ≈ slope, PC3 ≈ curvature.
    """
    scaler = StandardScaler(with_std=False)   # de-mean only, keep vol info
    X = scaler.fit_transform(rate_changes)

    # Covariance matrix (M x M)
    cov = X.T @ X / (len(X) - 1)

    # Eigen-decomposition (sorted descending)
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues  = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    # Project onto top-k components
    components  = eigenvectors[:, :n_components]   # shape (M, k)
    scores      = X @ components                   # shape (T, k)
    explained   = eigenvalues[:n_components] / eigenvalues.sum()

    return {
        "components": components,   # loadings (M, k)
        "scores": scores,           # factor realisations (T, k)
        "explained_variance_ratio": explained,
        "eigenvalues": eigenvalues[:n_components],
    }

if __name__ == "__main__":
    rng = np.random.default_rng(0)
    changes = rng.standard_normal((500, 10))  # 500 days, 10 tenors
    result  = yield_curve_pca(changes)
    print("Explained variance:", result["explained_variance_ratio"].round(3))`,
    explanation: "PC1 of yield curves historically explains ~85% of variance (parallel shift), PC2 ~10% (slope twist), PC3 ~3% (butterfly). These 3 factors form the basis of DV01, DV02, and PCA-hedged duration trades. Risk managers use PC exposures instead of individual tenor DV01s for more efficient hedging."
  },
  {
    id: "pyfin-20260801-b1-var-parametric",
    language: "python",
    title: "Parametric VaR: Delta-Normal and Delta-Gamma",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, chi2

def delta_normal_var(weights: np.ndarray, mu: np.ndarray,
                     cov: np.ndarray, confidence: float = 0.99,
                     horizon: int = 1) -> float:
    """
    Delta-normal portfolio VaR (linear, Gaussian returns).
    weights: position weights, mu: daily expected returns, cov: covariance matrix.
    Returns VaR (positive number = potential loss).
    """
    port_mu   = weights @ mu * horizon
    port_var  = weights @ cov @ weights * horizon
    port_std  = np.sqrt(port_var)
    z         = norm.ppf(1 - confidence)
    return -(port_mu + z * port_std)   # VaR = negative tail quantile

def delta_gamma_var_cornish_fisher(port_delta: float, port_gamma: float,
                                    sigma: float, confidence: float = 0.99) -> float:
    """
    Delta-gamma VaR via Cornish-Fisher expansion.
    port_delta, port_gamma: sensitivities to underlying price move dS~N(0,sigma^2)
    """
    # Portfolio PnL ~ delta*dS + 0.5*gamma*dS^2
    z_a = norm.ppf(confidence)
    # Cornish-Fisher: zeta ≈ z + (z^2-1)*skew/6 + (z^3-3z)*kurt/24
    skewness = port_gamma * sigma**2 / (port_delta * sigma)  # approximate
    kurtosis = 0.0   # assume normal for quadratic correction
    z_cf = z_a + (z_a**2 - 1) * skewness / 6
    return -(port_delta * sigma * z_cf + 0.5 * port_gamma * sigma**2)

if __name__ == "__main__":
    w   = np.array([0.4, 0.3, 0.3])
    mu  = np.array([0.001, 0.0008, 0.0012])
    cov = np.diag([0.0004, 0.0009, 0.0016]) + 0.0001  # add correlation
    print(f"Delta-Normal 99% VaR: {delta_normal_var(w, mu, cov):.4f}")`,
    explanation: "Delta-normal VaR assumes Gaussian returns and is O(n^2) via covariance matrix — the standard for linear equity portfolios. Delta-gamma adds a convexity correction for options books; the Cornish-Fisher expansion adjusts for skewness/kurtosis introduced by the quadratic payoff without full MC."
  },
  {
    id: "pyfin-20260801-b1-vectorbt-backtest",
    language: "python",
    title: "Vectorised Backtest Engine (vectorbt-style)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def vectorised_backtest(prices: pd.Series, signals: pd.Series,
                         slippage_bps: float = 5.0,
                         commission_bps: float = 2.0) -> pd.DataFrame:
    """
    Vectorised backtest: signal is target position (-1, 0, +1).
    Slippage and commission applied on each trade.
    Returns DataFrame with portfolio value, returns, and position.
    """
    slippage = slippage_bps / 10_000
    comm     = commission_bps / 10_000

    pos   = signals.shift(1).fillna(0)   # execute on next open
    rets  = prices.pct_change().fillna(0)
    trade = pos.diff().abs()             # absolute position change

    # Gross return from position
    gross = pos * rets
    # Transaction costs applied on each trade
    costs = trade * (slippage + comm)

    net_rets  = gross - costs
    cum_value = (1 + net_rets).cumprod()

    # Performance stats
    ann_ret   = cum_value.iloc[-1] ** (252 / len(cum_value)) - 1
    ann_vol   = net_rets.std() * np.sqrt(252)
    sharpe    = ann_ret / ann_vol if ann_vol > 0 else 0
    max_dd    = (cum_value / cum_value.cummax() - 1).min()

    return pd.DataFrame({
        "position": pos, "net_return": net_rets,
        "portfolio_value": cum_value,
    }).assign(
        annual_return=ann_ret, annual_vol=ann_vol,
        sharpe=sharpe, max_drawdown=max_dd
    )`,
    explanation: "Fully vectorised backtest avoids Python loops: pos.shift(1) introduces realistic execution lag, .diff().abs() computes trade sizes without iteration. Slippage and commission are proportional to trade size — critical for small-cap or illiquid strategies where turnover dominates alpha."
  },
  {
    id: "pyfin-20260801-b1-garch-fit",
    language: "python",
    title: "GARCH(1,1) Maximum Likelihood Estimation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_log_likelihood(params: np.ndarray, returns: np.ndarray) -> float:
    """Negative log-likelihood for GARCH(1,1)."""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10
    T   = len(returns)
    h   = np.empty(T)
    h[0] = np.var(returns)
    for t in range(1, T):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]
    log_L = -0.5 * np.sum(np.log(2 * np.pi * h) + returns**2 / h)
    return -log_L

def fit_garch11(returns: np.ndarray) -> dict:
    """Fit GARCH(1,1) via MLE. Returns omega, alpha, beta, AIC."""
    var0 = np.var(returns)
    x0   = [var0 * 0.1, 0.1, 0.8]
    bounds = [(1e-8, None), (1e-6, 0.999), (1e-6, 0.999)]
    res = minimize(garch_log_likelihood, x0, args=(returns,),
                   method="L-BFGS-B", bounds=bounds)
    omega, alpha, beta = res.x
    ll   = -res.fun
    aic  = 2 * 3 - 2 * ll
    return {"omega": omega, "alpha": alpha, "beta": beta,
            "persistence": alpha + beta, "AIC": aic}

if __name__ == "__main__":
    rng  = np.random.default_rng(0)
    rets = rng.standard_t(df=5, size=2000) * 0.01
    p    = fit_garch11(rets)
    print(f"GARCH(1,1): omega={p['omega']:.6f} alpha={p['alpha']:.3f} "
          f"beta={p['beta']:.3f} persistence={p['persistence']:.3f}")`,
    explanation: "GARCH(1,1) variance persistence (alpha+beta) near 1 means volatility shocks decay slowly — matching equity market stylised facts. MLE is the gold standard estimator; alpha+beta>=1 is enforced as a hard constraint because integrated GARCH (unit root in variance) breaks stationarity."
  },
  {
    id: "pyfin-20260801-b1-multi-index-pandas",
    language: "python",
    title: "MultiIndex Pandas for Cross-Sectional Factor Returns",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

def build_factor_panel(tickers: list, dates: pd.DatetimeIndex,
                        seed: int = 42) -> pd.DataFrame:
    """
    Build a (date, ticker) MultiIndex DataFrame with factor exposures.
    """
    rng = np.random.default_rng(seed)
    idx = pd.MultiIndex.from_product([dates, tickers], names=["date", "ticker"])
    df  = pd.DataFrame({
        "return":   rng.normal(0.0, 0.01, len(idx)),
        "momentum": rng.normal(0.0, 1.0, len(idx)),
        "value":    rng.normal(0.0, 1.0, len(idx)),
        "size":     rng.normal(0.0, 1.0, len(idx)),
    }, index=idx)
    return df

def cross_sectional_ic(panel: pd.DataFrame) -> pd.DataFrame:
    """Compute cross-sectional rank IC (Spearman) per date."""
    def date_ic(grp):
        return grp[["momentum","value","size"]].corrwith(
            grp["return"], method="spearman")
    return panel.groupby("date").apply(date_ic)

if __name__ == "__main__":
    dates   = pd.date_range("2025-01-01", periods=60, freq="B")
    tickers = [f"STK{i:03d}" for i in range(200)]
    panel   = build_factor_panel(tickers, dates)
    ic      = cross_sectional_ic(panel)
    print("Mean IC per factor:\n", ic.mean().round(4))`,
    explanation: "MultiIndex panels with (date, ticker) indexing are the standard structure for cross-sectional factor research. groupby('date').apply() naturally implements Fama-MacBeth cross-sectional regressions or IC calculations without any explicit loops over dates."
  },
  {
    id: "pyfin-20260801-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Interest Rate Tree Calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_calibrate(market_prices: np.ndarray, coupons: np.ndarray,
                  vol_estimates: np.ndarray, dt: float = 1.0) -> np.ndarray:
    """
    Simplified BDT tree calibration to match zero-coupon bond prices.
    market_prices: P(0,T) for T=1..N
    vol_estimates: sigma_t for each period
    Returns the short-rate tree (lower node rates) r[t] for t=0..N-1.
    """
    N    = len(market_prices)
    r    = np.zeros(N)  # r[t] = base rate at time t (lower node)

    # Period 0: match 1-period bond
    def price_bond(r0):
        return np.exp(-r0 * dt) - market_prices[0]
    r[0] = brentq(price_bond, 0.0001, 0.5)

    # Subsequent periods: match multi-period bond prices
    for t in range(1, N):
        sigma = vol_estimates[t - 1]

        def node_price_tree(rd):
            # Build t+1-period tree with base rate rd, vol sigma
            rates = np.array([rd * np.exp(2 * sigma * k) for k in range(t + 1)])
            # Price backward: Arrow-Debreu prices would be more elegant but
            # here we use direct discounting for clarity
            V = np.exp(-rates * dt)  # terminal node values = 1 year bond
            for step in range(t):
                V = 0.5 * (V[:-1] + V[1:]) * np.exp(-rates[:-t + step] * dt)
            return V[0] - market_prices[t]

        # Bracket: rough range for base rate
        try:
            r[t] = brentq(node_price_tree, 0.0001, 0.5, xtol=1e-8)
        except ValueError:
            r[t] = r[t - 1]  # fallback: carry previous rate
    return r`,
    explanation: "BDT calibrates a recombining binomial short-rate tree to match both the term structure and volatility structure. The log-normal assumption ensures non-negative rates; nodes at time t are r_low * exp(2*sigma*k). Unlike Hull-White, BDT has no closed-form for theta — hence the bootstrap brentq per maturity."
  },
];
