import type { Snippet } from "./types";

export const pythonFinanceSnippets20260605B1: Snippet[] = [
  {
    id: "pyfin-20260605-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter pairs trading — dynamic hedge ratio estimation",
    tag: "finance",
    code: `import numpy as np

def kalman_pairs_filter(y: np.ndarray, x: np.ndarray,
                         delta: float = 1e-4,
                         Ve: float = 0.001) -> dict:
    """
    Estimate dynamic hedge ratio beta_t via Kalman filter.
    State: [beta_t, alpha_t]^T (hedge ratio + intercept).
    Observation model: y_t = x_t*beta_t + alpha_t + noise
    State evolution: beta_t = beta_{t-1} + v_t  (random walk)
    delta: system noise variance (controls adaptivity of beta).
    Ve:    observation noise variance.
    """
    n   = len(y)
    Vw  = delta / (1.0 - delta) * np.eye(2)   # process covariance
    beta = np.zeros((n, 2))   # [beta, alpha] through time
    P    = np.zeros((2, 2))   # state covariance

    # Initial state.
    beta[0] = [1.0, 0.0]

    for t in range(1, n):
        # Predict (F = identity random walk).
        P_pred   = P + Vw
        F_t      = np.array([x[t], 1.0])   # observation row

        # Innovation and Kalman gain.
        S_t      = float(F_t @ P_pred @ F_t) + Ve
        K_t      = P_pred @ F_t / S_t          # (2,) gain vector
        y_hat    = float(F_t @ beta[t-1])
        innov    = y[t] - y_hat

        # Update.
        beta[t]  = beta[t-1] + K_t * innov
        P        = (np.eye(2) - np.outer(K_t, F_t)) @ P_pred

    spread       = y - (beta[:, 0] * x + beta[:, 1])
    spread_std   = spread.std()
    z_score      = (spread - spread.mean()) / spread_std

    return {
        'beta':    beta[:, 0],    # dynamic hedge ratio
        'alpha':   beta[:, 1],    # dynamic intercept
        'spread':  spread,
        'z_score': z_score,
    }

np.random.seed(1)
n   = 500
x   = 100 + np.cumsum(np.random.randn(n))
# True beta drifts from 1.0 to 1.3 over the sample.
true_beta  = np.linspace(1.0, 1.3, n)
y          = true_beta * x + np.random.randn(n) * 2

result = kalman_pairs_filter(y, x, delta=1e-3)
print("Final beta estimate: ", round(result['beta'][-1], 4),
      "(true: 1.30)")
print("Z-score range: ",
      round(result['z_score'].min(), 2), "to",
      round(result['z_score'].max(), 2))`,
    explanation:
      "The Kalman filter treats the hedge ratio as a latent state that evolves as a random walk — unlike OLS which assumes a constant ratio. The delta parameter controls the process noise: small delta makes beta sticky (slow to adapt), large delta tracks structural breaks but increases noise. In practice, delta is calibrated via likelihood maximisation on in-sample data.",
  },
  {
    id: "pyfin-20260605-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel term structure — curve fitting and yield forecasting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def ns_yield(tau: np.ndarray, beta0: float, beta1: float,
             beta2: float, lam: float) -> np.ndarray:
    """
    Nelson-Siegel (1987) yield curve:
    y(tau) = beta0 + beta1*(1-exp(-tau/lam))/(tau/lam)
           + beta2*((1-exp(-tau/lam))/(tau/lam) - exp(-tau/lam))
    beta0: long-run level (slope of curve at tau->inf).
    beta1: short-run component (affects short end; <0 = upward sloping).
    beta2: medium-run hump (curvature).
    lam:   decay parameter (location of hump).
    """
    x   = tau / lam
    L   = (1 - np.exp(-x)) / x          # loading on beta1
    M   = L - np.exp(-x)                 # loading on beta2
    return beta0 + beta1 * L + beta2 * M

def fit_nelson_siegel(maturities: np.ndarray,
                       yields: np.ndarray) -> dict:
    """Fit NS curve to observed yields via non-linear least squares."""
    def objective(params):
        b0, b1, b2, lam = params
        if lam <= 0: return 1e10
        fitted = ns_yield(maturities, b0, b1, b2, lam)
        return np.sum((fitted - yields) ** 2)

    x0  = [yields[-1], yields[0]-yields[-1], 0.0, 2.0]
    res = minimize(objective, x0, method='Nelder-Mead',
                   options={'xatol': 1e-9, 'fatol': 1e-12, 'maxiter': 10000})
    b0, b1, b2, lam = res.x
    fitted = ns_yield(maturities, b0, b1, b2, lam)
    rmse   = np.sqrt(np.mean((fitted - yields) ** 2)) * 10000  # bps
    return {'beta0': round(b0, 5), 'beta1': round(b1, 5),
            'beta2': round(b2, 5), 'lambda': round(lam, 4),
            'RMSE_bps': round(rmse, 3), 'fitted': fitted}

# US Treasury par yields (approximate).
mats    = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields  = np.array([0.052, 0.051, 0.049, 0.045, 0.044,
                    0.043, 0.044, 0.045, 0.047, 0.046])

result = fit_nelson_siegel(mats, yields)
print("NS params:", {k: v for k, v in result.items() if k != 'fitted'})

# Interpolate missing maturities.
mats_fine = np.linspace(0.25, 30, 200)
curve     = ns_yield(mats_fine, result['beta0'], result['beta1'],
                      result['beta2'], result['lambda'])
print(f"1Y yield:  {curve[5]*100:.3f}%")
print(f"10Y yield: {curve[100]*100:.3f}%")`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into three orthogonal factors: level (beta0), slope (beta1), and curvature (beta2). The three factors also correspond to the dynamic factors in the Diebold-Li model for forecasting: level changes shift the whole curve, slope rotates it around the long end, and curvature shifts the belly relative to the wings. A RMSE under 2 bps indicates an excellent in-sample fit.",
  },
  {
    id: "pyfin-20260605-b1-svensson",
    language: "python",
    title: "Svensson (1994) yield curve — two-hump extension of Nelson-Siegel",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_yield(tau: np.ndarray, b0: float, b1: float, b2: float,
                    b3: float, lam1: float, lam2: float) -> np.ndarray:
    """
    Svensson 6-parameter extension of Nelson-Siegel.
    Adds a second curvature term (b3, lam2) to capture more complex shapes
    such as the double-hump in the USD curve around 2-5Y and 10Y.
    """
    x1 = tau / lam1
    x2 = tau / lam2
    L1 = (1 - np.exp(-x1)) / x1
    M1 = L1 - np.exp(-x1)
    L2 = (1 - np.exp(-x2)) / x2
    M2 = L2 - np.exp(-x2)
    return b0 + b1*L1 + b2*M1 + b3*M2

def fit_svensson(mats: np.ndarray, yields: np.ndarray) -> dict:
    def obj(p):
        b0, b1, b2, b3, l1, l2 = p
        if l1 <= 0 or l2 <= 0 or abs(l1 - l2) < 0.01: return 1e10
        return np.sum((svensson_yield(mats, b0, b1, b2, b3, l1, l2) - yields)**2)

    best, best_val = None, np.inf
    # Try multiple starting points (non-convex objective).
    for l1_init in [0.5, 1.5, 3.0]:
        for l2_init in [5.0, 8.0, 12.0]:
            x0 = [yields[-1], yields[0]-yields[-1], 0.1, 0.1, l1_init, l2_init]
            res = minimize(obj, x0, method='Nelder-Mead',
                           options={'maxiter': 20000, 'xatol': 1e-10})
            if res.fun < best_val:
                best_val, best = res.fun, res.x

    b0, b1, b2, b3, l1, l2 = best
    fitted = svensson_yield(mats, b0, b1, b2, b3, l1, l2)
    rmse   = np.sqrt(np.mean((fitted - yields)**2)) * 10000

    return {'params': {'b0': b0,'b1': b1,'b2': b2,'b3': b3,
                        'lam1': l1,'lam2': l2},
            'RMSE_bps': round(rmse, 4),
            'fitted': fitted}

mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.052, 0.051, 0.049, 0.045, 0.044,
                    0.043, 0.044, 0.045, 0.047, 0.046])

res = fit_svensson(mats, yields)
print("Svensson RMSE:", res['RMSE_bps'], "bps")
print("Params:", {k: round(v, 4) for k, v in res['params'].items()})`,
    explanation:
      "Svensson achieves sub-basis-point RMSE on most observed curves by allowing two independent hump locations (lam1, lam2). The Bundesbank and ECB use Svensson to publish official euro area yield curves. The non-convex objective requires multi-start optimisation: different (lam1, lam2) combinations can produce equally good fits with very different parameter values — a well-known identification problem.",
  },
  {
    id: "pyfin-20260605-b1-cds-hazard",
    language: "python",
    title: "CDS hazard rate bootstrap — survival curve from CDS spreads",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(
    maturities: list[float],   # e.g., [1, 2, 3, 5, 7, 10] in years
    cds_spreads: list[float],  # par CDS spreads in bps
    recovery: float = 0.40,
    discount_rates: list[float] = None,  # risk-free rates per maturity
    dt: float = 0.25           # quarterly accrual step
) -> dict:
    """
    Bootstraps piecewise-constant hazard rates from par CDS spreads.
    Par CDS condition: PV(protection leg) = PV(premium leg).
    Protection leg: (1-R) * sum_t df(t) * [Q(t-1) - Q(t)]
    Premium leg:    s * dt * sum_t df(t) * Q(t)
    """
    if discount_rates is None:
        discount_rates = [0.04] * len(maturities)

    lgd   = 1.0 - recovery
    times = np.arange(dt, maturities[-1] + dt, dt)  # all monitoring dates
    dfs   = np.exp(-np.interp(times,
                               maturities, discount_rates) * times)

    hazard_rates = []
    Q_prev       = np.ones(len(times))  # survival probabilities (start all 1)
    boundary_idx = 0

    for m_idx, (mat, s_bps) in enumerate(zip(maturities, cds_spreads)):
        s = s_bps / 10000.0
        # Find the index range for this maturity bucket.
        end_idx  = int(round(mat / dt))
        start_idx = 0 if m_idx == 0 else int(round(maturities[m_idx-1] / dt))

        def par_condition(h):
            # Survival probabilities in this maturity bucket.
            Q = Q_prev.copy()
            for i in range(start_idx, min(end_idx, len(Q))):
                Q[i] = Q[i-1] * np.exp(-h * dt) if i > 0 else np.exp(-h * dt)
            # PV of legs up to current maturity.
            prot = sum(dfs[i] * lgd * (Q[max(i-1,0)] - Q[i])
                       for i in range(min(end_idx, len(Q))))
            prem = sum(dfs[i] * s * dt * Q[i]
                       for i in range(min(end_idx, len(Q))))
            return prot - prem

        h_i = brentq(par_condition, 0.0001, 5.0)
        hazard_rates.append(h_i)

        # Update survival curve.
        for i in range(start_idx, min(end_idx, len(Q_prev))):
            Q_prev[i] = Q_prev[max(i-1, 0)] * np.exp(-h_i * dt)

    survival_at_mats = [float(np.exp(-sum(hazard_rates[:k+1]) * maturities[k]))
                         for k in range(len(maturities))]
    return {
        'maturities':    maturities,
        'hazard_rates':  [round(h*10000, 2) for h in hazard_rates],
        'survival':      [round(q, 5) for q in survival_at_mats],
    }

result = bootstrap_hazard_rates(
    maturities   = [1, 2, 3, 5, 7, 10],
    cds_spreads  = [50, 80, 100, 130, 150, 170],  # bps
    recovery     = 0.40
)
print("Hazard rates (bps/yr):", result['hazard_rates'])
print("Survival probs:        ", result['survival'])`,
    explanation:
      "CDS bootstrap iterates maturity by maturity: the hazard rate for each bucket is the unique value that prices the corresponding par CDS at zero NPV given the previously bootstrapped survival curve. The piecewise-constant assumption means the hazard rate is constant between tenor dates. In practice, quoting conventions (upfront + running) and accrual-on-default must be handled, but the par-CDS bootstrap conveys the core mechanics.",
  },
  {
    id: "pyfin-20260605-b1-sabr-python",
    language: "python",
    title: "SABR Hagan approximation — smile surface construction and calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """Hagan et al. (2002) SABR lognormal vol approximation."""
    if abs(F - K) < 1e-8:  # ATM
        FK_beta = F ** (1 - beta)
        term1   = alpha / FK_beta
        term2   = ((1-beta)**2/24 * alpha**2 / FK_beta**2
                   + 0.25*rho*beta*nu*alpha/FK_beta
                   + (2 - 3*rho**2)/24 * nu**2) * T
        return term1 * (1 + term2)

    logFK   = np.log(F / K)
    FK_beta = (F * K) ** (0.5 * (1 - beta))
    z       = nu / alpha * FK_beta * logFK
    chi     = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    if abs(chi) < 1e-10: chi = 1.0

    denom = FK_beta * (1 + (1-beta)**2/24 * logFK**2
                         + (1-beta)**4/1920 * logFK**4)
    A = alpha / denom * z / chi
    B = 1 + ((1-beta)**2/24 * alpha**2 / (F*K)**(1-beta)
             + 0.25*rho*beta*nu*alpha / (F*K)**(0.5*(1-beta))
             + (2-3*rho**2)/24 * nu**2) * T
    return A * B

def calibrate_sabr(F: float, T: float,
                    strikes: np.ndarray, market_vols: np.ndarray,
                    beta: float = 0.5) -> dict:
    """Calibrate (alpha, rho, nu) with fixed beta."""
    def objective(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1: return 1e10
        fitted = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                            for K in strikes])
        return np.sum((fitted - market_vols)**2)

    x0  = [market_vols[len(market_vols)//2], -0.3, 0.3]
    res = minimize(objective, x0, method='Nelder-Mead',
                   options={'xatol': 1e-10, 'fatol': 1e-14, 'maxiter': 50000})
    alpha, rho, nu = res.x
    fitted = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                        for K in strikes])
    rmse   = np.sqrt(np.mean((fitted - market_vols)**2)) * 10000
    return {'alpha': round(alpha, 6), 'rho': round(rho, 4),
            'nu': round(nu, 4), 'RMSE_bps': round(rmse, 3)}

F, T = 0.03, 1.0
strikes     = np.array([0.010, 0.015, 0.020, 0.025, 0.030,
                          0.035, 0.040, 0.045, 0.050])
market_vols = np.array([0.85, 0.65, 0.50, 0.40, 0.35,
                          0.34, 0.36, 0.39, 0.43])
result = calibrate_sabr(F, T, strikes, market_vols, beta=0.5)
print("SABR calibration:", result)`,
    explanation:
      "SABR calibration fixes beta (often 0.5 for square-root or 1 for lognormal backbone) and fits (alpha, rho, nu) to the market smile. Alpha controls ATM vol, rho determines skew (negative rho = downward skew), and nu controls the smile's curvature. For swaption markets, a separate SABR surface is calibrated for each expiry/tenor combination, producing a full implied vol cube.",
  },
  {
    id: "pyfin-20260605-b1-heston-mc",
    language: "python",
    title: "Heston stochastic volatility MC — exact simulation with QE scheme",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, ncx2

def heston_mc_qe(S0: float, K: float, r: float,
                  kappa: float, theta: float, xi: float,
                  rho: float, v0: float, T: float,
                  n_steps: int = 100, n_paths: int = 50_000,
                  seed: int = 42) -> float:
    """
    Heston (1993) model via Quadratic Exponential (QE) scheme (Andersen 2008).
    dS = r*S*dt + sqrt(v)*S*dW1
    dv = kappa*(theta-v)*dt + xi*sqrt(v)*dW2,  corr(dW1,dW2)=rho
    QE accurately preserves the non-central chi-squared distribution of v.
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * T)

    e_kdt = np.exp(-kappa * dt)
    kdt   = kappa * dt

    S = np.full(n_paths, S0, dtype=np.float64)
    v = np.full(n_paths, v0, dtype=np.float64)

    for _ in range(n_steps):
        # Conditional moments of v_{t+dt} | v_t.
        m  = theta + (v - theta) * e_kdt
        s2 = (v * xi**2 * e_kdt / kappa * (1 - e_kdt)
              + theta * xi**2 / (2*kappa) * (1 - e_kdt)**2)
        psi = s2 / (m**2)

        # QE: split on psi threshold.
        mask = psi <= 1.5
        # Branch 1: Gaussian approx (psi small).
        a = 2 / psi - 1 + np.sqrt(2/psi) * np.sqrt(2/psi - 1)
        b2 = m / (1 + a)
        b  = np.sqrt(b2)
        Z  = rng.standard_normal(n_paths)
        v_gauss = b2 * (b + Z)**2

        # Branch 2: exponential approx (psi large).
        beta = 2 / (m * (1 + psi))
        p    = (psi - 1) / (psi + 1)
        U    = rng.random(n_paths)
        v_exp = np.where(U > p, np.log((1-p)/(1-U)) / beta, 0.0)

        v_new = np.where(mask, v_gauss, v_exp)

        # Log-asset update with variance correction.
        k1 = np.exp((rho/xi * (kappa*theta - 0.5*xi**2) - 0.5) * dt
                     - rho/xi * v_new)
        k2 = np.sqrt((1-rho**2)*v)
        Z2 = rng.standard_normal(n_paths)
        S  = S * k1 * np.exp(np.sqrt(v * dt) * (rho * Z + k2 * Z2))
        v  = np.maximum(v_new, 0.0)

    payoff = np.maximum(S - K, 0.0)
    return float(disc * payoff.mean())

price = heston_mc_qe(S0=100, K=100, r=0.05,
                      kappa=2.0, theta=0.04, xi=0.3,
                      rho=-0.7, v0=0.04, T=1.0)
print(f"Heston call price: {price:.4f}")
# Implied vol of Heston smile is not flat — rho<0 creates downward skew.`,
    explanation:
      "The Quadratic-Exponential scheme matches the Heston variance process's true non-central chi-squared distribution by switching between a Gaussian approximation (when variance is well above zero) and an exponential approximation (when the process can hit zero). The naive Euler discretisation frequently produces negative variance, requiring absorption or reflection hacks that bias the price; QE avoids both.",
  },
  {
    id: "pyfin-20260605-b1-antithetic-cv",
    language: "python",
    title: "Antithetic variates + control variate — combined variance reduction",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_exact(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return float(S * norm.cdf(d1) - K * np.exp(-r*T) * norm.cdf(d1 - sigma*np.sqrt(T)))

def mc_call_full(S: float, K: float, r: float, sigma: float, T: float,
                  n_paths: int = 50_000, seed: int = 42) -> dict:
    """
    Compare four MC estimators for a European call:
    1. Naive MC
    2. Antithetic variates (use Z and -Z)
    3. Control variate (geometric vs arithmetic payoff)
    4. Combined: antithetic + control variate
    """
    rng   = np.random.default_rng(seed)
    disc  = np.exp(-r * T)
    Z     = rng.standard_normal(n_paths)

    # Common terms.
    def payoff(z):
        ST = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*z)
        return np.maximum(ST - K, 0.0)

    # 1. Naive.
    P_naive = disc * payoff(Z)
    se_naive = P_naive.std() / np.sqrt(n_paths)

    # 2. Antithetic (pairs Z, -Z — eliminate all odd moments of Z).
    P1, P2 = disc*payoff(Z), disc*payoff(-Z)
    P_anti  = 0.5 * (P1 + P2)
    se_anti = P_anti.std() / np.sqrt(n_paths)

    # 3. Control variate: geometric-average basket (known price = BS price).
    # For a single asset, the control is just the payoff itself evaluated
    # at the geometric average over n sub-steps. Here: use delta-based control.
    # Simple control: S_T as control (E[S_T] = S*exp(r*T)).
    ST       = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    E_ST     = S * np.exp(r * T)
    cov_     = np.cov(disc*payoff(Z), ST)
    b_star   = -cov_[0, 1] / np.var(ST)  # optimal coefficient
    P_cv     = disc * payoff(Z) + b_star * (ST - E_ST)
    se_cv    = P_cv.std() / np.sqrt(n_paths)

    # 4. Combined antithetic + control.
    ST_a     = S * np.exp((r-0.5*sigma**2)*T + sigma*np.sqrt(T)*(-Z))
    P_combi  = 0.5*(disc*payoff(Z) + disc*payoff(-Z)) + b_star*0.5*(ST + ST_a - 2*E_ST)
    se_combi = P_combi.std() / np.sqrt(n_paths)

    exact = bs_call_exact(S, K, r, sigma, T)
    return {
        'exact':   round(exact, 5),
        'naive':   f"{P_naive.mean():.5f} ± {se_naive:.5f}",
        'antithetic': f"{P_anti.mean():.5f} ± {se_anti:.5f}",
        'control_variate': f"{P_cv.mean():.5f} ± {se_cv:.5f}",
        'combined': f"{P_combi.mean():.5f} ± {se_combi:.5f}",
    }

result = mc_call_full(100, 100, 0.05, 0.20, 1.0, n_paths=20_000)
for k, v in result.items():
    print(f"{k:20s}: {v}")`,
    explanation:
      "Antithetic variates exploit the symmetry of the normal distribution: Z and -Z produce negatively correlated payoffs whose average cancels odd-moment noise, roughly halving variance. A control variate further removes correlated noise by subtracting a zero-mean adjustment aligned with the payoff's covariance structure. Combined, they can reduce variance by 10-50x relative to naive MC.",
  },
  {
    id: "pyfin-20260605-b1-importance-sampling",
    language: "python",
    title: "Importance sampling — deep OTM put pricing with exponential tilting",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_put_exact(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return float(K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1))

def is_put_mc(S: float, K: float, r: float, sigma: float, T: float,
               n_paths: int = 100_000, seed: int = 42) -> dict:
    """
    Importance sampling for a deep OTM put (K << S).
    Exponential tilting: sample from N(mu_IS, 1) instead of N(0, 1).
    mu_IS chosen so that the put is more likely to finish in the money.
    Likelihood ratio (Radon-Nikodym derivative): exp(-mu_IS*Z + 0.5*mu_IS^2).
    """
    rng  = np.random.default_rng(seed)
    disc = np.exp(-r * T)
    sT   = sigma * np.sqrt(T)

    # 1. Naive MC.
    Z_naive  = rng.standard_normal(n_paths)
    ST_naive = S * np.exp((r - 0.5*sigma**2)*T + sT * Z_naive)
    P_naive  = disc * np.maximum(K - ST_naive, 0.0)
    # Many paths give zero payoff for deep OTM — very noisy estimator.

    # 2. Importance sampling: shift distribution toward in-the-money.
    # mu_IS = log(S/K) / sT + (r/sigma - 0.5*sigma)*sqrt(T) (exact ITM centre).
    mu_IS    = -(np.log(K/S) - (r - 0.5*sigma**2)*T) / sT   # negative for OTM put
    Z_is     = rng.standard_normal(n_paths) + mu_IS   # shifted samples
    ST_is    = S * np.exp((r - 0.5*sigma**2)*T + sT * Z_is)
    payoff   = np.maximum(K - ST_is, 0.0)
    # Likelihood ratio correction (return to original measure).
    LR       = np.exp(-mu_IS * Z_is + 0.5 * mu_IS**2)
    P_is     = disc * payoff * LR

    exact = bs_put_exact(S, K, r, sigma, T)
    return {
        'exact':          f"{exact:.8f}",
        'naive_mean':     f"{P_naive.mean():.8f}",
        'naive_cv':       f"{P_naive.std()/P_naive.mean():.1f}x" if P_naive.mean()>0 else "inf",
        'IS_mean':        f"{P_is.mean():.8f}",
        'IS_cv':          f"{P_is.std()/abs(P_is.mean()):.2f}x",
        'variance_reduction': round((P_naive.var()/P_is.var()), 1),
    }

# Deep OTM: put 20% out of the money.
result = is_put_mc(S=100, K=75, r=0.05, sigma=0.20, T=1.0, n_paths=100_000)
for k, v in result.items():
    print(f"{k:22s}: {v}")`,
    explanation:
      "Exponential tilting shifts the sampling distribution so that the event of interest (S_T < K for a deep OTM put) occurs frequently; the likelihood ratio reweights each sample back to the original measure. For a 20% OTM put, naive MC has coefficient-of-variation ~50 requiring millions of paths; importance sampling reduces the CV to ~0.1, achieving the same precision with 2500x fewer paths.",
  },
  {
    id: "pyfin-20260605-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory — GPD tail fitting for left-tail risk",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses: np.ndarray, threshold: float,
                  method: str = 'mle') -> dict:
    """
    Fit a Generalized Pareto Distribution to losses exceeding a threshold.
    GPD models the tail: P(X > x | X > u) = (1 + xi*(x-u)/sigma)^(-1/xi)
    xi > 0: heavy (Pareto) tail; xi = 0: exponential; xi < 0: bounded tail.
    Typical equity losses: xi in [0.2, 0.4].
    """
    exceedances = losses[losses > threshold] - threshold
    n_total     = len(losses)
    n_exc       = len(exceedances)

    if n_exc < 30:
        raise ValueError(f"Too few exceedances ({n_exc}); lower the threshold.")

    # scipy: GPD parametrisation is (c=xi, loc=0, scale=sigma).
    xi, _, sigma = genpareto.fit(exceedances, floc=0)

    # Tail probability and VaR beyond threshold.
    def var_gpd(p_level: float) -> float:
        """VaR at confidence level p_level (e.g., 0.99)."""
        p_tail  = n_exc / n_total                  # P(X > u)
        p_cond  = (1 - p_level) / p_tail           # P(X > x | X > u) needed
        if xi == 0:
            return threshold + sigma * (-np.log(p_cond))
        return threshold + sigma / xi * (p_cond**(-xi) - 1)

    def es_gpd(p_level: float) -> float:
        """Expected Shortfall (CVaR) at confidence level p_level."""
        v = var_gpd(p_level)
        if xi >= 1: return np.inf
        return (v + sigma - xi * threshold) / (1 - xi)

    return {
        'xi':              round(xi, 4),
        'sigma':           round(sigma, 4),
        'n_exceedances':   n_exc,
        'threshold':       threshold,
        'VaR_99':          round(var_gpd(0.99), 4),
        'VaR_999':         round(var_gpd(0.999), 4),
        'ES_99':           round(es_gpd(0.99), 4),
        'tail_heavy':      xi > 0,
    }

np.random.seed(42)
# Simulate student-t returns (heavy tails, df=4).
from scipy.stats import t as t_dist
daily_losses = -t_dist.rvs(df=4, loc=0, scale=0.01, size=5000)

# Peak-over-threshold: use the 95th percentile as threshold.
u = np.percentile(daily_losses, 95)
result = fit_gpd_tail(daily_losses, threshold=u)
print(result)`,
    explanation:
      "The Pickands-Balkema-de Haan theorem guarantees that for sufficiently high threshold u, the excess distribution converges to a GPD regardless of the original distribution's form. This is the theoretical basis of Peak-over-Threshold (POT) EVT. The shape parameter xi is particularly important: xi=0.3 implies that variance exists but the fourth moment does not — VaR extrapolation well beyond the data range is unreliable.",
  },
  {
    id: "pyfin-20260605-b1-parametric-var",
    language: "python",
    title: "Parametric VaR — normal vs Student-t comparison for fat-tailed P&L",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, t as t_dist
from scipy.optimize import minimize

def fit_and_var(returns: np.ndarray, confidence: float = 0.99) -> dict:
    """
    Compute parametric VaR and ES under:
    (a) Normal distribution (underestimates fat tails)
    (b) Student-t distribution (accounts for excess kurtosis)
    Returns losses (positive = loss) at confidence level.
    """
    mu, sigma = returns.mean(), returns.std(ddof=1)

    # (a) Normal VaR/ES.
    z_normal  = norm.ppf(1 - confidence)       # e.g., -2.326 at 99%
    var_n     = -(mu + z_normal * sigma)        # positive number = loss
    es_n      = -(mu - sigma * norm.pdf(norm.ppf(1-confidence)) / (1-confidence))

    # (b) Student-t: estimate df via MLE.
    def neg_loglik_t(params):
        nu, loc, scale = params
        if nu < 2 or scale <= 0: return 1e10
        return -t_dist.logpdf(returns, df=nu, loc=loc, scale=scale).sum()

    res  = minimize(neg_loglik_t, [4.0, mu, sigma], method='Nelder-Mead',
                    options={'xatol': 1e-8, 'maxiter': 10000})
    nu, loc_t, scale_t = res.x
    nu   = max(nu, 2.01)

    z_t   = t_dist.ppf(1 - confidence, df=nu)
    var_t = -(loc_t + z_t * scale_t)
    # ES for t-distribution: ES = loc + scale * t_pdf(z, nu) / (1-p) * (nu+z^2)/(nu-1)
    t_pdf_z = t_dist.pdf(z_t, df=nu)
    es_t  = -(loc_t + scale_t * t_pdf_z / (1-confidence) * (nu + z_t**2) / (nu - 1))

    # Empirical check.
    var_emp = -np.percentile(returns, (1 - confidence) * 100)
    es_emp  = -returns[returns < -var_emp].mean()

    return {
        'mu': round(mu*252, 4), 'sigma': round(sigma*np.sqrt(252), 4),
        'fitted_df': round(nu, 2),
        f'VaR_{confidence}_Normal': round(var_n, 5),
        f'VaR_{confidence}_t':      round(var_t, 5),
        f'VaR_{confidence}_empirical': round(var_emp, 5),
        f'ES_{confidence}_Normal':  round(es_n, 5),
        f'ES_{confidence}_t':       round(es_t, 5),
        f'ES_{confidence}_empirical': round(es_emp, 5),
    }

np.random.seed(5)
returns = t_dist.rvs(df=4, loc=0.0005, scale=0.01, size=1000)
result  = fit_and_var(returns, confidence=0.99)
for k, v in result.items():
    print(f"{k}: {v}")`,
    explanation:
      "Student-t VaR with estimated degrees-of-freedom produces consistently higher VaR estimates than the normal model for financial returns, which typically have kurtosis of 4-8 (df≈5-15 for t-distribution). The ES ratio ES/VaR = (nu+z²)/(nu-1)*pdf(z)/(1-p)/z is greater than 1 and grows as df approaches 2, reflecting the heavier tail's contribution to the shortfall. Regulators under FRTB (Basel 4) require ES at 97.5% rather than VaR at 99%.",
  },
  {
    id: "pyfin-20260605-b1-historical-var",
    language: "python",
    title: "Age-weighted historical VaR (BRW method) — decay-weighted scenario set",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def brw_historical_var(returns: np.ndarray,
                         confidence: float = 0.99,
                         decay: float = 0.99,
                         horizon: int = 1) -> dict:
    """
    Boudoukh-Richardson-Whitelaw (1998) age-weighted historical simulation.
    Weights: w_t = lambda^(T-t) * (1-lambda) / (1-lambda^T)  (t=1=oldest)
    Assigns exponentially decreasing weight to older observations.
    Recent shocks thus have higher impact on VaR than ancient scenarios.
    """
    n = len(returns)
    t = np.arange(n)          # t=0=oldest, t=n-1=most recent

    # Weights: most recent observation gets highest weight.
    raw_w = decay ** (n - 1 - t)
    w     = raw_w / raw_w.sum()   # normalise to sum to 1

    # Sort by return (ascending = worst first).
    sorted_idx = np.argsort(returns)
    sorted_r   = returns[sorted_idx]
    sorted_w   = w[sorted_idx]

    # Find VaR: smallest loss such that cumulative weight >= 1-confidence.
    cum_w = np.cumsum(sorted_w)
    var_idx = np.searchsorted(cum_w, 1 - confidence)
    var     = -sorted_r[var_idx]

    # ES: weighted average of scenarios worse than VaR.
    worse_mask = sorted_r < -var
    es_w       = sorted_w[worse_mask].sum()
    es = -np.dot(sorted_r[worse_mask], sorted_w[worse_mask]) / es_w if es_w > 0 else var

    # Comparison: equal-weight historical.
    var_ew  = -np.percentile(returns, (1-confidence)*100)
    es_ew   = -returns[returns < -var_ew].mean()

    half_life = np.log(2) / np.log(1/decay)
    return {
        'decay':        decay,
        'half_life_days': round(half_life, 1),
        'VaR_BRW':      round(var, 5),
        'ES_BRW':       round(es, 5),
        'VaR_equal_wt': round(var_ew, 5),
        'ES_equal_wt':  round(es_ew, 5),
        'top5_weights': [round(x, 5) for x in w[np.argsort(-w)[:5]]],
    }

np.random.seed(10)
n_days = 500
# Regime change: first 400 days low vol, last 100 days high vol.
returns = np.concatenate([
    np.random.normal(0.001, 0.008, 400),
    np.random.normal(-0.002, 0.025, 100),
])
result = brw_historical_var(returns, confidence=0.99, decay=0.98)
print(result)
# BRW VaR should be higher than equal-weight due to recent high-vol observations.`,
    explanation:
      "BRW historical simulation solves the stale-scenario problem of equal-weight HS: under equal weighting, a stress event 499 days ago and yesterday's stress are treated identically. With decay=0.98, yesterday's observation gets ~50x more weight than an event 200 days ago (half-life ~35 days). Basel Internal Model Approach allows BRW as an alternative to equal-weight HS.",
  },
  {
    id: "pyfin-20260605-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor model — OLS loading estimation and alpha testing",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

np.random.seed(42)
n = 252   # one year of daily data

# Simulate Fama-French factors (daily).
Mkt  = np.random.normal(0.0004, 0.01, n)    # market excess return
SMB  = np.random.normal(0.0001, 0.005, n)   # small minus big
HML  = np.random.normal(0.0001, 0.005, n)   # high minus low (value)

# Simulate a portfolio with known true loadings.
alpha_true = 0.0002   # 5 bps/day alpha
b_mkt, b_smb, b_hml = 1.1, 0.4, -0.2
eps   = np.random.normal(0, 0.007, n)
R_p   = alpha_true + b_mkt*Mkt + b_smb*SMB + b_hml*HML + eps

# OLS regression: R_p = alpha + b_mkt*Mkt + b_smb*SMB + b_hml*HML + eps
X = sm.add_constant(np.column_stack([Mkt, SMB, HML]))
model = sm.OLS(R_p, X).fit(cov_type='HC3')   # heteroskedasticity-robust SEs

print(model.summary().tables[1])

alpha_est  = model.params[0] * 252   # annualised alpha
t_stat_a   = model.tvalues[0]
betas      = model.params[1:]

# Information ratio.
residuals  = model.resid
alpha_d    = model.params[0]
idio_std   = residuals.std() * np.sqrt(252)
ir         = alpha_d * 252 / idio_std

# Factor attribution of return variance.
cov_factors = np.cov(np.column_stack([Mkt, SMB, HML]).T)
sys_var     = float(betas @ cov_factors @ betas) * 252
total_var   = np.var(R_p, ddof=1) * 252
idio_var    = total_var - sys_var

print(f"\\nAnnualised alpha:    {alpha_est*100:.3f}%  (t={t_stat_a:.2f})")
print(f"Beta (Mkt,SMB,HML): {np.round(betas, 3)}")
print(f"R^2:                 {model.rsquared:.4f}")
print(f"Information Ratio:   {ir:.3f}")
print(f"Systematic risk:     {sys_var/(sys_var+idio_var)*100:.1f}%")`,
    explanation:
      "The Fama-French 3-factor regression decomposes a portfolio's return into market risk (beta), size exposure (SMB = small-cap premium), and value exposure (HML = book-to-market premium). The intercept alpha is the abnormal return unexplained by risk factors — a statistically significant positive alpha (t > 2) suggests genuine skill or an unexploited factor. Robust standard errors (HC3) correct for heteroskedasticity common in financial returns.",
  },
  {
    id: "pyfin-20260605-b1-black-litterman",
    language: "python",
    title: "Black-Litterman model — blending equilibrium returns with investor views",
    tag: "finance",
    code: `import numpy as np

def black_litterman(
    cov: np.ndarray,       # (N,N) asset covariance matrix
    w_mkt: np.ndarray,     # (N,) market cap weights
    P: np.ndarray,         # (K,N) pick matrix (K views)
    Q: np.ndarray,         # (K,) view expected returns
    Omega: np.ndarray,     # (K,K) view uncertainty covariance (diagonal ok)
    risk_aversion: float = 3.0,
    tau: float = 0.05      # proportionality constant (small = trust prior)
) -> dict:
    """
    Black-Litterman (1990, 1992):
    Step 1: Implied equilibrium returns Pi = lambda * Sigma * w_mkt.
    Step 2: Posterior:
      mu_BL = [(tau*Sigma)^{-1} + P^T * Omega^{-1} * P]^{-1}
              * [(tau*Sigma)^{-1} * Pi + P^T * Omega^{-1} * Q]
    """
    N  = len(w_mkt)
    # Implied equilibrium excess returns (reverse-optimisation).
    Pi = risk_aversion * cov @ w_mkt

    # Posterior mean.
    tauSig_inv = np.linalg.inv(tau * cov)
    Om_inv     = np.linalg.inv(Omega)
    M          = tauSig_inv + P.T @ Om_inv @ P
    mu_BL      = np.linalg.solve(M, tauSig_inv @ Pi + P.T @ Om_inv @ Q)

    # Posterior covariance.
    Sigma_BL   = cov + np.linalg.inv(M)

    # Optimal weights: unconstrained mean-variance with posterior mu.
    w_BL = np.linalg.solve(risk_aversion * Sigma_BL, mu_BL)
    w_BL = np.maximum(w_BL, 0); w_BL /= w_BL.sum()  # long-only

    return {
        'Pi_pct':    np.round(Pi * 100, 3),    # equilibrium returns %
        'mu_BL_pct': np.round(mu_BL * 100, 3), # BL posterior %
        'w_BL':      np.round(w_BL, 4),
        'tilt':      np.round(w_BL - w_mkt, 4),  # deviation from market cap
    }

np.random.seed(7)
N = 5
A = np.random.randn(N, N)
cov = A @ A.T / N + np.eye(N) * 0.02   # annualised cov
w_mkt = np.array([0.30, 0.25, 0.20, 0.15, 0.10])

# Two views: asset 0 outperforms asset 1 by 3%; asset 2 returns 8%.
P = np.zeros((2, N))
P[0, 0], P[0, 1] = 1.0, -1.0   # relative view
P[1, 2]           = 1.0          # absolute view

Q = np.array([0.03, 0.08])
Omega = np.diag([0.001, 0.002])   # view confidence

result = black_litterman(cov, w_mkt, P, Q, Omega)
print("Equilibrium returns (%):", result['Pi_pct'])
print("BL posterior   (%)     :", result['mu_BL_pct'])
print("BL weights             :", result['w_BL'])
print("Tilt from mkt cap      :", result['tilt'])`,
    explanation:
      "Black-Litterman blends the prior (CAPM equilibrium returns implied by market-cap weights) with subjective investor views via Bayesian updating. The posterior tilts away from equilibrium in proportion to view confidence (1/Omega) and view magnitude Q-Pi. A key practical insight: views on relative performance (P with +1/-1) are less sensitive to the confidence parameter than absolute views because the prior already contains much of the information.",
  },
  {
    id: "pyfin-20260605-b1-lsm-american",
    language: "python",
    title: "Longstaff-Schwartz LSM — American put pricing via regression on paths",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_put_exact(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return float(K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1))

def lsm_american_put(S0: float, K: float, r: float, sigma: float, T: float,
                       n_steps: int = 50, n_paths: int = 50_000,
                       seed: int = 42) -> float:
    """
    Longstaff-Schwartz (2001) Least-Squares Monte Carlo for American put.
    At each exercise date: regress continuation value on basis functions of S.
    Basis: {1, S, S^2} (Laguerre polynomials recommended in the paper).
    Early exercise if intrinsic > conditional continuation value.
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc_step = np.exp(-r * dt)

    # Simulate GBM paths — antithetic pairs for variance reduction.
    Z   = rng.standard_normal((n_paths // 2, n_steps))
    Z   = np.vstack([Z, -Z])
    S   = np.zeros((n_paths, n_steps + 1))
    S[:, 0] = S0
    for t in range(n_steps):
        S[:, t+1] = S[:, t] * np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z[:, t])

    # Cash flows: start with terminal payoff.
    CF = np.maximum(K - S[:, -1], 0.0)

    # Backward induction.
    for t in range(n_steps - 1, 0, -1):
        itm   = K > S[:, t]                    # in-the-money paths only
        S_itm = S[itm, t]
        if itm.sum() < 5: continue

        # Regress discounted CF on {1, S, S^2} using ITM paths.
        X_itm = np.column_stack([
            np.ones(itm.sum()),
            S_itm / K,           # normalised spot
            (S_itm / K)**2,
        ])
        y_itm = CF[itm] * disc_step
        # OLS via normal equations.
        beta  = np.linalg.lstsq(X_itm, y_itm, rcond=None)[0]

        # Conditional continuation value.
        cont  = X_itm @ beta
        intr  = K - S_itm
        # Exercise if intrinsic > estimated continuation.
        exercise = intr > cont
        CF[itm] = np.where(exercise, intr, CF[itm] * disc_step)
        # Paths that did not exercise: discount CF.
        CF[~itm] *= disc_step

    price = np.exp(-r * dt) * CF.mean()
    return float(price)

S, K, r, sigma, T = 100, 100, 0.05, 0.20, 1.0
euro_put = bs_put_exact(S, K, r, sigma, T)
amer_put = lsm_american_put(S, K, r, sigma, T)
print(f"European put (BS):    {euro_put:.4f}")
print(f"American put (LSM):   {amer_put:.4f}")
print(f"Early exercise value: {amer_put - euro_put:.4f}")`,
    explanation:
      "LSM uses in-the-money paths to estimate the conditional continuation value via OLS — out-of-the-money paths are excluded because their exercise value is zero and including them would bias the regression coefficients. The key insight is that the regression is for the exercise decision (compare continuation to intrinsic), not for pricing directly; errors in the regression lead to sub-optimal but still valid lower bounds for the American price.",
  },
  {
    id: "pyfin-20260605-b1-duration-convexity",
    language: "python",
    title: "Bond duration and convexity — DV01, modified duration, convexity",
    tag: "finance",
    code: `import numpy as np

def bond_analytics(face: float, coupon_rate: float, ytm: float,
                    years: int, freq: int = 2) -> dict:
    """
    Full bond analytics: price, Macaulay duration, modified duration,
    dollar duration (DV01), convexity, and Taylor-series P&L estimates.
    freq: coupon payments per year (2 = semi-annual).
    """
    periods  = years * freq
    c        = coupon_rate / freq * face     # coupon amount per period
    ytm_p    = ytm / freq                   # per-period yield

    # Cash flows and their times (in years).
    times    = np.arange(1, periods + 1) / freq
    cfs      = np.full(periods, c)
    cfs[-1] += face                          # add principal at maturity

    # Discount factors and PV.
    dfs      = 1.0 / (1 + ytm_p) ** np.arange(1, periods + 1)
    pvs      = cfs * dfs
    price    = pvs.sum()

    # Macaulay duration: time-weighted PV / price.
    mac_dur  = np.dot(times, pvs) / price

    # Modified duration: Macaulay / (1 + y/freq).
    mod_dur  = mac_dur / (1 + ytm_p)

    # Dollar duration (DV01): change in price per 1 bp move in yield.
    dv01     = mod_dur * price / 10000

    # Convexity: second-order Taylor coefficient.
    conv = np.dot(times * (times + 1/freq), pvs) / (price * (1+ytm_p)**2)

    # P&L approximation for a 100 bp parallel shift.
    delta_y  = 0.01
    pnl_dur  = -mod_dur * price * delta_y
    pnl_conv = 0.5 * conv * price * delta_y**2
    pnl_total = pnl_dur + pnl_conv

    # Exact full-revaluation.
    ytm_p_new = (ytm + delta_y) / freq
    dfs_new   = 1.0 / (1 + ytm_p_new) ** np.arange(1, periods + 1)
    price_new = (cfs * dfs_new).sum()
    pnl_exact = price_new - price

    return {
        'price':     round(price, 4),
        'mac_dur':   round(mac_dur, 4),
        'mod_dur':   round(mod_dur, 4),
        'dv01':      round(dv01, 4),
        'convexity': round(conv, 4),
        'pnl_Taylor_100bp': round(pnl_total, 4),
        'pnl_exact_100bp':  round(pnl_exact, 4),
        'convexity_benefit': round(pnl_exact - pnl_dur, 4),
    }

# 10-year 5% coupon bond, priced at 4.5% yield (trades at premium).
analytics = bond_analytics(face=1000, coupon_rate=0.05, ytm=0.045, years=10)
for k, v in analytics.items():
    print(f"{k:25s}: {v}")`,
    explanation:
      "The second-order Taylor expansion (duration + convexity) outperforms duration alone for large yield moves: a 100 bp shift introduces 0.5*Γ*(Δy)² convexity P&L that the linear approximation ignores. Convexity is always positive for standard bonds — prices rise more when yields fall than they fall when yields rise by the same amount. This asymmetry is priced in the market: investors pay extra for high-convexity bonds.",
  },
  {
    id: "pyfin-20260605-b1-cta-trend",
    language: "python",
    title: "CTA trend-following — dual moving average crossover with volatility sizing",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def cta_trend(prices: np.ndarray,
               fast_window: int = 20,
               slow_window: int = 60,
               vol_target: float = 0.15,
               vol_window: int = 20) -> dict:
    """
    Dual moving average crossover CTA strategy.
    Signal:  +1 (long) when fast MA > slow MA, -1 (short) otherwise.
    Sizing:  scale position so annualised vol = vol_target.
    Typical CTA: diversified across 30-50 markets; this is single-market.
    """
    n       = len(prices)
    fast_ma = pd.Series(prices).rolling(fast_window).mean().values
    slow_ma = pd.Series(prices).rolling(slow_window).mean().values
    returns = np.diff(np.log(prices))

    # Signal: +1 or -1 (no signal in warm-up).
    signal  = np.where(fast_ma[:-1] > slow_ma[:-1], 1.0, -1.0)
    signal[:slow_window] = 0   # warm-up period

    # Annualised realised vol (lagged 1 day to avoid look-ahead).
    vol_ann = pd.Series(returns).rolling(vol_window).std().values * np.sqrt(252)
    vol_ann = np.where(vol_ann > 0.01, vol_ann, 0.01)

    # Volatility-targeted position size.
    position = signal * vol_target / vol_ann
    strategy_ret = position * returns

    # Performance metrics.
    ann_ret = strategy_ret.mean() * 252
    ann_std = strategy_ret.std() * np.sqrt(252)
    sharpe  = ann_ret / ann_std if ann_std > 0 else 0

    # Max drawdown.
    cum     = np.nancumsum(strategy_ret)
    peak    = np.maximum.accumulate(cum)
    dd      = cum - peak
    max_dd  = dd.min()

    # Turnover (signal changes).
    n_trades = int(np.abs(np.diff(signal)).sum())

    return {
        'ann_return_%': round(ann_ret * 100, 3),
        'ann_vol_%':    round(ann_std * 100, 3),
        'sharpe':       round(sharpe, 3),
        'max_dd_%':     round(max_dd * 100, 3),
        'n_signal_flips': n_trades,
    }

np.random.seed(15)
n    = 1260   # 5 years of daily data
# Trending asset: upward drift with occasional mean-reversions.
prices = 100 * np.exp(np.cumsum(
    np.random.normal(0.0003, 0.012, n)
    + 0.15 * np.sin(np.linspace(0, 4*np.pi, n)) * 0.012
))

result = cta_trend(prices, fast_window=20, slow_window=60)
print(result)`,
    explanation:
      "CTA trend-following systematically captures the behavioural premium of momentum across asset classes. Volatility targeting (sizing proportional to vol_target/realised_vol) ensures each market contributes equal risk regardless of its asset-class vol — allowing naive aggregation across 50 uncorrelated markets without letting high-vol assets dominate. The strategy's Sharpe degrades when assets become range-bound; robustness requires diversification across markets and timeframes.",
  },
  {
    id: "pyfin-20260605-b1-garch-mle",
    language: "python",
    title: "GARCH(1,1) maximum likelihood — volatility forecasting from scratch",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_loglik(params: np.ndarray, returns: np.ndarray) -> float:
    """
    GARCH(1,1): sigma^2_t = omega + alpha*eps_{t-1}^2 + beta*sigma^2_{t-1}
    Gaussian log-likelihood: sum_t [-0.5*log(sigma^2_t) - 0.5*r_t^2/sigma^2_t]
    Parameters must satisfy: omega>0, alpha>=0, beta>=0, alpha+beta<1.
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10
    n      = len(returns)
    var_unc = omega / (1 - alpha - beta)   # unconditional variance
    sigma2  = np.zeros(n)
    sigma2[0] = var_unc

    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    ll = -0.5 * (np.log(sigma2) + returns**2 / sigma2)
    return -ll.sum()   # return negative log-likelihood for minimisation

def fit_garch11(returns: np.ndarray) -> dict:
    """Fit GARCH(1,1) by MLE and return parameter estimates + diagnostics."""
    var_init = np.var(returns)
    x0 = [var_init * 0.05, 0.08, 0.88]   # typical starting point

    res = minimize(garch11_loglik, x0, args=(returns,), method='L-BFGS-B',
                   bounds=[(1e-8, None), (1e-6, 0.5), (1e-6, 0.999)],
                   options={'ftol': 1e-12, 'maxiter': 5000})
    omega, alpha, beta = res.x
    persistence = alpha + beta
    half_life   = np.log(0.5) / np.log(persistence) if persistence < 1 else np.inf

    # Recompute sigma for forecasting.
    n = len(returns)
    sigma2 = np.zeros(n)
    sigma2[0] = omega / (1 - alpha - beta)
    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    # h-step ahead forecast.
    h_step = [np.sqrt((omega + (alpha+beta)**h * (sigma2[-1] - omega/(1-alpha-beta)))
                       * 252) for h in range(1, 6)]

    return {
        'omega':        round(omega, 8),
        'alpha':        round(alpha, 5),
        'beta':         round(beta, 5),
        'persistence':  round(persistence, 5),
        'half_life_days': round(half_life, 1),
        'uncond_vol_%': round(np.sqrt(omega/(1-alpha-beta)*252)*100, 3),
        'vol_forecast_5d_%': [round(v*100, 3) for v in h_step],
    }

np.random.seed(20)
eps   = np.random.randn(1000)
sigma = np.zeros(1000)
sigma[0] = 0.01
for t in range(1, 1000):
    sigma[t] = np.sqrt(0.00001 + 0.08*sigma[t-1]**2*eps[t-1]**2 + 0.88*sigma[t-1]**2)
returns = sigma * eps

result = fit_garch11(returns)
print(result)   # Should recover omega≈1e-5, alpha≈0.08, beta≈0.88`,
    explanation:
      "GARCH(1,1) is the workhorse volatility model: alpha captures the vol spike after a large return (ARCH effect) while beta controls persistence (how long the elevated vol lasts). Persistence alpha+beta near 1 implies near-unit-root vol — shocks die out very slowly. The half-life formula converts this to an intuitive metric: alpha=0.08, beta=0.88 gives half-life of ~8 days, consistent with equity vol mean-reversion.",
  },
  {
    id: "pyfin-20260605-b1-hedge-ratio",
    language: "python",
    title: "Minimum variance hedge ratio — OLS with Newey-West standard errors",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm
from statsmodels.stats.stattools import durbin_watson

def compute_hedge_ratio(asset_returns: np.ndarray,
                          hedge_returns: np.ndarray,
                          n_lags_nw: int = 5) -> dict:
    """
    Minimum variance hedge ratio via OLS: r_asset = alpha + beta * r_hedge + eps.
    beta* minimises Var(r_asset - beta * r_hedge).
    Newey-West HAC standard errors correct for autocorrelation in residuals.
    Returns the hedge ratio and hedging effectiveness metrics.
    """
    X     = sm.add_constant(hedge_returns)
    model = sm.OLS(asset_returns, X).fit(
        cov_type='HAC',
        cov_kwds={'maxlags': n_lags_nw, 'use_correction': True}
    )
    alpha, beta = model.params
    se_beta     = model.bse[1]
    t_beta      = model.tvalues[1]

    # Hedging effectiveness: variance reduction.
    var_unhedged = np.var(asset_returns, ddof=1)
    hedged_pnl   = asset_returns - beta * hedge_returns
    var_hedged   = np.var(hedged_pnl, ddof=1)
    effectiveness = 1.0 - var_hedged / var_unhedged  # h^2 (same as R^2 for OLS)

    # DW stat: autocorrelation in residuals (should be ~2).
    dw_stat = durbin_watson(model.resid)

    return {
        'beta':           round(beta, 5),
        'se_beta_NW':     round(se_beta, 5),
        't_stat':         round(t_beta, 3),
        'ci_95':          [round(beta - 1.96*se_beta, 5), round(beta + 1.96*se_beta, 5)],
        'R2':             round(model.rsquared, 4),
        'hedge_eff_%':    round(effectiveness * 100, 2),
        'DW_statistic':   round(dw_stat, 3),
        'n_obs':          len(asset_returns),
    }

np.random.seed(25)
n = 500
# Bond portfolio vs interest rate futures hedge.
rate_chg  = np.random.normal(0, 0.001, n)  # futures P&L proxy
bond_ret  = -7.5 * rate_chg + np.random.normal(0, 0.003, n)  # DV01 = 7.5

result = compute_hedge_ratio(bond_ret, rate_chg)
print("Hedge ratio results:")
for k, v in result.items():
    print(f"  {k:20s}: {v}")
# Expected: beta ≈ -7.5 (short futures to hedge long bond),
# effectiveness ~90% (residual idiosyncratic risk)`,
    explanation:
      "The minimum-variance hedge ratio beta* = Cov(asset, hedge) / Var(hedge) is the OLS slope coefficient. Newey-West HAC errors are essential when returns are autocorrelated (intraday data, overlapping windows) because OLS standard errors overstate significance. The DW statistic diagnoses residual autocorrelation: values significantly below 2 indicate positive serial correlation and suggest the hedge period should be extended or the model mis-specified.",
  },
  {
    id: "pyfin-20260605-b1-fd-greeks",
    language: "python",
    title: "Greeks via central finite differences — model-agnostic bump-and-reprice",
    tag: "finance",
    code: `import numpy as np
from typing import Callable

def finite_diff_greeks(
    pricer: Callable[[float, float, float, float, float], float],
    S: float, K: float, r: float, sigma: float, T: float,
    eps_S: float = 0.01, eps_sigma: float = 0.001, eps_r: float = 0.0001
) -> dict:
    """
    Model-agnostic Greeks via central finite differences.
    Works for any pricer (BS, Heston, local vol, MC) — no analytical formula needed.
    Central diff: f'(x) = [f(x+h) - f(x-h)] / 2h  (O(h^2) error vs O(h) for forward diff).
    Second derivative: f''(x) = [f(x+h) - 2*f(x) + f(x-h)] / h^2.
    """
    P0  = pricer(S, K, r, sigma, T)

    # Delta: dP/dS.
    P_Su = pricer(S*(1+eps_S), K, r, sigma, T)
    P_Sd = pricer(S*(1-eps_S), K, r, sigma, T)
    delta = (P_Su - P_Sd) / (2 * S * eps_S)

    # Gamma: d^2P/dS^2.
    gamma = (P_Su - 2*P0 + P_Sd) / (S * eps_S)**2

    # Vega: dP/d(sigma), per 1% move.
    P_vu  = pricer(S, K, r, sigma + eps_sigma, T)
    P_vd  = pricer(S, K, r, sigma - eps_sigma, T)
    vega  = (P_vu - P_vd) / (2 * eps_sigma) / 100   # per 1 vol point

    # Theta: -dP/dT (time decay per calendar day).
    dt    = 1.0 / 365
    P_Tu  = pricer(S, K, r, sigma, T + dt) if T > dt else P0
    P_Td  = pricer(S, K, r, sigma, T - dt) if T > dt else 0.0
    theta = -(P_Tu - P_Td) / (2 * dt)

    # Rho: dP/dr, per 1 bp.
    P_ru  = pricer(S, K, r + eps_r, sigma, T)
    P_rd  = pricer(S, K, r - eps_r, sigma, T)
    rho   = (P_ru - P_rd) / (2 * eps_r) / 100   # per 1 bp

    # Vanna: d^2P/(dS*d(sigma)).
    P_Vu_Su = pricer(S*(1+eps_S), K, r, sigma+eps_sigma, T)
    P_Vd_Sd = pricer(S*(1-eps_S), K, r, sigma-eps_sigma, T)
    P_Vu_Sd = pricer(S*(1-eps_S), K, r, sigma+eps_sigma, T)
    P_Vd_Su = pricer(S*(1+eps_S), K, r, sigma-eps_sigma, T)
    vanna   = (P_Vu_Su + P_Vd_Sd - P_Vu_Sd - P_Vd_Su) / (4 * S*eps_S * eps_sigma)

    return {'P0': round(P0, 6), 'delta': round(delta, 6),
            'gamma': round(gamma, 6), 'vega': round(vega, 6),
            'theta': round(theta, 6), 'rho': round(rho, 6),
            'vanna': round(vanna, 6)}

# Example: BS pricer (swap in MC or Heston pricer for exotic Greeks).
from scipy.stats import norm
def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K)+(r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

greeks = finite_diff_greeks(bs_call, 100, 100, 0.05, 0.20, 1.0)
print(greeks)   # Compare to analytical BS Greeks`,
    explanation:
      "Central finite differences have O(h²) truncation error vs O(h) for forward differences — halving the step size improves accuracy fourfold. The model-agnostic approach is essential for exotic options or stochastic vol models where analytical Greeks don't exist: plug in any pricer function and get full sensitivities. Vanna (d²P/dS·dσ) is critical for hedging a book of options across both spot and vol moves simultaneously.",
  },
  {
    id: "pyfin-20260605-b1-diebold-li",
    language: "python",
    title: "Diebold-Li dynamic Nelson-Siegel — AR(1) factor forecasting",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from scipy.optimize import minimize

def ns_factors(yields_panel: np.ndarray, maturities: np.ndarray,
                lam: float = 0.0609) -> np.ndarray:
    """
    Diebold-Li (2006): fix lambda, extract beta(t) = (b0_t, b1_t, b2_t) by OLS
    at each date t. Then model each factor as AR(1) for forecasting.
    lambda=0.0609 maximises loading on b2 at 30 months (Diebold-Li convention).
    """
    T = yields_panel.shape[0]
    x = maturities * lam
    L1 = (1 - np.exp(-x)) / x          # loading on b1
    L2 = L1 - np.exp(-x)               # loading on b2
    X  = np.column_stack([np.ones_like(maturities), L1, L2])  # (N, 3)

    # OLS for each date.
    betas = np.zeros((T, 3))
    for t in range(T):
        betas[t] = np.linalg.lstsq(X, yields_panel[t], rcond=None)[0]
    return betas

def ar1_forecast(series: np.ndarray, h: int = 1) -> float:
    """Fit AR(1) and forecast h periods ahead."""
    y, y_lag = series[1:], series[:-1]
    A = np.column_stack([np.ones_like(y_lag), y_lag])
    coef = np.linalg.lstsq(A, y, rcond=None)[0]
    mu, phi = coef
    last = series[-1]
    return mu / (1 - phi) + phi**h * (last - mu / (1 - phi))

np.random.seed(30)
T, N = 120, 10   # 10 years monthly, 10 maturities
mats = np.array([1, 3, 6, 12, 24, 36, 60, 84, 120, 240]) / 12.0  # in years

# Simulate yields driven by DL factors.
b0_true = 0.05 + 0.005 * np.random.randn(T)  # level
b1_true = -0.01 + 0.003 * np.random.randn(T)  # slope
b2_true = 0.02 + 0.004 * np.random.randn(T)   # curvature
lam = 0.0609

x   = mats * lam
L1  = (1 - np.exp(-x)) / x
L2  = L1 - np.exp(-x)
yields = (b0_true[:, None] + b1_true[:, None]*L1[None,:]
          + b2_true[:, None]*L2[None,:] + 0.001*np.random.randn(T, N))

# Extract factors.
betas = ns_factors(yields, mats, lam=lam)
print("Factor sample mean:", np.round(betas.mean(axis=0), 5))
print("Factor std:        ", np.round(betas.std(axis=0), 5))

# AR(1) 1-step ahead forecasts.
for i, name in enumerate(['Level', 'Slope', 'Curvature']):
    fc = ar1_forecast(betas[:, i], h=1)
    print(f"{name} forecast: {fc:.5f}  (last obs: {betas[-1, i]:.5f})")`,
    explanation:
      "Diebold and Li fixed lambda=0.0609 (so the curvature loading peaks at 30 months, matching typical humps in the USD curve) and treat the time-varying factors as observable by OLS. Each factor then follows an AR(1) which is far simpler to estimate and forecast than the full non-linear NS optimisation at each date. Out-of-sample forecasts of the yield curve reduce to three scalar AR(1) forecasts.",
  },
];
