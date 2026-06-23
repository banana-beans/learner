import type { Snippet } from "./types";

export const pythonFinanceSnippets20260623B1: Snippet[] = [
  {
    id: "pyfin-20260623-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel term structure model calibration",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tau: np.ndarray, beta0: float, beta1: float,
                   beta2: float, lam: float) -> np.ndarray:
    """
    Nelson-Siegel (1987) zero rate curve:
    y(tau) = beta0 + beta1*(1-e^{-lam*tau})/(lam*tau)
           + beta2*((1-e^{-lam*tau})/(lam*tau) - e^{-lam*tau})

    beta0: long-run level
    beta1: short-term component (slope)
    beta2: medium-term hump (curvature)
    lam:   decay rate (controls where hump peaks)
    """
    lt = lam * tau
    load1 = (1.0 - np.exp(-lt)) / lt
    load2 = load1 - np.exp(-lt)
    return beta0 + beta1 * load1 + beta2 * load2

def fit_nelson_siegel(tenors: np.ndarray, zero_rates: np.ndarray) -> dict:
    """Calibrate NS parameters by minimising sum-of-squared errors."""
    def sse(params):
        b0, b1, b2, lam = params
        if lam <= 0:
            return 1e10
        fitted = nelson_siegel(tenors, b0, b1, b2, lam)
        return float(np.sum((fitted - zero_rates)**2))

    # Initial guess: level=mean rate, slope = short-long spread, hump=0
    r_mean = float(zero_rates.mean())
    x0 = [r_mean, zero_rates[0] - r_mean, 0.0, 1.0]

    res = minimize(sse, x0, method='Nelder-Mead',
                   options={'xatol': 1e-9, 'fatol': 1e-12, 'maxiter': 10000})

    b0, b1, b2, lam = res.x
    fitted = nelson_siegel(tenors, b0, b1, b2, lam)

    return {
        'beta0': b0, 'beta1': b1, 'beta2': b2, 'lambda': lam,
        'fitted_rates': fitted,
        'rmse_bps': float(np.sqrt(np.mean((fitted - zero_rates)**2)) * 10000),
        'hump_tenor': np.log(1.0 + 1.0/lam) / lam if lam > 0 else np.inf,
    }`,
    explanation: "The Nelson-Siegel model decomposes the yield curve into three orthogonal factors — level (beta0), slope (beta1), and curvature (beta2) — which correspond to the PC1/PC2/PC3 factors from a PCA of historical yield curves; the lambda parameter controls where the hump peaks (typically 2-3 years for most G10 curves), and the model can price any tenor from overnight to 30+ years with 4 parameters.",
  },
  {
    id: "pyfin-20260623-b1-svensson",
    language: "python",
    title: "Svensson term structure extension with second hump",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import differential_evolution

def svensson(tau: np.ndarray, beta0: float, beta1: float,
              beta2: float, beta3: float,
              lam1: float, lam2: float) -> np.ndarray:
    """
    Svensson (1994) extension of Nelson-Siegel with a second curvature term.
    Used by the ECB, Fed, and many central banks for official yield curve publication.
    y(tau) = NS(beta0, beta1, beta2, lam1) + beta3 * load2(lam2)
    """
    def loads(lam: float) -> tuple[np.ndarray, np.ndarray]:
        lt    = lam * tau
        load1 = (1.0 - np.exp(-lt)) / lt
        load2 = load1 - np.exp(-lt)
        return load1, load2

    l1_1, l1_2 = loads(lam1)
    _,    l2_2 = loads(lam2)

    return beta0 + beta1*l1_1 + beta2*l1_2 + beta3*l2_2

def fit_svensson(tenors: np.ndarray, zero_rates: np.ndarray) -> dict:
    """
    Fit Svensson using differential evolution (global optimizer) to avoid
    local minima — the 6-parameter surface has many local optima.
    """
    def sse(params):
        b0, b1, b2, b3, l1, l2 = params
        if l1 <= 0 or l2 <= 0 or abs(l1 - l2) < 0.01:
            return 1e10
        fitted = svensson(tenors, b0, b1, b2, b3, l1, l2)
        return float(np.sum((fitted - zero_rates)**2))

    r0 = float(zero_rates.mean())
    bounds = [
        (r0*0.5, r0*1.5),  # beta0
        (-0.05, 0.05),      # beta1
        (-0.05, 0.05),      # beta2
        (-0.05, 0.05),      # beta3
        (0.1, 5.0),         # lam1
        (0.1, 5.0),         # lam2
    ]
    res = differential_evolution(sse, bounds, seed=42, maxiter=2000,
                                  tol=1e-10, polish=True)
    b0, b1, b2, b3, l1, l2 = res.x
    fitted = svensson(tenors, b0, b1, b2, b3, l1, l2)

    return {
        'params': dict(beta0=b0, beta1=b1, beta2=b2, beta3=b3, lam1=l1, lam2=l2),
        'fitted_rates': fitted,
        'rmse_bps': float(np.sqrt(np.mean((fitted - zero_rates)**2)) * 10000),
    }`,
    explanation: "The Svensson extension adds a second curvature term beta3 with its own decay rate lam2, allowing the model to fit yield curves with two humps (common for EUR curves with central bank forward guidance); differential evolution is preferred over gradient descent for Svensson calibration because the 6-dimensional loss surface has many local minima that trap quasi-Newton methods.",
  },
  {
    id: "pyfin-20260623-b1-cds-hazard",
    language: "python",
    title: "CDS spread pricing via constant hazard rate model",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_price(hazard: float, recovery: float, discount_factors: np.ndarray,
               tenors: np.ndarray, coupon: float = 0.01) -> float:
    """
    CDS par spread (coupon) that makes NPV = 0.
    Hazard rate: lambda (constant), survival prob: S(t) = exp(-lambda*t).
    Premium leg PV  = sum_i coupon * tau_i * df_i * S(t_i)
    Default leg PV  = (1 - R) * sum_i df_i * (S(t_{i-1}) - S(t_i))
    NPV = Default leg - Premium leg
    """
    n = len(tenors)
    S = np.exp(-hazard * tenors)     # survival probability at each tenor

    # Coupon payment coverages
    tau = np.diff(np.concatenate([[0.0], tenors]))

    premium_leg = float(np.sum(coupon * tau * discount_factors * S))
    default_leg = float((1.0 - recovery) *
                        np.sum(discount_factors * np.diff(np.concatenate([[1.0], S]) * -1) ))
    return default_leg - premium_leg

def cds_par_spread(hazard: float, recovery: float,
                    discount_factors: np.ndarray, tenors: np.ndarray) -> float:
    """Par spread: coupon that sets NPV = 0."""
    S   = np.exp(-hazard * tenors)
    tau = np.diff(np.concatenate([[0.0], tenors]))

    annuity    = float(np.sum(tau * discount_factors * S))
    default_pv = float((1.0 - recovery) *
                       np.sum(discount_factors * (-np.diff(np.concatenate([[1.0], S])))))
    return default_pv / annuity if annuity > 0 else 0.0

def implied_hazard_rate(market_spread: float, recovery: float,
                         discount_factors: np.ndarray, tenors: np.ndarray) -> float:
    """Bootstrap implied constant hazard rate from market CDS spread."""
    def obj(h):
        return cds_par_spread(h, recovery, discount_factors, tenors) - market_spread
    return brentq(obj, 1e-6, 5.0, xtol=1e-8)`,
    explanation: "The constant hazard rate model is the credit analogue of the flat yield curve assumption — it produces a closed-form par spread formula where the default leg is the expected loss discounted at risk-free rates and the premium leg is the coupon stream weighted by survival probabilities; the implied hazard rate from a 5Y CDS spread directly gives the risk-neutral annualised default probability as 1-exp(-lambda*T).",
  },
  {
    id: "pyfin-20260623-b1-heston-exact",
    language: "python",
    title: "Heston model: exact simulation using QE scheme (Andersen 2008)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import ncx2

def heston_qe(S0: float, K: float, r: float,
               v0: float, kappa: float, theta: float,
               sigma: float, rho: float, T: float,
               n_steps: int = 50, n_paths: int = 50000,
               seed: int = 0) -> dict:
    """
    Andersen (2008) Quadratic Exponential (QE) scheme for Heston variance process.
    Much more accurate than Euler for coarse time steps: matches distribution exactly
    by switching between exponential and quadratic sampling based on moment ratio.

    For each variance step:
    - Compute E[v_{t+dt}|v_t] and Var[v_{t+dt}|v_t] analytically.
    - If psi = Var/E^2 < psi_crit: sample from quadratic gaussian.
    - Otherwise: sample from exponential (mixture) distribution.
    """
    rng   = np.random.default_rng(seed)
    dt    = T / n_steps
    disc  = np.exp(-r * T)
    rho2  = np.sqrt(1.0 - rho**2)

    psi_crit = 1.5   # Andersen's recommended switching threshold
    e_kdt    = np.exp(-kappa * dt)
    c1       = sigma**2 * e_kdt * (1 - e_kdt) / kappa
    c2       = theta * sigma**2 * (1 - e_kdt)**2 / (2 * kappa)

    payoffs = np.zeros(n_paths)
    log_S   = np.full(n_paths, np.log(S0))
    v       = np.full(n_paths, v0)

    for _ in range(n_steps):
        # Conditional mean and variance of v_{t+dt}
        Ev  = v * e_kdt + theta * (1 - e_kdt)
        Vv  = v * c1 + c2
        psi = Vv / (Ev**2 + 1e-14)

        # QE sampling
        v_new = np.empty(n_paths)

        # Exponential branch (psi >= psi_crit): v ~ (1-p)*delta(0) + p*Exp(beta)
        mask_exp = psi >= psi_crit
        if mask_exp.any():
            Ev_e  = Ev[mask_exp];  Vv_e = Vv[mask_exp]; psi_e = psi[mask_exp]
            p     = (psi_e - 1.0) / (psi_e + 1.0)
            beta  = (1.0 - p) / Ev_e
            u     = rng.uniform(size=mask_exp.sum())
            v_new[mask_exp] = np.where(u > p, -np.log((1 - u) / (1 - p)) / beta, 0.0)

        # Quadratic gaussian branch (psi < psi_crit)
        mask_quad = ~mask_exp
        if mask_quad.any():
            Ev_q  = Ev[mask_quad];  Vv_q = Vv[mask_quad]; psi_q = psi[mask_quad]
            b2    = 2.0/psi_q - 1.0 + np.sqrt(2.0/psi_q*(2.0/psi_q - 1.0))
            a     = Ev_q / (1.0 + b2)
            Z     = rng.standard_normal(mask_quad.sum())
            v_new[mask_quad] = a * (np.sqrt(b2) + Z)**2

        # Log-stock update (exact conditional given v, v_new)
        z1 = rng.standard_normal(n_paths)
        log_S += ((r - 0.5 * v) * dt
                  + rho / sigma * (v_new - v - kappa * (theta - v) * dt)
                  + rho2 * np.sqrt(v * dt) * z1)
        v = v_new

    payoffs = np.maximum(np.exp(log_S) - K, 0.0)
    price   = disc * payoffs.mean()
    se      = disc * payoffs.std(ddof=1) / np.sqrt(n_paths)
    return {'price': price, 'se': se, '95ci': (price - 1.96*se, price + 1.96*se)}`,
    explanation: "The QE scheme avoids the negative-variance problem of Euler discretisation by sampling the variance directly from its true conditional distribution, switching between a quadratic-Gaussian and exponential approximation based on the coefficient of variation squared (psi); even with 50 steps QE matches the Heston closed-form price to <0.01%, while Euler requires hundreds of steps for the same accuracy at comparable parameter values.",
  },
  {
    id: "pyfin-20260623-b1-sabr-calib",
    language: "python",
    title: "SABR calibration to swaption vol smile (Hagan approximation)",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F: float, K: float, T: float, alpha: float,
              beta: float, rho: float, nu: float) -> float:
    """Hagan (2002) SABR implied vol. Returns Black vol sigma_B."""
    if abs(F - K) < 1e-8:
        # ATM formula
        FK_b   = F**(1.0 - beta)
        term1  = (1.0 - beta)**2 / 24.0 * alpha**2 / FK_b**2
        term2  = 0.25 * rho * beta * nu * alpha / FK_b
        term3  = (2.0 - 3.0*rho**2) / 24.0 * nu**2
        return alpha / FK_b * (1.0 + (term1 + term2 + term3) * T)

    log_FK = np.log(F / K)
    FK_b   = (F * K)**((1.0 - beta) / 2.0)
    z      = nu / alpha * FK_b * log_FK
    x_z    = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    numer1 = alpha
    numer2 = FK_b * (1 + (1-beta)**2/24 * log_FK**2
                      + (1-beta)**4/1920 * log_FK**4)
    numer3 = z / x_z if abs(x_z) > 1e-10 else 1.0

    denom_corr = 1.0 + ((1-beta)**2/24 * alpha**2/FK_b**2
                         + rho*beta*nu*alpha/(4*FK_b)
                         + (2-3*rho**2)/24 * nu**2) * T

    return numer1 / numer2 * numer3 * denom_corr

def fit_sabr(F: float, T: float, strikes: np.ndarray,
              market_vols: np.ndarray, beta: float = 0.5) -> dict:
    """
    Fit SABR alpha, rho, nu for fixed beta using least-squares.
    beta is typically fixed at 0.5 (lognormal-normal midpoint) or 1.0 (lognormal).
    """
    def sse(params):
        alpha, rho, nu = params
        if alpha <= 0 or abs(rho) >= 1 or nu <= 0:
            return 1e10
        vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
        return float(np.sum((vols - market_vols)**2))

    # Initial guess: alpha from ATM vol, rho from skew sign
    atm_idx   = np.argmin(np.abs(strikes - F))
    atm_vol   = market_vols[atm_idx]
    alpha0    = atm_vol * F**(1.0 - beta)
    x0 = [alpha0, -0.3, 0.5]

    res = minimize(sse, x0, method='Nelder-Mead',
                   options={'xatol': 1e-9, 'maxiter': 20000})
    alpha, rho, nu = res.x

    fitted = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes])
    return {
        'alpha': alpha, 'beta': beta, 'rho': rho, 'nu': nu,
        'fitted_vols': fitted,
        'rmse_bps': float(np.sqrt(np.mean((fitted - market_vols)**2)) * 10000),
    }`,
    explanation: "Fixing beta before calibration is standard practice because alpha and beta are not separately identifiable from a single smile slice — beta controls the ATMF backbone (how ATM vol scales with the forward) while rho controls skew and nu controls smile curvature; interest rate desks typically fix beta=0.5 for rates and calibrate (alpha, rho, nu) to the vol cube, with alpha recalibrated daily to match the ATM vol.",
  },
  {
    id: "pyfin-20260623-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter dynamic hedge ratio for statistical arbitrage",
    tag: "stat-arb",
    code: `import numpy as np
from dataclasses import dataclass, field

@dataclass
class KalmanFilter:
    """
    State-space model: y_t = beta_t * x_t + alpha_t + eps_t
    State [alpha, beta] evolves as a random walk:
    [alpha, beta]_t = [alpha, beta]_{t-1} + eta_t

    Tracks time-varying hedge ratio (beta) and intercept (alpha) for pairs trading.
    """
    # State: [alpha, beta]
    state: np.ndarray = field(default_factory=lambda: np.zeros(2))
    # State covariance
    P: np.ndarray = field(default_factory=lambda: np.eye(2) * 1.0)
    # Transition noise (state evolution variance)
    Q: np.ndarray = field(default_factory=lambda: np.eye(2) * 1e-4)
    # Observation noise variance
    R: float = 1e-2
    # History
    betas: list = field(default_factory=list)
    alphas: list = field(default_factory=list)
    spreads: list = field(default_factory=list)

    def update(self, y: float, x: float) -> float:
        """
        Update with new observation (y, x).
        Returns the current spread = y - (alpha + beta*x).
        """
        # Observation vector: H = [1, x]
        H = np.array([1.0, x])

        # Predict
        # State evolves as random walk: no transition matrix needed
        P_pred = self.P + self.Q

        # Innovation
        y_hat   = H @ self.state                # predicted y
        innov   = y - y_hat                      # innovation
        S_innov = H @ P_pred @ H + self.R       # innovation variance

        # Kalman gain
        K_gain  = P_pred @ H / S_innov

        # Update
        self.state = self.state + K_gain * innov
        self.P     = (np.eye(2) - np.outer(K_gain, H)) @ P_pred

        alpha, beta = self.state
        spread = y - (alpha + beta * x)
        self.alphas.append(alpha)
        self.betas.append(beta)
        self.spreads.append(spread)
        return spread

    def z_score(self, window: int = 20) -> float:
        """Normalise spread by its rolling std for entry/exit signals."""
        s = np.array(self.spreads[-window:])
        return (s[-1] - s.mean()) / (s.std() + 1e-10)`,
    explanation: "The Kalman filter dynamic hedge ratio is superior to a static OLS beta for pairs trading because it adapts to structural shifts in the relationship — when the cointegration relationship drifts, the Kalman state tracks it rather than requiring a rolling window re-estimation; the Q/R ratio controls the adaptation speed: high Q/R makes the filter responsive to regime changes but noisy, low Q/R gives smooth but slow estimates.",
  },
  {
    id: "pyfin-20260623-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model for bull/bear regime detection",
    tag: "time-series",
    code: `import numpy as np
from scipy.stats import norm

def hmm_baum_welch(returns: np.ndarray, n_states: int = 2,
                    n_iter: int = 100, seed: int = 0) -> dict:
    """
    Gaussian HMM trained by Baum-Welch (EM algorithm).
    Each state k has emission N(mu_k, sigma_k^2).
    Returns filtered state probabilities and Viterbi sequence.

    Returns:
        mu:     (K,) mean return per state
        sigma:  (K,) vol per state
        A:      (K, K) transition matrix
        gamma:  (T, K) posterior state probabilities
        states: (T,) Viterbi most-likely state sequence
    """
    rng = np.random.default_rng(seed)
    T   = len(returns)
    K   = n_states

    # Initialise: random partition
    mu    = np.array([returns.mean() - returns.std(), returns.mean() + returns.std()])[:K]
    sigma = np.full(K, returns.std())
    A     = np.full((K, K), 1.0/K)   # uniform transitions
    pi    = np.full(K, 1.0/K)        # initial state dist

    for _ in range(n_iter):
        # E-step: forward-backward algorithm
        # Emission probabilities B[t, k]
        B = np.column_stack([norm.pdf(returns, mu[k], sigma[k]) for k in range(K)])
        B = np.maximum(B, 1e-300)

        # Forward pass: alpha[t, k] = P(obs_1..t, state_t=k)
        alpha = np.zeros((T, K))
        alpha[0] = pi * B[0]
        alpha[0] /= alpha[0].sum()
        scales = np.zeros(T)
        scales[0] = alpha[0].sum() if alpha[0].sum() > 0 else 1.0

        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            sc = alpha[t].sum()
            if sc > 0:
                alpha[t] /= sc
            scales[t] = sc

        # Backward pass: beta[t, k] = P(obs_{t+1}..T | state_t=k)
        beta = np.ones((T, K))
        for t in range(T-2, -1, -1):
            beta[t] = A @ (B[t+1] * beta[t+1])
            sc = beta[t].sum()
            if sc > 0:
                beta[t] /= sc

        # Posterior
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True)

        # M-step
        mu    = (gamma * returns[:, None]).sum(axis=0) / gamma.sum(axis=0)
        sigma = np.sqrt((gamma * (returns[:, None] - mu)**2).sum(axis=0)
                        / gamma.sum(axis=0))
        sigma = np.maximum(sigma, 1e-6)
        # Transition matrix update
        xi = np.zeros((K, K))
        for t in range(T-1):
            xi_t = np.outer(alpha[t], beta[t+1] * B[t+1]) * A
            xi  += xi_t / (xi_t.sum() + 1e-300)
        A = xi / xi.sum(axis=1, keepdims=True)

    # Viterbi for most-likely state sequence
    delta = np.log(pi + 1e-300) + np.log(B[0] + 1e-300)
    psi   = np.zeros((T, K), dtype=int)
    for t in range(1, T):
        trans = delta[:, None] + np.log(A + 1e-300)
        psi[t] = trans.argmax(axis=0)
        delta  = trans.max(axis=0) + np.log(B[t] + 1e-300)
    states = np.zeros(T, dtype=int)
    states[-1] = delta.argmax()
    for t in range(T-2, -1, -1):
        states[t] = psi[t+1, states[t+1]]

    # Sort states by volatility (state 0 = low vol = bull)
    order = np.argsort(sigma)
    return {'mu': mu[order], 'sigma': sigma[order],
            'A': A[np.ix_(order, order)],
            'gamma': gamma[:, order], 'states': order[states]}`,
    explanation: "The Baum-Welch algorithm is EM applied to HMMs: the E-step computes gamma (state posteriors) and xi (transition posteriors) via the forward-backward algorithm, and the M-step updates parameters to maximise expected log-likelihood; the forward-backward scaling prevents numerical underflow for long sequences while preserving the ratio of alpha and beta required for gamma computation.",
  },
  {
    id: "pyfin-20260623-b1-evt-var",
    language: "python",
    title: "Extreme Value Theory (GPD) tail risk for VaR beyond 99%",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def evt_var(losses: np.ndarray, threshold_quantile: float = 0.90,
             alpha: float = 0.999) -> dict:
    """
    Peaks-over-Threshold (POT) method using Generalised Pareto Distribution.
    1. Choose threshold u = quantile(losses, threshold_quantile).
    2. Fit GPD to exceedances (losses - u | losses > u).
    3. Extrapolate VaR/ES beyond sample to very high confidence levels.

    Xi > 0: heavy-tailed (equity, credit)
    Xi = 0: exponential tail (normal distribution limit)
    Xi < 0: bounded tail (rare in finance)
    """
    u   = float(np.quantile(losses, threshold_quantile))
    exc = losses[losses > u] - u   # exceedances over threshold
    Nu  = len(exc)
    N   = len(losses)

    if Nu < 20:
        raise ValueError(f"Too few exceedances ({Nu}); lower threshold_quantile")

    # Fit GPD via MLE
    xi, loc, beta = genpareto.fit(exc, floc=0)

    # VaR beyond threshold via GPD quantile
    # VaR_alpha = u + (beta/xi) * [((N/Nu)*(1-alpha))^{-xi} - 1]
    p_exc = (1.0 - alpha) / (1.0 - threshold_quantile)   # tail probability above u

    if abs(xi) < 1e-6:
        # Exponential limit
        var_excess = beta * (-np.log(p_exc))
    else:
        var_excess = beta / xi * (p_exc**(-xi) - 1.0)

    VaR = u + var_excess

    # Expected Shortfall (CVaR)
    if xi < 1.0:
        ES = (VaR + beta - xi * u) / (1.0 - xi)
    else:
        ES = np.inf   # ES undefined for xi >= 1

    # Hill estimator for tail index comparison
    k_hill = max(int(Nu * 0.5), 5)
    sorted_exc = np.sort(exc)[::-1]
    xi_hill = float(np.mean(np.log(sorted_exc[:k_hill] / sorted_exc[k_hill])))

    return {
        'threshold': u, 'n_exceedances': Nu,
        'xi': xi, 'beta_gpd': beta,
        'VaR': VaR, 'ES': ES,
        'xi_hill': xi_hill,
        'threshold_quantile': threshold_quantile,
        'confidence': alpha,
    }`,
    explanation: "EVT provides the only statistically rigorous method for estimating VaR beyond the empirical data range — the Pickands-Balkema-de Haan theorem guarantees that exceedances over a sufficiently high threshold converge to the GPD regardless of the underlying distribution; the tail shape parameter xi is the key output: values around 0.3-0.5 for equity daily returns indicate heavy tails that make the normal VaR underestimate by a factor of 2-3x at the 99.9% level.",
  },
  {
    id: "pyfin-20260623-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula for multivariate VaR simulation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm, t as t_dist

def gaussian_copula_var(returns: np.ndarray, alpha: float = 0.99,
                          horizon: int = 1, n_sim: int = 100_000,
                          seed: int = 0) -> dict:
    """
    Gaussian copula VaR:
    1. Fit marginal CDFs empirically (or parametrically).
    2. Map to uniform via empirical CDF -> standard normal (Gaussian copula).
    3. Fit correlation matrix on transformed normals.
    4. Simulate correlated normals -> transform back via empirical inverse CDF.
    5. Portfolio VaR = quantile of simulated portfolio losses.

    returns: (T, n_assets) asset return matrix
    """
    rng    = np.random.default_rng(seed)
    T, n   = returns.shape

    # Step 1-2: Empirical CDF transform -> normal scores
    def to_normal(r: np.ndarray) -> np.ndarray:
        ranks = np.argsort(np.argsort(r)) + 1
        u     = ranks / (T + 1)   # uniform on (0,1)
        return norm.ppf(u)

    Z = np.column_stack([to_normal(returns[:, i]) for i in range(n)])

    # Step 3: Correlation on Gaussian-marginalised data
    R = np.corrcoef(Z.T)
    R = 0.5 * (R + R.T)   # symmetrise
    np.fill_diagonal(R, 1.0)

    # Cholesky factorisation
    try:
        L = np.linalg.cholesky(R)
    except np.linalg.LinAlgError:
        # Regularise if not PD
        eigvals, eigvecs = np.linalg.eigh(R)
        eigvals = np.maximum(eigvals, 1e-6)
        R = eigvecs @ np.diag(eigvals) @ eigvecs.T
        L = np.linalg.cholesky(R)

    # Step 4: Simulate scenarios
    Z_sim = rng.standard_normal((n_sim, n)) @ L.T
    U_sim = norm.cdf(Z_sim)   # uniform marginals

    # Map uniform back to return space via empirical quantile
    def from_uniform(u: np.ndarray, marginal: np.ndarray) -> np.ndarray:
        sorted_m = np.sort(marginal)
        indices  = np.clip((u * T).astype(int), 0, T - 1)
        return sorted_m[indices]

    sim_returns = np.column_stack([
        from_uniform(U_sim[:, i], returns[:, i]) for i in range(n)
    ]) * np.sqrt(horizon)

    # Equal-weight portfolio (modify for actual weights)
    port_returns = sim_returns.mean(axis=1)
    port_losses  = -port_returns

    VaR = float(np.quantile(port_losses, alpha))
    ES  = float(port_losses[port_losses >= VaR].mean())

    return {'VaR': VaR, 'ES': ES, 'corr_matrix': R,
            'n_scenarios': n_sim, 'confidence': alpha}`,
    explanation: "The Gaussian copula separates the marginal distributions (captured empirically) from the dependence structure (captured by the correlation matrix) — this matters because equity return marginals are fat-tailed while their rank correlation structure is well-approximated by a Gaussian copula; the infamous CDO pricing models failed not because they used a Gaussian copula but because they assumed the copula correlation parameters were stable through stress periods.",
  },
  {
    id: "pyfin-20260623-b1-multiindex-pd",
    language: "python",
    title: "Pandas multi-index for factor return attribution and portfolio drill-down",
    tag: "portfolio",
    code: `import pandas as pd
import numpy as np

def build_factor_panel(dates: list, sectors: list,
                        factors: list, n: int = 10) -> pd.DataFrame:
    """
    Build a multi-index DataFrame (date, sector) x factors for factor attribution.
    Demonstrates multi-index creation, reindexing, and grouped aggregation.
    """
    idx = pd.MultiIndex.from_product([dates, sectors],
                                      names=['date', 'sector'])
    data = np.random.randn(len(idx), len(factors)) * 0.01
    df   = pd.DataFrame(data, index=idx, columns=factors)
    return df

def factor_attribution(df: pd.DataFrame) -> dict:
    """
    Cross-sectional and time-series analysis using multi-index operations.
    """
    # Sector-level mean return per factor (across all dates)
    sector_means = df.groupby(level='sector').mean()

    # Date-level factor return (across all sectors, equal weight)
    date_means = df.groupby(level='date').mean()

    # Cumulative factor returns
    cum_factor  = (1.0 + date_means).cumprod() - 1.0

    # Rolling 20-day Sharpe ratio for each factor (over dates, within sectors)
    # Flatten date level for rolling ops
    factor_col  = date_means.columns[0]
    roll_sharpe = (date_means[factor_col].rolling(20)
                   .apply(lambda x: x.mean() / (x.std() + 1e-10) * np.sqrt(252)))

    # Cross-section std dev per date (dispersion of factor exposures)
    xsec_disp = df.groupby(level='date').std()

    # Select a specific (date, sector) combo via xs
    if len(df.index.get_level_values('date').unique()) > 0:
        first_date = df.index.get_level_values('date')[0]
        slice_df   = df.xs(first_date, level='date')

    # Stack/unstack: reshape to wide or long format
    df_wide = df.unstack(level='sector')   # sectors become columns (multi-col)
    df_long = df_wide.stack(level='sector')  # back to long

    return {
        'sector_means':   sector_means,
        'cum_factor':     cum_factor,
        'xsec_dispersion': xsec_disp,
        'roll_sharpe':    roll_sharpe,
    }

# Practical: compute information coefficient (IC) across sectors
def information_coefficient(signals: pd.DataFrame, returns: pd.DataFrame) -> pd.Series:
    """Rank IC: Spearman correlation of signal rank vs next-period return rank."""
    return signals.corrwith(returns, axis=1, method='spearman')`,
    explanation: "Multi-index DataFrames are the natural container for factor research because xs() selects a cross-section at one date in O(1), groupby(level='sector') aggregates across time without reshaping, and unstack() pivots sector from a row level to a column level for wide-format matrix operations — avoiding repeated merge/pivot steps that fragment performance on large panels.",
  },
  {
    id: "pyfin-20260623-b1-rolling-corr",
    language: "python",
    title: "Rolling correlation matrix and minimum spanning tree for risk clusters",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd
from scipy.sparse.csgraph import minimum_spanning_tree
from scipy.spatial.distance import squareform

def rolling_corr_matrix(returns: pd.DataFrame, window: int = 60) -> dict:
    """
    Compute rolling pairwise correlation matrices and extract:
    - Average pairwise correlation (market sentiment proxy)
    - Minimum spanning tree (financial network topology)
    - Effective number of assets (ENB = 1/sum(lambda_i/sum(lambda))^2)
    """
    n = returns.shape[1]

    # Rolling average correlation (single series)
    # Equal-weight portfolio contribution from off-diagonal elements
    avg_corr = []
    for i in range(window, len(returns) + 1):
        block = returns.iloc[i-window:i]
        C = block.corr().values
        # Average of upper triangle (excluding diagonal)
        mask = np.triu(np.ones((n, n), dtype=bool), k=1)
        avg_corr.append(float(C[mask].mean()))

    # Latest correlation matrix
    latest_corr = returns.iloc[-window:].corr().values

    # Distance matrix: d_ij = sqrt(2*(1 - rho_ij)) (Mantegna 1999)
    dist = np.sqrt(np.maximum(2.0 * (1.0 - latest_corr), 0.0))
    np.fill_diagonal(dist, 0.0)

    # Minimum spanning tree for network topology
    mst = minimum_spanning_tree(dist)
    mst_dense = mst.toarray()

    # Effective number of bets (Meucci 2009)
    eigvals = np.linalg.eigvalsh(latest_corr)
    eigvals = np.maximum(eigvals, 0.0)
    p       = eigvals / eigvals.sum()
    enb     = 1.0 / float((p**2).sum())

    return {
        'latest_corr':   latest_corr,
        'avg_corr_series': np.array(avg_corr),
        'current_avg_corr': avg_corr[-1] if avg_corr else np.nan,
        'mst_edges':     mst_dense,
        'dist_matrix':   dist,
        'enb':           enb,   # effective number of independent bets
    }`,
    explanation: "Average pairwise correlation spikes toward 1 during market stress (all assets sell together), making it a useful systemic risk indicator; the Mantegna distance metric converts correlations into a proper metric space, and the minimum spanning tree extracts the backbone dependency structure — high-degree nodes in the MST are systemically important assets whose idiosyncratic shocks propagate widely through the portfolio.",
  },
  {
    id: "pyfin-20260623-b1-implied-vol-nr",
    language: "python",
    title: "Newton-Raphson implied volatility solver with bracket fallback",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

def bs_call(S: float, K: float, r: float, sigma: float, T: float) -> float:
    if T <= 0 or sigma <= 0:
        return max(S - K * np.exp(-r * T), 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_vega(S: float, K: float, r: float, sigma: float, T: float) -> float:
    if T <= 0 or sigma <= 0:
        return 0.0
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return S * norm.pdf(d1) * np.sqrt(T)

def implied_vol(market_price: float, S: float, K: float, r: float, T: float,
                 tol: float = 1e-8, max_iter: int = 100) -> float:
    """
    Newton-Raphson solver for implied vol, with bisection fallback.
    Jaeckel (2015) bracket: vol in [near-zero, vol_max].
    """
    intrinsic = max(S - K * np.exp(-r * T), 0.0)
    if market_price <= intrinsic + 1e-10:
        return 0.0   # deep ITM: implied vol undefined or near zero

    # Check if market price exceeds max possible (S itself)
    if market_price >= S:
        raise ValueError("Market price exceeds forward price upper bound")

    sigma = 0.2   # starting guess (20% vol is near ATM for most equity)

    for i in range(max_iter):
        price = bs_call(S, K, r, sigma, T)
        vega  = bs_vega(S, K, r, sigma, T)

        error = price - market_price

        if abs(error) < tol:
            return sigma

        if vega < 1e-12:
            # Vega near zero: Newton step unstable, fall back to bisection
            break

        sigma -= error / vega                  # Newton step
        sigma  = max(1e-6, min(sigma, 10.0))   # clamp to sensible range

    # Fallback: Brent's method (guaranteed convergence)
    try:
        return brentq(
            lambda s: bs_call(S, K, r, s, T) - market_price,
            1e-6, 10.0, xtol=tol, maxiter=200
        )
    except ValueError:
        return float('nan')`,
    explanation: "Newton-Raphson converges in 3-5 iterations for near-ATM options because the BS price is smooth and vega is large, but it fails for deep OTM/ITM options where vega approaches zero and the step becomes numerically unstable — the bisection fallback via Brent's method guarantees convergence at the cost of ~50 function evaluations; Jaeckel's rational approximation provides a good starting sigma that typically avoids the fallback entirely.",
  },
  {
    id: "pyfin-20260623-b1-cvxpy-mvo",
    language: "python",
    title: "cvxpy mean-variance optimization with sector and turnover constraints",
    tag: "portfolio",
    code: `import numpy as np

def cvxpy_mvo(mu: np.ndarray, Sigma: np.ndarray,
               sector_map: np.ndarray, w_prev: np.ndarray,
               max_sector: float = 0.30, max_turnover: float = 0.20,
               risk_aversion: float = 1.0) -> dict:
    """
    Mean-variance optimization via cvxpy with realistic constraints:
    - Long-only (w >= 0)
    - Fully invested (sum(w) = 1)
    - Per-sector cap: sum of weights in each sector <= max_sector
    - Turnover limit: sum(|w - w_prev|) <= max_turnover
    - Objective: maximise mu'w - risk_aversion/2 * w'Sigma*w
    """
    try:
        import cvxpy as cp
    except ImportError:
        raise ImportError("pip install cvxpy")

    n       = len(mu)
    n_sec   = int(sector_map.max()) + 1
    w       = cp.Variable(n)

    # Objective
    ret  = mu @ w
    risk = cp.quad_form(w, Sigma)
    obj  = cp.Maximize(ret - 0.5 * risk_aversion * risk)

    # Constraints
    constraints = [
        w >= 0,
        cp.sum(w) == 1.0,
    ]

    # Sector concentration limits
    for s in range(n_sec):
        mask = (sector_map == s)
        if mask.any():
            constraints.append(cp.sum(w[mask]) <= max_sector)

    # Turnover constraint (L1 norm of trades)
    trades = w - w_prev
    constraints.append(cp.norm1(trades) <= max_turnover)

    prob = cp.Problem(obj, constraints)
    prob.solve(solver=cp.CLARABEL, verbose=False)

    if prob.status not in ('optimal', 'optimal_inaccurate'):
        return {'status': prob.status, 'weights': w_prev}

    w_opt = np.array(w.value)
    w_opt = np.maximum(w_opt, 0.0)   # numerical cleanup
    w_opt /= w_opt.sum()

    return {
        'status':    prob.status,
        'weights':   w_opt,
        'exp_ret':   float(mu @ w_opt),
        'port_vol':  float(np.sqrt(w_opt @ Sigma @ w_opt)),
        'turnover':  float(np.abs(w_opt - w_prev).sum()),
        'sharpe':    float(mu @ w_opt / np.sqrt(w_opt @ Sigma @ w_opt)),
    }`,
    explanation: "The turnover constraint is an L1 norm over the trade vector, which is convex and keeps the problem a QP that solvers like CLARABEL or OSQP handle efficiently; without a turnover constraint, the MVO rebalances aggressively and transaction costs can destroy the theoretical Sharpe improvement — empirically, constraining to 20% turnover per rebalance retains 80-90% of the unconstrained benefit.",
  },
  {
    id: "pyfin-20260623-b1-garch-rolling",
    language: "python",
    title: "GARCH(1,1) rolling forecast for options pricing vol input",
    tag: "time-series",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_fit(returns: np.ndarray) -> dict:
    """
    Fit GARCH(1,1): sigma2_t = omega + alpha*r_{t-1}^2 + beta*sigma2_{t-1}
    via maximum likelihood with Gaussian innovations.
    Constraint: alpha + beta < 1 (stationarity).
    """
    r = returns - returns.mean()
    n = len(r)

    def neg_loglik(params):
        omega, a, b = params
        if omega <= 1e-10 or a < 0 or b < 0 or a + b >= 1.0:
            return 1e10
        sigma2    = np.empty(n)
        sigma2[0] = np.var(r)
        for t in range(1, n):
            sigma2[t] = omega + a * r[t-1]**2 + b * sigma2[t-1]
        if np.any(sigma2 <= 0):
            return 1e10
        return float(0.5 * np.sum(np.log(sigma2) + r**2 / sigma2))

    var0 = float(np.var(r))
    x0   = [var0 * 0.05, 0.10, 0.85]

    res = minimize(neg_loglik, x0, method='L-BFGS-B',
                   bounds=[(1e-10, None), (1e-6, 0.999), (1e-6, 0.999)],
                   options={'ftol': 1e-12, 'maxiter': 2000})
    omega, a, b = res.x

    # Compute conditional variance path
    sigma2 = np.empty(n)
    sigma2[0] = var0
    for t in range(1, n):
        sigma2[t] = omega + a * r[t-1]**2 + b * sigma2[t-1]

    # h-step ahead forecast: sigma2_{T+h} = LR + (alpha+beta)^h * (sigma2_T - LR)
    LR      = omega / (1.0 - a - b)
    persistence = a + b
    forecasts   = {}
    sigma2_T    = sigma2[-1]
    for h in [1, 5, 21, 63]:   # 1d, 1w, 1m, 3m
        f_var = LR + persistence**h * (sigma2_T - LR)
        forecasts[h] = float(np.sqrt(f_var * 252))  # annualised vol

    return {
        'omega': omega, 'alpha': a, 'beta': b,
        'persistence': a + b,
        'long_run_var': LR,
        'long_run_vol': float(np.sqrt(LR * 252)),
        'current_vol':  float(np.sqrt(sigma2[-1] * 252)),
        'sigma2_path':  sigma2,
        'vol_forecasts_ann': forecasts,
    }`,
    explanation: "The GARCH(1,1) h-step ahead variance forecast reverts to the long-run variance at the exponential rate (alpha+beta)^h — when persistence is 0.99, the half-life is log(2)/log(1/0.99) ≈ 69 days, explaining why GARCH vol forecasts remain elevated for months after a spike; this is the standard input for options market-making desks when selecting vol for far-dated options where the current spot vol may not be representative.",
  },
  {
    id: "pyfin-20260623-b1-lasso-factors",
    language: "python",
    title: "LASSO regression for sparse factor selection in return attribution",
    tag: "factor-models",
    code: `import numpy as np
from sklearn.linear_model import LassoCV, Lasso
from sklearn.preprocessing import StandardScaler

def lasso_factor_selection(portfolio_returns: np.ndarray,
                             factor_returns: np.ndarray,
                             factor_names: list[str],
                             cv_folds: int = 5) -> dict:
    """
    LASSO with cross-validation for sparse factor model.
    Shrinks irrelevant factor betas to exactly zero (vs Ridge which shrinks but keeps all).
    Useful when factor library has 50+ factors and most are spurious.

    portfolio_returns: (T,)
    factor_returns:    (T, n_factors)
    """
    scaler = StandardScaler()
    X_sc   = scaler.fit_transform(factor_returns)

    # Cross-validated LASSO: selects regularisation strength lambda
    lasso_cv = LassoCV(cv=cv_folds, max_iter=10000,
                        alphas=np.logspace(-5, 0, 100), fit_intercept=True)
    lasso_cv.fit(X_sc, portfolio_returns)

    best_alpha = lasso_cv.alpha_
    betas_sc   = lasso_cv.coef_          # coefficients on standardised factors
    intercept  = lasso_cv.intercept_

    # Scale back to original factor units
    betas_orig = betas_sc / scaler.scale_

    # Selected factors (non-zero coefficients)
    selected_mask  = betas_orig != 0.0
    selected_names = [n for n, m in zip(factor_names, selected_mask) if m]

    # In-sample fit
    y_hat = lasso_cv.predict(X_sc)
    resid = portfolio_returns - y_hat
    ss_tot = float(np.sum((portfolio_returns - portfolio_returns.mean())**2))
    ss_res = float(resid @ resid)

    # Out-of-sample R^2 via cross-val
    from sklearn.model_selection import cross_val_score
    oos_r2 = float(cross_val_score(
        Lasso(alpha=best_alpha, max_iter=10000),
        X_sc, portfolio_returns, cv=cv_folds, scoring='r2'
    ).mean())

    return {
        'alpha':         best_alpha,
        'betas':         dict(zip(factor_names, betas_orig)),
        'intercept':     float(intercept),
        'selected':      selected_names,
        'n_selected':    int(selected_mask.sum()),
        'in_sample_r2':  1.0 - ss_res / ss_tot,
        'oos_r2':        oos_r2,
        'residual_vol':  float(resid.std(ddof=1) * np.sqrt(252)),
    }`,
    explanation: "LASSO's L1 penalty creates exact sparsity because the L1 constraint ball has corners that the solution tends to land on — unlike Ridge (L2) which shrinks all coefficients proportionally without zeroing any; for factor model selection with 100+ candidate factors, LASSO typically retains 5-15 factors with strong signals while eliminating correlated redundant factors that Ridge would distribute small loadings across.",
  },
  {
    id: "pyfin-20260623-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy (BDT) binomial short-rate tree",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(zero_rates: np.ndarray, vols: np.ndarray,
              dt: float = 1.0) -> dict:
    """
    Black-Derman-Toy (1990) binomial short-rate tree calibrated to
    market zero curve and volatility term structure.

    zero_rates: (n,) spot zero rates at t=1, 2, ..., n (annual)
    vols:       (n,) term vols for zero rates (annualised)
    dt:         time step in years (typically 1)

    BDT: r_{i, j+1} = r_{i, 0} * exp(2 * vol_i * sqrt(dt) * j)
    where r_{i,0} is calibrated to match the market ZCB price at each step.
    """
    n       = len(zero_rates)
    disc_mkt = np.exp(-zero_rates * np.arange(1, n+1) * dt)  # market ZCBs

    # Short-rate tree: r[t][j] for t = time step, j = up-move count (0..t)
    rate_tree = [None] * n
    zcb_tree  = [None] * n

    # Arrow-Debreu prices: Q[t][j] = time-0 value of $1 paid at (t, j)
    AD = [[1.0]]   # Q[0][0] = 1

    for i in range(n):
        vol_i = vols[i]
        # At step i, there are i+1 nodes (j = 0..i), r[j] = r_low * exp(2*vol*sqrt(dt)*j)
        def zcb_price(r_low):
            """ZCB P(0, i+1) implied by the tree with r_low at bottom."""
            rj  = r_low * np.exp(2.0 * vol_i * np.sqrt(dt) * np.arange(i+1))
            df  = np.exp(-rj * dt)
            # Use existing Arrow-Debreu prices for this step
            q   = np.array(AD[i])
            return float(0.5 * np.sum(q * df * 2))   # factor of 2: up and down

        # Calibrate r_low to match market ZCB(0, i+1)
        try:
            r_low = brentq(lambda r: zcb_price(r) - disc_mkt[i],
                            1e-6, 2.0, xtol=1e-10)
        except ValueError:
            r_low = zero_rates[i]   # fallback

        rj = r_low * np.exp(2.0 * vol_i * np.sqrt(dt) * np.arange(i+1))
        rate_tree[i] = rj

        # Update Arrow-Debreu prices for step i+1
        df  = np.exp(-rj * dt)
        q_i = np.array(AD[i])
        q_next = np.zeros(i + 2)
        for j in range(i + 1):
            q_next[j]   += 0.5 * q_i[j] * df[j]
            q_next[j+1] += 0.5 * q_i[j] * df[j]
        AD.append(q_next.tolist())

    return {
        'rate_tree':    rate_tree,
        'AD_prices':    AD,
        'calibrated_zcbs': [float(np.sum(AD[i])) for i in range(n)],
    }`,
    explanation: "The BDT tree is calibrated column-by-column: at each time step, brentq solves for the lowest node rate r_low that matches the market ZCB price, and the other nodes follow from the log-normal spacing r_low*exp(2*vol*sqrt(dt)*j); Arrow-Debreu prices (state prices) track the time-zero value of each node and allow efficient pricing of any derivative by backward induction without running a separate Monte Carlo.",
  },
  {
    id: "pyfin-20260623-b1-basket-pca",
    language: "python",
    title: "Basket option Monte Carlo with PCA variance reduction",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def basket_call_pca(S0: np.ndarray, weights: np.ndarray,
                     K: float, r: float, T: float,
                     Sigma: np.ndarray,
                     n_paths: int = 100_000, seed: int = 0) -> dict:
    """
    Basket call option MC using PCA decomposition of the covariance matrix.
    Variance reduction: price using top-K principal components for the control variate.

    S0:      (n,) initial prices
    weights: (n,) portfolio weights
    Sigma:   (n, n) annual covariance of log-returns
    """
    rng  = np.random.default_rng(seed)
    n    = len(S0)
    disc = np.exp(-r * T)

    # Cholesky of Sigma*T for correlated log-normal simulation
    C = np.linalg.cholesky(Sigma * T)

    # Full MC
    Z  = rng.standard_normal((n_paths, n))
    dW = Z @ C.T                                # (n_paths, n) correlated returns
    mu_vec = (r - 0.5 * np.diag(Sigma)) * T    # drift vector

    ST = S0 * np.exp(mu_vec + dW)              # (n_paths, n) terminal prices
    basket_T = ST @ weights                     # (n_paths,) basket value
    payoffs  = np.maximum(basket_T - K, 0.0)

    # PCA control variate: use top-1 PC to construct a correlated approximation
    # that has a known closed-form price under lognormal assumption
    eigvals, eigvecs = np.linalg.eigh(Sigma)
    order    = np.argsort(eigvals)[::-1]
    pc1_load = eigvecs[:, order[0]]             # top PC loading (n,)
    pc1_var  = eigvals[order[0]]                # variance of top PC

    # Approximation: basket ~ exp(mu_basket + sigma_approx * W1)
    mu_basket    = float(np.log(weights @ S0) + (r - 0.5 * float(weights @ np.diag(Sigma))) * T)
    sigma_approx = float(np.sqrt(float(weights @ Sigma @ weights) * T))

    # Closed-form log-normal approx price for control
    d1   = (mu_basket - np.log(K) + 0.5 * sigma_approx**2) / sigma_approx
    d2   = d1 - sigma_approx
    cf_price = disc * (np.exp(mu_basket + 0.5*sigma_approx**2) * norm.cdf(d1) - K*norm.cdf(d2))

    # Monte Carlo approx basket price (first order: log-normal)
    mc_approx = disc * np.maximum(S0.sum()*np.exp(mu_basket-np.log(weights@S0) + sigma_approx*(Z@pc1_load)/np.sqrt(n)) - K, 0.0).mean()

    mc_price = disc * payoffs.mean()
    mc_se    = disc * payoffs.std(ddof=1) / np.sqrt(n_paths)

    # CV-adjusted estimate
    beta       = 1.0
    cv_payoffs = payoffs - beta * (mc_approx - cf_price)
    cv_price   = disc * cv_payoffs.mean()
    cv_se      = disc * cv_payoffs.std(ddof=1) / np.sqrt(n_paths)

    return {
        'price_mc':    float(mc_price),
        'price_cv':    float(cv_price),
        'se_mc':       float(mc_se),
        'se_cv':       float(cv_se),
        'var_reduction': float((mc_se/cv_se)**2) if cv_se > 0 else 1.0,
    }`,
    explanation: "PCA control variates for basket options work because the basket P&L is dominated by its first principal component — the market factor — which under a log-normal approximation has a known closed-form price; the control variate correction adjusts for the difference between the exact MC simulation and the PC1 approximation, reducing variance in proportion to how much PC1 explains of total basket variance.",
  },
  {
    id: "pyfin-20260623-b1-brinson-attr",
    language: "python",
    title: "Brinson-Hood-Beebower (BHB) portfolio return attribution",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd
from dataclasses import dataclass

@dataclass
class BHBAttribution:
    """
    Brinson-Hood-Beebower (1986) three-effect return attribution:
    - Allocation effect:   (w_p - w_b) * (r_b_sector - r_b_total)
    - Selection effect:    w_b * (r_p_sector - r_b_sector)
    - Interaction effect:  (w_p - w_b) * (r_p_sector - r_b_sector)
    Total active return = sum of all three effects.
    """
    sectors: list[str]
    w_portfolio: np.ndarray    # (n_sectors,) portfolio weights
    w_benchmark: np.ndarray    # (n_sectors,) benchmark weights
    r_portfolio: np.ndarray    # (n_sectors,) portfolio sector returns
    r_benchmark: np.ndarray    # (n_sectors,) benchmark sector returns

    def decompose(self) -> pd.DataFrame:
        wp  = self.w_portfolio
        wb  = self.w_benchmark
        rp  = self.r_portfolio
        rb  = self.r_benchmark
        rb_total = float(wb @ rb)

        # Allocation: overweight/underweight sectors vs benchmark return
        alloc     = (wp - wb) * (rb - rb_total)

        # Selection: within each sector, portfolio vs benchmark return
        selection = wb * (rp - rb)

        # Interaction: combined effect of over/under-weighting AND outperforming
        interaction = (wp - wb) * (rp - rb)

        # Total active return
        total_active = float(wp @ rp) - float(wb @ rb)

        df = pd.DataFrame({
            'sector':       self.sectors,
            'w_portfolio':  wp,
            'w_benchmark':  wb,
            'r_portfolio':  rp,
            'r_benchmark':  rb,
            'allocation':   alloc,
            'selection':    selection,
            'interaction':  interaction,
            'total_effect': alloc + selection + interaction,
        })
        df.loc[len(df)] = ['TOTAL', wp.sum(), wb.sum(),
                            float(wp@rp), float(wb@rb),
                            alloc.sum(), selection.sum(),
                            interaction.sum(), total_active]
        return df

    def summary(self) -> dict:
        df = self.decompose()
        totals = df[df['sector'] == 'TOTAL'].iloc[0]
        return {
            'allocation_effect':   float(totals['allocation']),
            'selection_effect':    float(totals['selection']),
            'interaction_effect':  float(totals['interaction']),
            'total_active_return': float(totals['total_effect']),
        }`,
    explanation: "BHB attribution decomposes active return into three orthogonal effects: allocation (did the manager over/underweight the right sectors?), selection (did the manager pick the right stocks within each sector?), and interaction (did the manager add extra weight to sectors where they also had good stock picks?); the interaction term is often absorbed into selection in the Brinson-Fachler variant, which attributes all security-selection skill to the manager rather than the benchmark weight.",
  },
];
