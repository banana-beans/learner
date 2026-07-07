import type { Snippet } from "./types";

export const pythonFinanceSnippets20260707B1: Snippet[] = [
  {
    id: "pyfin-20260707-b1-hull-white",
    language: "python",
    title: "Hull-White One-Factor Short Rate: Trinomial Tree",
    tag: "finance",
    code: `import numpy as np

def hull_white_trinomial(
    a: float, sigma: float, T: float, N: int, theta_fn
) -> tuple[np.ndarray, np.ndarray]:
    """
    Build a trinomial tree for the Hull-White r-process:
      dr = (theta(t) - a*r) dt + sigma dW
    theta_fn(t) calibrates to the initial forward curve.
    Returns (r_grid, Q) where Q[i,j] is the Arrow-Debreu price at node (i,j).
    """
    dt = T / N
    dx = sigma * np.sqrt(3 * dt)  # optimal trinomial spacing
    M  = 2 * N + 1                # total nodes per time step
    mid = N                       # index of r=0 node

    r_grid = np.zeros((N + 1, M))
    Q      = np.zeros((N + 1, M))
    Q[0, mid] = 1.0               # initial Arrow-Debreu price = 1

    for i in range(N):
        dt_i = dt
        for j in range(M):
            r = r_grid[i, j]
            theta = theta_fn(i * dt)
            # Mean-revert: branching probabilities
            mu   = (theta - a * r) * dt_i
            k    = round(mu / dx)  # branching index shift
            # Hull-White standard probabilities (Brigo & Mercurio, p.73)
            eta  = mu - k * dx
            pu   = 1/6 + (eta**2 + eta * dx) / (2 * dx**2)
            pm   = 2/3 - eta**2 / dx**2
            pd   = 1/6 + (eta**2 - eta * dx) / (2 * dx**2)
            if i + 1 <= N:
                jn = j + k
                for delta, prob in [(-1, pd), (0, pm), (1, pu)]:
                    idx = jn + delta + mid
                    if 0 <= idx < M:
                        r_grid[i+1, idx] = (jn + delta - mid) * dx
                        disc = np.exp(-r * dt_i)
                        Q[i+1, idx] += Q[i, j] * prob * disc

    return r_grid, Q

# Flat forward curve: theta(t) = a * r0 + sigma^2/(2a) * (1 - e^{-2at})
a, sigma, r0 = 0.1, 0.01, 0.03
theta = lambda t: a * r0 + sigma**2 / (2 * a) * (1 - np.exp(-2 * a * t))
r_grid, Q = hull_white_trinomial(a, sigma, 1.0, 10, theta)
print("Arrow-Debreu sum at T=1:", Q[-1].sum())  # ~exp(-r0*T)`,
    explanation:
      "Hull-White's mean-reversion parameter a controls how fast the short rate reverts to theta(t), which is chosen to fit the initial discount curve exactly — making it an arbitrage-free model by construction. The trinomial tree spacing dx = sigma*sqrt(3*dt) is the H&W recommendation that gives branching probabilities that stay in [0,1] for any a and sigma.",
  },
  {
    id: "pyfin-20260707-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Term Structure Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(maturities: np.ndarray, beta0, beta1, beta2, tau) -> np.ndarray:
    """Yields = b0 + b1*(1-e^{-m/tau})/(m/tau) + b2*((1-e^{-m/tau})/(m/tau) - e^{-m/tau})"""
    x = maturities / tau
    factor1 = (1 - np.exp(-x)) / x
    factor2 = factor1 - np.exp(-x)
    return beta0 + beta1 * factor1 + beta2 * factor2

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray) -> dict:
    def loss(params):
        b0, b1, b2, tau = params
        if tau <= 0: return 1e9
        fitted = nelson_siegel(maturities, b0, b1, b2, tau)
        return np.sum((fitted - yields) ** 2)

    res = minimize(loss, x0=[0.04, -0.02, 0.01, 2.0],
                   method='Nelder-Mead',
                   options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 10000})

    b0, b1, b2, tau = res.x
    return {'beta0': b0, 'beta1': b1, 'beta2': b2, 'tau': tau,
            'fitted': nelson_siegel(maturities, b0, b1, b2, tau)}

# US Treasury par yields (approximate, July 2024)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.0534, 0.0531, 0.0512, 0.0476, 0.0454,
                        0.0434, 0.0432, 0.0425, 0.0459, 0.0448])

result = fit_nelson_siegel(maturities, yields)
print(f"beta0 (long-rate): {result['beta0']:.4f}")
print(f"beta1 (slope):     {result['beta1']:.4f}")
print(f"beta2 (curvature): {result['beta2']:.4f}")
print(f"tau (shape):       {result['tau']:.4f}")
print("Fitted:", np.round(result['fitted'], 4))`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into a long-run level (beta0), slope (beta1 — typically negative for a normal curve since short rates are below long rates), and curvature (beta2 — captures the hump around 2-5 years). It's the standard parameterization used by central banks and is identifiable from as few as 5-6 tenor points, making it suitable for sparse sovereign curves.",
  },
  {
    id: "pyfin-20260707-b1-svensson",
    language: "python",
    title: "Svensson Extension of Nelson-Siegel (Two Humps)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import differential_evolution

def svensson(m: np.ndarray, b0, b1, b2, b3, tau1, tau2) -> np.ndarray:
    """Svensson (1994): Nelson-Siegel + second curvature term."""
    x1 = m / tau1
    x2 = m / tau2
    f1 = (1 - np.exp(-x1)) / x1
    f2 = (1 - np.exp(-x2)) / x2
    return b0 + b1*f1 + b2*(f1 - np.exp(-x1)) + b3*(f2 - np.exp(-x2))

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> np.ndarray:
    bounds = [
        (0.0, 0.15),   # beta0
        (-0.1, 0.1),   # beta1
        (-0.1, 0.1),   # beta2
        (-0.1, 0.1),   # beta3
        (0.1, 10.0),   # tau1
        (0.1, 10.0),   # tau2
    ]
    def loss(p):
        b0, b1, b2, b3, t1, t2 = p
        if t1 <= 0 or t2 <= 0 or abs(t1 - t2) < 0.05: return 1e9
        return np.sum((svensson(maturities, b0, b1, b2, b3, t1, t2) - yields)**2)

    res = differential_evolution(loss, bounds, seed=42, tol=1e-10, maxiter=2000)
    return res.x

maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.0534, 0.0531, 0.0512, 0.0476, 0.0454,
                        0.0434, 0.0432, 0.0425, 0.0459, 0.0448])

params = fit_svensson(maturities, yields)
b0, b1, b2, b3, t1, t2 = params
fitted = svensson(maturities, b0, b1, b2, b3, t1, t2)
print("Params:", np.round(params, 4))
print("Residuals (bps):", np.round((fitted - yields) * 10000, 2))`,
    explanation:
      "Svensson adds a fourth factor (beta3 with its own time-decay tau2) to capture a second hump in the yield curve — useful when the curve has both a short-end and a long-end feature (e.g., a flight-to-quality bump at 2Y and a long-term premium at 10Y). Differential evolution is preferred over gradient descent because the objective has multiple local minima when tau1 and tau2 are close.",
  },
  {
    id: "pyfin-20260707-b1-cds-hazard",
    language: "python",
    title: "CDS Hazard Rate Bootstrap from Par Spreads",
    tag: "finance",
    code: `import numpy as np

def bootstrap_hazard_rates(
    tenors: list[float],    # years: [1, 3, 5, 7, 10]
    par_spreads: list[float], # annual CDS spread in decimal
    r: float = 0.05,          # flat risk-free rate
    recovery: float = 0.40,
) -> list[float]:
    """
    Bootstrap piece-wise constant hazard rates from CDS par spreads.
    Par spread = spread such that PV(protection leg) = PV(fee leg).
    """
    dt = 0.25  # quarterly payment frequency
    hazards = []
    prev_tenor = 0.0
    prev_surv  = 1.0

    for T, S in zip(tenors, par_spreads):
        # Build quarterly payment schedule from prev_tenor to T
        times = np.arange(prev_tenor + dt, T + 1e-9, dt)

        # Survival probabilities for earlier tenors are already bootstrapped
        def survival(t: float) -> float:
            s = 1.0
            t_rem = t
            for i, h in enumerate(hazards):
                seg_end = tenors[i]
                seg_start = tenors[i-1] if i > 0 else 0.0
                seg = min(t_rem, seg_end - seg_start)
                s *= np.exp(-h * seg)
                t_rem -= seg
                if t_rem <= 0: break
            return s

        # Solve for hazard rate lambda in [prev_tenor, T] via root finding
        def equation(lam: float) -> float:
            pv_prot = 0.0
            pv_fee  = 0.0
            for t in times:
                q_prev = survival(t - dt) if t - dt > prev_tenor else prev_surv
                q_lam  = q_prev * np.exp(-lam * min(dt, t - prev_tenor))
                df = np.exp(-r * t)
                pv_prot += (1 - recovery) * (q_prev - q_lam) * df
                pv_fee  += S * dt * q_lam * df
            return pv_prot - pv_fee

        # Bisection
        lo, hi = 0.0, 5.0
        for _ in range(60):
            mid = (lo + hi) / 2
            if equation(mid) > 0: lo = mid
            else:                  hi = mid
        hazards.append((lo + hi) / 2)
        prev_tenor = T
        prev_surv  = survival(T)

    return hazards

tenors = [1, 3, 5, 7, 10]
spreads = [0.0050, 0.0080, 0.0110, 0.0130, 0.0150]  # 50,80,110,130,150 bps
h = bootstrap_hazard_rates(tenors, spreads)
for t, lam in zip(tenors, h):
    print(f"Tenor {t:2d}Y: hazard = {lam*10000:.2f} bps/yr, "
          f"implied PD = {(1-np.exp(-lam*t))*100:.2f}%")`,
    explanation:
      "CDS hazard rate bootstrapping extracts the implied default intensity from market spreads sequentially — each new tenor's hazard rate is solved while holding earlier hazard rates fixed, analogous to bootstrapping a yield curve from discount factors. The protection leg PV integrates hazard against the discount curve, while the fee leg discounts coupon payments weighted by the survival probability.",
  },
  {
    id: "pyfin-20260707-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading: Dynamic Hedge Ratio",
    tag: "finance",
    code: `import numpy as np

def kalman_filter_pairs(
    y: np.ndarray,  # price series of asset Y (dependent)
    x: np.ndarray,  # price series of asset X (independent)
    delta: float = 1e-4,   # state noise: higher = faster adaptation
    obs_noise: float = 1e-3,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Estimate dynamic hedge ratio beta_t: Y_t = alpha_t + beta_t * X_t + eps_t
    State vector: [alpha, beta]; observation: Y_t
    """
    n = len(y)
    # State: [alpha, beta]
    theta = np.zeros(2)                      # initial state
    P     = np.eye(2) * obs_noise            # state covariance
    R     = obs_noise                         # observation noise variance
    Q     = delta / (1 - delta) * np.eye(2) # state transition noise

    alphas = np.zeros(n)
    betas  = np.zeros(n)
    spreads= np.zeros(n)

    for t in range(n):
        F = np.array([1.0, x[t]])           # observation matrix

        # Predict
        # theta_{t|t-1} = theta_{t-1} (random walk)
        P_pred = P + Q

        # Update
        S      = F @ P_pred @ F + R         # innovation variance
        K      = P_pred @ F / S             # Kalman gain
        e      = y[t] - F @ theta           # innovation
        theta  = theta + K * e
        P      = (np.eye(2) - np.outer(K, F)) @ P_pred

        alphas[t]  = theta[0]
        betas[t]   = theta[1]
        spreads[t] = e  # residual spread

    return alphas, betas, spreads

# Simulate two cointegrated price series
np.random.seed(42)
n = 500
X = np.cumsum(np.random.randn(n)) + 100
Y = 1.5 * X + np.random.randn(n) * 0.5  # true beta=1.5

alphas, betas, spreads = kalman_filter_pairs(Y, X)
print(f"Final beta estimate: {betas[-1]:.4f}  (true=1.5)")
print(f"Spread mean: {spreads.mean():.4f}, std: {spreads.std():.4f}")
# Z-score signal: enter when |spread| > 2 sigma
z_score = spreads / spreads.std()
signals = (abs(z_score) > 2).sum()
print(f"Trading signals generated: {signals}")`,
    explanation:
      "The Kalman filter treats the hedge ratio as a latent state that evolves as a random walk — the delta parameter controls the state noise variance, with higher delta making the hedge ratio adapt faster to structural changes in the cointegration relationship but at the cost of more false re-entry signals. The innovation e at each step is the trading spread: a z-score of the spread provides a mean-reversion signal that automatically adjusts as the estimated beta shifts.",
  },
  {
    id: "pyfin-20260707-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Vol Monte Carlo with Full Truncation",
    tag: "finance",
    code: `import numpy as np

def heston_mc(
    S0: float, K: float, T: float, r: float,
    v0: float, kappa: float, theta: float, xi: float, rho: float,
    n_paths: int = 50_000, n_steps: int = 252,
) -> float:
    """
    Heston model: dS = r S dt + sqrt(v) S dW1
                  dv = kappa*(theta-v) dt + xi*sqrt(v) dW2
                  dW1 dW2 = rho dt
    Full-truncation scheme: clamp v to 0 before use (Andersen-Broadie).
    """
    dt   = T / n_steps
    disc = np.exp(-r * T)

    S = np.full(n_paths, S0)
    v = np.full(n_paths, v0)

    sqrt_dt = np.sqrt(dt)
    rng = np.random.default_rng(42)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rng.standard_normal(n_paths)
        W1 = Z1
        W2 = rho * Z1 + np.sqrt(1 - rho**2) * Z2

        v_pos = np.maximum(v, 0.0)            # full truncation
        sqrt_v = np.sqrt(v_pos)

        S = S * np.exp((r - 0.5 * v_pos) * dt + sqrt_v * sqrt_dt * W1)
        v = v + kappa * (theta - v_pos) * dt + xi * sqrt_v * sqrt_dt * W2

    payoffs = np.maximum(S - K, 0.0)
    return disc * payoffs.mean()

# Heston call: S=100, K=100, T=1yr, r=2%
# Typical EURUSD Heston params
price = heston_mc(
    S0=100, K=100, T=1.0, r=0.02,
    v0=0.04, kappa=2.0, theta=0.04, xi=0.3, rho=-0.7,
    n_paths=100_000,
)
print(f"Heston call price: {price:.4f}")  # ~6.7 depending on params`,
    explanation:
      "The full-truncation scheme (v_pos = max(v,0)) prevents the variance process from going negative due to discretisation error, which would cause sqrt(v) to blow up — unlike reflection (abs(v)) it keeps the drift term correct at v=0. A negative rho of -0.7 creates the leverage effect seen in equity markets where volatility spikes when prices fall, generating a pronounced left-skew in the implied vol smile.",
  },
  {
    id: "pyfin-20260707-b1-garch-fit",
    language: "python",
    title: "GARCH(1,1) Maximum Likelihood Estimation",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_loglik(params, returns: np.ndarray) -> float:
    """Negative log-likelihood for GARCH(1,1): sigma^2_t = omega + alpha*r^2_{t-1} + beta*sigma^2_{t-1}"""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e9  # constraint violation
    T = len(returns)
    sigma2 = np.empty(T)
    sigma2[0] = np.var(returns)  # initialise to unconditional variance
    for t in range(1, T):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
    # Gaussian log-likelihood: -0.5 * (log(2pi) + log(sigma^2) + r^2/sigma^2)
    llk = -0.5 * np.sum(np.log(2 * np.pi) + np.log(sigma2) + returns**2 / sigma2)
    return -llk  # return negative because we minimise

def fit_garch(returns: np.ndarray) -> dict:
    result = minimize(
        garch_loglik, x0=[1e-5, 0.1, 0.8],
        args=(returns,),
        method='L-BFGS-B',
        bounds=[(1e-7, None), (0, 1), (0, 1)],
    )
    omega, alpha, beta = result.x
    uncon_var = omega / (1 - alpha - beta)
    return {
        'omega': omega, 'alpha': alpha, 'beta': beta,
        'persistence': alpha + beta,
        'unconditional_vol': np.sqrt(uncon_var * 252),  # annualised
    }

np.random.seed(42)
# Simulate GARCH(1,1) returns
n = 2000
returns = np.zeros(n)
sigma2  = np.zeros(n)
sigma2[0] = 0.0001
for t in range(1, n):
    sigma2[t] = 2e-6 + 0.08 * returns[t-1]**2 + 0.9 * sigma2[t-1]
    returns[t] = np.random.randn() * np.sqrt(sigma2[t])

params = fit_garch(returns)
print(f"omega={params['omega']:.2e}, alpha={params['alpha']:.4f}, "
      f"beta={params['beta']:.4f}")
print(f"Persistence: {params['persistence']:.4f}")
print(f"Unconditional vol (ann.): {params['unconditional_vol']:.2%}")`,
    explanation:
      "GARCH(1,1) captures volatility clustering: large shocks increase sigma^2_t, which decays slowly when alpha+beta is close to 1 (high persistence). The MLE objective is straightforward but non-convex, so the initial guess matters; starting from (alpha=0.1, beta=0.8) places the search near typical equity GARCH estimates and avoids the degenerate region near the boundary alpha+beta=1.",
  },
  {
    id: "pyfin-20260707-b1-cointegration",
    language: "python",
    title: "Engle-Granger Cointegration Test for Pairs Selection",
    tag: "finance",
    code: `import numpy as np
from scipy import stats

def adf_test(series: np.ndarray, max_lag: int = 5) -> tuple[float, float]:
    """Simplified ADF test: regress delta_y on y_{t-1} and lags of delta_y."""
    dy = np.diff(series)
    n  = len(dy)

    # Determine optimal lag via AIC
    best_aic = np.inf
    best_lag = 0
    for lag in range(max_lag + 1):
        if lag >= n - 1: break
        X_rows = []
        for t in range(lag, n):
            row = [series[t], *dy[max(0, t-lag):t][::-1]] if lag > 0 else [series[t]]
            X_rows.append(row)
        X = np.array(X_rows)
        y = dy[lag:]
        try:
            beta = np.linalg.lstsq(X, y, rcond=None)[0]
            resid = y - X @ beta
            aic = n * np.log(np.var(resid)) + 2 * (lag + 1)
            if aic < best_aic:
                best_aic, best_lag = aic, lag
        except Exception:
            pass

    lag = best_lag
    X_rows = []
    for t in range(lag, n):
        row = [series[t], *dy[max(0, t-lag):t][::-1]] if lag > 0 else [series[t]]
        X_rows.append(row)
    X = np.array(X_rows)
    y = dy[lag:]
    beta, _, _, _ = np.linalg.lstsq(X, y, rcond=None)
    resid = y - X @ beta
    se    = np.sqrt(np.sum(resid**2) / (len(y) - len(beta)) / np.sum((series[lag:] - series[lag:].mean())**2))
    t_stat = beta[0] / se  # t-statistic on lagged level

    # MacKinnon approximate critical values (no trend)
    # -3.43 @ 1%, -2.86 @ 5%, -2.57 @ 10% for n >= 500
    crit_5pct = -2.86
    return t_stat, crit_5pct

def engle_granger(y: np.ndarray, x: np.ndarray) -> dict:
    """Engle-Granger two-step cointegration test."""
    # Step 1: OLS regression
    X  = np.column_stack([np.ones(len(x)), x])
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    residuals = y - X @ beta

    # Step 2: ADF test on residuals
    t_stat, crit = adf_test(residuals)
    return {
        'alpha': beta[0], 'beta': beta[1],
        'adf_stat': t_stat, 'crit_5pct': crit,
        'cointegrated': t_stat < crit,
        'residuals': residuals,
    }

np.random.seed(42)
n = 500
X = np.cumsum(np.random.randn(n))          # I(1)
Y = 1.8 * X + 0.5 + np.random.randn(n)    # cointegrated with beta=1.8

result = engle_granger(Y, X)
print(f"Beta: {result['beta']:.3f}  (true=1.8)")
print(f"ADF statistic: {result['adf_stat']:.3f}  (5% critical: {result['crit_5pct']:.2f})")
print(f"Cointegrated: {result['cointegrated']}")`,
    explanation:
      "The Engle-Granger test checks whether two I(1) series share a common stochastic trend: if the OLS residuals are stationary (ADF rejects the unit root), the series are cointegrated and the spread will mean-revert. The critical values for the ADF statistic on residuals are more negative than the standard Dickey-Fuller values because the regression introduces bias — using the wrong critical value overstates the evidence for cointegration.",
  },
  {
    id: "pyfin-20260707-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory: Peaks-Over-Threshold VaR",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import genpareto

def pot_var_es(
    losses: np.ndarray, threshold_quantile: float = 0.95, conf: float = 0.99
) -> tuple[float, float]:
    """
    Peaks-Over-Threshold (POT) method:
    1. Fit Generalised Pareto Distribution (GPD) to exceedances over threshold u.
    2. Extrapolate VaR and ES at confidence level conf.
    """
    u      = np.quantile(losses, threshold_quantile)
    excesses = losses[losses > u] - u  # excess losses over threshold
    N_total = len(losses)
    N_u     = len(excesses)

    # Fit GPD: shape xi, scale sigma via MLE
    xi, loc, sigma = genpareto.fit(excesses, floc=0)

    # GPD VaR formula: VaR = u + (sigma/xi)*[(N/N_u * (1-conf))^{-xi} - 1]
    p_excess = N_u / N_total  # fraction above threshold
    z = (1 - conf) / p_excess

    if abs(xi) < 1e-8:  # exponential limit
        var_excess = sigma * np.log(1 / z)
    else:
        var_excess = sigma / xi * (z**(-xi) - 1)

    var = u + var_excess

    # Expected Shortfall = (VaR + sigma - xi*u) / (1 - xi)
    es = (var + sigma - xi * u) / (1 - xi) if xi < 1 else np.inf

    return var, es

np.random.seed(42)
# Simulate fat-tailed losses (Student-t with 4 dof, typical equity)
losses = np.random.standard_t(df=4, size=5000) * 0.01  # daily log-returns
losses = -losses  # convert returns to losses (positive = bad)

var99, es99 = pot_var_es(losses, threshold_quantile=0.90, conf=0.99)
print(f"POT VaR (99%): {var99:.4f}  ({var99*100:.2f}%)")
print(f"POT ES  (99%): {es99:.4f}  ({es99*100:.2f}%)")

# Compare to historical VaR
hist_var = np.quantile(losses, 0.99)
print(f"Historical VaR: {hist_var:.4f}")`,
    explanation:
      "EVT's POT method extrapolates beyond the empirical distribution using the mathematical result that exceedances over a high threshold converge to a GPD regardless of the underlying distribution — crucial for tail risk where the historical sample rarely contains enough extreme observations. A positive shape parameter xi > 0 indicates a heavy tail (power law decay), while xi < 0 implies a bounded distribution; fat-tailed financial returns typically yield xi ≈ 0.2–0.4.",
  },
  {
    id: "pyfin-20260707-b1-copula-var",
    language: "python",
    title: "Gaussian Copula Portfolio VaR via Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_var(
    weights: np.ndarray,
    vols: np.ndarray,
    corr: np.ndarray,
    horizon: float = 1 / 252,
    conf: float = 0.99,
    n_sim: int = 100_000,
) -> float:
    """
    Simulate correlated daily returns via a Gaussian copula:
    1. Draw correlated normals using Cholesky decomposition of the correlation matrix.
    2. Convert to returns using portfolio weights and asset volatilities.
    3. Compute VaR as the conf-th quantile of portfolio loss.
    """
    n = len(weights)
    L = np.linalg.cholesky(corr)          # lower triangular Cholesky factor

    rng = np.random.default_rng(42)
    Z   = rng.standard_normal((n_sim, n)) # independent standard normals
    W   = Z @ L.T                          # correlated normals (Cholesky method)

    # Scale to daily returns: r_i = vol_i * sqrt(horizon) * W_i
    returns = W * vols * np.sqrt(horizon)  # shape (n_sim, n)

    # Portfolio P&L (assuming unit weights in weights[] or dollar positions)
    portfolio_pnl = returns @ weights

    # VaR = -(1-conf) quantile of portfolio P&L (loss convention)
    var = -np.quantile(portfolio_pnl, 1 - conf)
    return var

# Example: 3-asset portfolio (equities)
weights = np.array([0.5, 0.3, 0.2])    # portfolio weights
vols    = np.array([0.20, 0.25, 0.15]) # annual vols
corr    = np.array([                    # correlation matrix
    [1.00, 0.65, 0.50],
    [0.65, 1.00, 0.40],
    [0.50, 0.40, 1.00],
])

var = gaussian_copula_var(weights, vols, corr, conf=0.99)
print(f"1-day 99% VaR: {var:.4f}  ({var*100:.2f}% of portfolio)")`,
    explanation:
      "The Gaussian copula separates the marginal return distributions from the dependence structure: Cholesky of the correlation matrix maps independent normals into correlated ones while preserving the marginal Gaussian shape. Copulas matter for tail risk because correlations spike during crises — a Gaussian copula underestimates joint tail losses compared to a t-copula with the same linear correlations, which is why the 2008 CDO crisis is partly attributed to over-reliance on Gaussian copulas.",
  },
  {
    id: "pyfin-20260707-b1-factor-pca",
    language: "python",
    title: "PCA Factor Risk Model for Equity Returns",
    tag: "finance",
    code: `import numpy as np

def pca_factor_model(
    returns: np.ndarray,  # (T, N) matrix: T days, N assets
    n_factors: int = 5,
) -> dict:
    """
    Extract PCA factor model: R = B @ F + E
    B: (N, k) factor loadings; F: (k, T) factor returns; E: (N, N) idiosyncratic cov.
    """
    T, N = returns.shape
    # Demean
    R = returns - returns.mean(axis=0)

    # Sample covariance matrix
    Sigma = R.T @ R / (T - 1)  # (N, N)

    # Eigen-decomposition (sorted descending)
    eigenvalues, eigenvectors = np.linalg.eigh(Sigma)
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues  = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]  # columns are eigenvectors

    # Factor loadings: first k eigenvectors scaled by sqrt(lambda)
    B = eigenvectors[:, :n_factors] * np.sqrt(eigenvalues[:n_factors])  # (N, k)

    # Factor returns: projection of asset returns onto factor space
    F = (eigenvectors[:, :n_factors].T @ R.T)  # (k, T)

    # Idiosyncratic variance (diagonal of residual covariance)
    R_hat    = (B @ F).T          # (T, N) reconstructed returns
    residuals = R - R_hat
    D = np.diag(np.var(residuals, axis=0))  # (N, N) diagonal

    # Explained variance
    total_var  = eigenvalues.sum()
    explained  = eigenvalues[:n_factors].sum() / total_var

    return {
        'loadings': B,       # (N, k)
        'factors':  F,       # (k, T)
        'idio_cov': D,       # (N, N) diagonal
        'factor_cov': np.cov(F),  # (k, k)
        'explained_variance': explained,
        'eigenvalues': eigenvalues[:n_factors],
    }

np.random.seed(42)
T, N = 500, 50  # 500 days, 50 assets
# Simulate 3 common factors + idiosyncratic noise
F_true = np.random.randn(3, T)
B_true = np.random.randn(N, 3) * 0.3
returns = (B_true @ F_true).T + np.random.randn(T, N) * 0.01

result = pca_factor_model(returns, n_factors=5)
print(f"Variance explained by 5 PCs: {result['explained_variance']:.1%}")
print(f"Factor loadings shape: {result['loadings'].shape}")
print(f"Top eigenvalues: {np.round(result['eigenvalues'], 4)}")`,
    explanation:
      "PCA extracts orthogonal factors that maximize explained variance — the first PC typically represents the market factor (beta), subsequent PCs capture sector or style tilts. Scaling eigenvectors by sqrt(lambda) gives loadings with the intuition that a 1-unit change in the factor score corresponds to a loading-sized change in returns, matching the Barra/Axioma factor model convention used in industry risk systems.",
  },
  {
    id: "pyfin-20260707-b1-kelly-sizing",
    language: "python",
    title: "Fractional Kelly Criterion with Estimation Error Penalty",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def fractional_kelly(
    mu: float,        # expected excess return (daily)
    sigma: float,     # daily volatility
    kelly_fraction: float = 0.5,  # half-Kelly is standard industry practice
    max_leverage: float = 2.0,
) -> dict:
    """
    Full Kelly: f* = mu / sigma^2  (maximises log-wealth growth rate).
    Fractional Kelly scales by a fraction to account for estimation error.
    """
    f_kelly = mu / sigma**2
    f_frac  = kelly_fraction * f_kelly
    f_capped = np.clip(f_frac, -max_leverage, max_leverage)

    # Growth rate: g(f) = f*mu - 0.5*f^2*sigma^2
    growth_full   = f_kelly * mu - 0.5 * f_kelly**2 * sigma**2
    growth_frac   = f_capped * mu - 0.5 * f_capped**2 * sigma**2

    # Ruin probability under geometric Brownian motion with drift
    # P(ruin) for a fraction f: exp(-2*f*mu/sigma^2) for infinite horizon
    p_ruin = np.exp(-2 * max(f_capped, 0) * mu / sigma**2) if f_capped > 0 else 1.0

    return {
        'kelly_f': f_kelly,
        'fractional_f': f_capped,
        'daily_growth_full_kelly': growth_full,
        'daily_growth_fractional': growth_frac,
        'sharpe': mu / sigma * np.sqrt(252),
        'ruin_probability': p_ruin,
    }

# Example: strategy with Sharpe = 1.5 annualised
daily_mu    = 0.001       # 0.1% expected daily return
daily_sigma = 0.012       # 1.2% daily vol  -> Sharpe ~1.3

result = fractional_kelly(daily_mu, daily_sigma, kelly_fraction=0.5)
print(f"Full Kelly leverage:       {result['kelly_f']:.2f}x")
print(f"Half-Kelly leverage:       {result['fractional_f']:.2f}x")
print(f"Daily log-growth (half K): {result['daily_growth_fractional']*252:.4f} annualised")
print(f"Ruin probability:          {result['ruin_probability']:.4f}")`,
    explanation:
      "Full Kelly maximises the expected log growth rate but is extremely sensitive to mu estimation errors — a 10% overestimate of mu nearly doubles the Kelly bet, causing severe drawdowns. Half-Kelly cuts the growth rate by 25% but halves the expected maximum drawdown and is the standard in quantitative trading for strategies where the edge is uncertain. The ruin probability formula assumes GBM and infinite horizon, providing a lower bound on actual finite-horizon ruin.",
  },
  {
    id: "pyfin-20260707-b1-market-impact",
    language: "python",
    title: "Almgren-Chriss Optimal Execution with Market Impact",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X0: float,     # initial shares to liquidate
    T: float,      # liquidation horizon (days)
    N: int,        # number of trading intervals
    sigma: float,  # daily vol (as fraction)
    eta: float,    # temporary impact coefficient
    gamma: float,  # permanent impact coefficient
    lam: float,    # risk-aversion parameter
) -> tuple[np.ndarray, np.ndarray]:
    """
    Almgren-Chriss (2001): optimal liquidation trajectory.
    Minimises E[Cost] + lam * Var[Cost].
    Closed-form solution: exponential decay schedule.
    """
    tau = T / N  # interval length

    # A-C closed-form: x_j = X0 * sinh(kappa*(T - j*tau)) / sinh(kappa*T)
    kappa_sq = lam * sigma**2 / eta
    kappa    = np.sqrt(kappa_sq)

    times = np.arange(0, N + 1) * tau   # trading times
    holdings = X0 * np.sinh(kappa * (T - times)) / np.sinh(kappa * T)
    trades   = -np.diff(holdings)        # shares sold at each step

    # Expected cost
    perm_cost = 0.5 * gamma * X0**2
    temp_cost = eta / tau * np.sum(trades**2)
    risk_cost = 0.5 * lam * sigma**2 * tau * np.sum(holdings[:-1]**2)

    return holdings, trades

# Liquidate 1M shares over 5 days, 30-min intervals (N=10)
holdings, trades = almgren_chriss_trajectory(
    X0=1_000_000, T=5, N=10,
    sigma=0.02, eta=0.1e-6, gamma=0.05e-6, lam=1e-6,
)
print("Holding schedule (every 0.5 days):")
for i, h in enumerate(holdings):
    print(f"  t={i*0.5:.1f}d: {h:,.0f} shares")
print(f"\\nFirst trade: {-trades[0]:,.0f} shares  Last trade: {-trades[-1]:,.0f} shares")`,
    explanation:
      "Almgren-Chriss trades off market impact (minimised by trading slowly) against timing risk (minimised by trading fast). The closed-form solution is a hyperbolic sine schedule: near risk-neutral (lam->0) it converges to TWAP (uniform), while high risk-aversion produces a front-loaded schedule that clears inventory quickly to avoid drift risk. The permanent impact cost is sunk (independent of schedule) and depends only on the total quantity traded.",
  },
  {
    id: "pyfin-20260707-b1-regime-hmm",
    language: "python",
    title: "Hidden Markov Model for Volatility Regime Detection",
    tag: "finance",
    code: `import numpy as np

def hmm_viterbi_2state(
    obs: np.ndarray,   # observed log-returns
    max_iter: int = 50,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    2-state Gaussian HMM (low vol / high vol) via Baum-Welch + Viterbi.
    Returns (states, means, vols) where states[t] in {0=low, 1=high}.
    """
    T = len(obs)
    # Initialize: low-vol state = small mean, high-vol = large vol
    pi = np.array([0.7, 0.3])          # initial distribution
    A  = np.array([[0.95, 0.05],       # transition matrix
                   [0.20, 0.80]])
    mu  = np.array([obs.mean(), obs.mean()])
    sig = np.array([obs.std() * 0.6, obs.std() * 1.6])

    def emission(obs_t):
        """Gaussian emission probabilities for both states."""
        return np.exp(-0.5 * ((obs_t - mu) / sig)**2) / (sig * np.sqrt(2*np.pi))

    # Viterbi (decode most likely state sequence)
    delta = np.zeros((T, 2))
    psi   = np.zeros((T, 2), dtype=int)
    delta[0] = pi * emission(obs[0])

    for t in range(1, T):
        e = emission(obs[t])
        for j in range(2):
            trans = delta[t-1] * A[:, j]
            psi[t, j]   = np.argmax(trans)
            delta[t, j] = trans[psi[t, j]] * e[j]
        # Rescale to prevent underflow
        delta[t] /= delta[t].sum()

    # Backtrack
    states = np.zeros(T, dtype=int)
    states[-1] = np.argmax(delta[-1])
    for t in range(T-2, -1, -1):
        states[t] = psi[t+1, states[t+1]]

    return states, mu, sig

np.random.seed(42)
# Simulate 2-state vol process
T = 1000
state_seq = np.zeros(T, dtype=int)
obs = np.zeros(T)
state = 0
for t in range(T):
    state_seq[t] = state
    obs[t] = np.random.randn() * (0.01 if state == 0 else 0.03)
    state = np.random.choice([0,1], p=[0.95 if state==0 else 0.2,
                                        0.05 if state==0 else 0.80])

states, mu, sig = hmm_viterbi_2state(obs)
accuracy = (states == state_seq).mean()
print(f"Viterbi accuracy: {accuracy:.1%}")
print(f"Low-vol  state:  mu={mu[0]:.5f}, sigma={sig[0]:.4f}")
print(f"High-vol state:  mu={mu[1]:.5f}, sigma={sig[1]:.4f}")
print(f"High-vol fraction: {states.mean():.1%}  (true: {state_seq.mean():.1%})")`,
    explanation:
      "The Viterbi algorithm finds the maximum a-posteriori state sequence in O(T * K^2) — exponentially faster than enumerating all K^T paths. Rescaling the delta matrix at each step prevents numerical underflow without changing the argmax. In practice, regime-switching models identify distinct risk environments (crisis vs. calm) that correlate with tail risk and allow dynamic hedging overlays triggered by regime transitions.",
  },
  {
    id: "pyfin-20260707-b1-cvxpy-portfolio",
    language: "python",
    title: "Mean-CVaR Portfolio Optimization with cvxpy",
    tag: "finance",
    code: `import numpy as np
try:
    import cvxpy as cp
    HAS_CVXPY = True
except ImportError:
    HAS_CVXPY = False

def mean_cvar_optimize(
    returns: np.ndarray,  # (T, N) historical returns
    target_return: float,
    alpha: float = 0.05,  # CVaR level (5% worst losses)
) -> np.ndarray:
    """
    Minimize CVaR subject to minimum return constraint.
    Rockafellar-Uryasev (2000) linear reformulation.
    """
    if not HAS_CVXPY:
        raise ImportError("pip install cvxpy")
    T, N = returns.shape
    w   = cp.Variable(N)              # portfolio weights
    eta = cp.Variable()               # VaR threshold
    u   = cp.Variable(T)              # auxiliary loss variables

    # Scenario losses: loss[s] = -returns[s] @ w
    losses = -returns @ w

    # CVaR linearization: CVaR = eta + (1/T*alpha) * sum(max(loss - eta, 0))
    cvar = eta + (1 / (T * alpha)) * cp.sum(u)

    constraints = [
        u >= losses - eta,
        u >= 0,
        cp.sum(w) == 1,
        w >= 0,                        # long only
        returns.mean(axis=0) @ w >= target_return,
    ]

    prob = cp.Problem(cp.Minimize(cvar), constraints)
    prob.solve(solver=cp.CLARABEL, verbose=False)

    return w.value if w.value is not None else np.ones(N) / N

np.random.seed(42)
T, N = 250, 10
mu_true  = np.random.uniform(0.0005, 0.002, N)
cov_true = np.eye(N) * 0.0004 + np.ones((N,N)) * 0.0001
returns  = np.random.multivariate_normal(mu_true, cov_true, T)

if HAS_CVXPY:
    w = mean_cvar_optimize(returns, target_return=0.001)
    print("Optimal weights:", np.round(w, 4))
    port_ret = returns @ w
    cvar_95  = -np.quantile(port_ret, 0.05)
    print(f"In-sample CVaR(5%): {cvar_95:.4f}")
else:
    print("Install cvxpy to run: pip install cvxpy")`,
    explanation:
      "Mean-CVaR optimization is preferred over mean-variance in fat-tailed return environments because CVaR penalizes extreme losses rather than symmetric variance — it captures downside risk that variance ignores. The Rockafellar-Uryasev reformulation converts the non-linear CVaR objective into a linear program by introducing auxiliary variables u_t = max(loss_t - eta, 0), making it solvable with standard LP solvers at the same complexity as mean-variance.",
  },
  {
    id: "pyfin-20260707-b1-quantlib-bond",
    language: "python",
    title: "QuantLib: Fixed-Rate Bond Pricing and Yield",
    tag: "finance",
    code: `# Requires: pip install QuantLib-Python
try:
    import QuantLib as ql
    HAS_QL = True
except ImportError:
    HAS_QL = False
    print("Install QuantLib: pip install QuantLib-Python")

def price_fixed_rate_bond(
    settlement_date: tuple,  # (year, month, day)
    maturity_date:   tuple,
    coupon_rate: float,
    face_value: float,
    flat_yield: float,
    frequency: int = 2,      # semiannual
) -> dict:
    if not HAS_QL:
        return {}
    cal  = ql.UnitedStates(ql.UnitedStates.GovernmentBond)
    dc   = ql.ActualActual(ql.ActualActual.Bond)
    settle = ql.Date(*settlement_date)
    mature = ql.Date(*maturity_date)

    schedule = ql.Schedule(
        settle, mature,
        ql.Period(frequency == 2 and ql.Semiannual or ql.Annual),
        cal,
        ql.Unadjusted, ql.Unadjusted,
        ql.DateGeneration.Backward, False,
    )

    bond = ql.FixedRateBond(
        3,           # settlement days
        face_value,
        schedule,
        [coupon_rate],
        dc,
    )

    flat_curve = ql.FlatForward(
        settle, ql.QuoteHandle(ql.SimpleQuote(flat_yield)),
        dc, ql.Compounded, ql.Semiannual
    )
    engine = ql.DiscountingBondEngine(ql.YieldTermStructureHandle(flat_curve))
    bond.setPricingEngine(engine)

    dirty_price = bond.dirtyPrice()
    clean_price = bond.cleanPrice()
    ytm         = bond.bondYield(dc, ql.Compounded, ql.Semiannual) * 100
    duration    = ql.BondFunctions.duration(bond, flat_curve,
                                             ql.Duration.Modified)
    return {
        'clean_price': clean_price,
        'dirty_price': dirty_price,
        'ytm_pct': ytm,
        'modified_duration': duration,
    }

if HAS_QL:
    result = price_fixed_rate_bond(
        settlement_date=(2024, 1, 15),
        maturity_date=(2034, 1, 15),
        coupon_rate=0.045,
        face_value=1_000_000,
        flat_yield=0.040,
    )
    print(f"Clean price:       {result['clean_price']:,.2f}")
    print(f"YTM:               {result['ytm_pct']:.4f}%")
    print(f"Modified duration: {result['modified_duration']:.4f}")`,
    explanation:
      "QuantLib's bond pricing engine builds a fully-specified cash flow schedule using a business-day calendar and day-count convention, then discounts each coupon and principal payment using the attached yield curve handle — the handle mechanism allows live yield curve updates without rebuilding the bond object. Modified duration measures DV01 (dollar value of a 1 bp rate move) and is essential for hedging: a 10Y bond with modified duration ~8 loses about 8% clean price for a 100 bp rate rise.",
  },
  {
    id: "pyfin-20260707-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep Out-of-the-Money Options",
    tag: "finance",
    code: `import numpy as np

def otm_call_importance_sampling(
    S0: float, K: float, T: float, r: float, sigma: float,
    n_paths: int = 100_000,
) -> tuple[float, float]:
    """
    Price a deep OTM call via importance sampling (IS).
    Shift the drift so that S_T ends near K, re-weight by the likelihood ratio.
    Naive MC has most paths ending far below K (zero payoff) — IS fixes this.
    """
    # Optimal drift shift: mu* = (log(K/S0) - (r - sigma^2/2)*T) / (sigma*sqrt(T))
    # This centres the distribution at the strike
    z_star = (np.log(K / S0) - (r - 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))

    rng = np.random.default_rng(42)
    Z   = rng.standard_normal(n_paths) + z_star  # shifted normals

    # Terminal spot under IS measure
    S_T = S0 * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * (Z - z_star))

    # Likelihood ratio: dP/dQ = exp(-z* * Z + 0.5 * z*^2)
    LR  = np.exp(-z_star * Z + 0.5 * z_star**2)

    payoffs = np.maximum(S_T - K, 0.0) * LR * np.exp(-r * T)
    price   = payoffs.mean()
    stderr  = payoffs.std() / np.sqrt(n_paths)
    return price, stderr

# Deep OTM call: S=100, K=130, 1 year, r=5%, sigma=20%
price_is, se_is = otm_call_importance_sampling(100, 130, 1.0, 0.05, 0.20)

# Black-Scholes reference
from scipy.stats import norm
d1 = (np.log(100/130) + (0.05 + 0.5*0.04)*1) / (0.2)
d2 = d1 - 0.2
bs = 100 * norm.cdf(d1) - 130 * np.exp(-0.05) * norm.cdf(d2)
print(f"IS price: {price_is:.6f}  (se={se_is:.2e})")
print(f"BS exact: {bs:.6f}")`,
    explanation:
      "For a deep OTM option, naive Monte Carlo wastes nearly all samples on zero-payoff paths, giving an estimator with huge relative error. Importance sampling shifts the simulation measure to one where S_T is centred near K, then corrects the expectation via the likelihood ratio (Radon-Nikodym derivative) — the estimator remains unbiased but variance drops dramatically. The drift shift z* is chosen to match the mean of the IS distribution to the log-moneyness, which is the optimal shift under a Gaussian model.",
  },
  {
    id: "pyfin-20260707-b1-statsmodels-arima",
    language: "python",
    title: "ARIMA Spread Forecast with statsmodels",
    tag: "finance",
    code: `import numpy as np
try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.stattools import adfuller
    HAS_SM = True
except ImportError:
    HAS_SM = False

def fit_arima_spread(spread: np.ndarray, max_ar: int = 3, max_ma: int = 2) -> dict:
    if not HAS_SM:
        return {'error': 'pip install statsmodels'}

    # ADF test to check stationarity
    adf_stat, p_val, _, _, _, _ = adfuller(spread, autolag='AIC')

    # Grid search AIC to find best (p, d, q)
    best_aic = np.inf
    best_order = (1, 0, 1)
    d = 0 if p_val < 0.05 else 1  # difference if non-stationary

    for p in range(max_ar + 1):
        for q in range(max_ma + 1):
            try:
                model = ARIMA(spread, order=(p, d, q))
                fit   = model.fit()
                if fit.aic < best_aic:
                    best_aic   = fit.aic
                    best_order = (p, d, q)
            except Exception:
                pass

    # Fit best model and forecast
    model = ARIMA(spread, order=best_order)
    fit   = model.fit()
    forecast = fit.forecast(steps=5)

    return {
        'order': best_order,
        'aic': best_aic,
        'params': fit.params.to_dict(),
        'forecast_5d': forecast.values,
        'adf_stat': adf_stat,
        'adf_pval': p_val,
        'is_stationary': p_val < 0.05,
    }

# Simulate a mean-reverting spread (AR(1))
np.random.seed(42)
n = 500
spread = np.zeros(n)
for t in range(1, n):
    spread[t] = 0.8 * spread[t-1] + np.random.randn() * 0.5

result = fit_arima_spread(spread)
print(f"Best ARIMA order: {result.get('order')}")
print(f"AIC: {result.get('aic', 'N/A'):.2f}")
print(f"5-day forecast: {np.round(result.get('forecast_5d', []), 4)}")
print(f"Stationary: {result.get('is_stationary')}")`,
    explanation:
      "Automatic ARIMA selection via AIC avoids overfitting: AIC penalizes model complexity (number of parameters) so it prefers a parsimonious model unless additional lags genuinely improve the log-likelihood. For pairs-trading spreads that are I(1) (non-stationary), setting d=1 differences the series before fitting — but cointegrated spreads are already I(0), so d=0 is usually correct and confirmed by the ADF test.",
  },
  {
    id: "pyfin-20260707-b1-vectorbt-backtest",
    language: "python",
    title: "Momentum Backtest with Transaction Costs (NumPy)",
    tag: "finance",
    code: `import numpy as np

def backtest_momentum(
    prices: np.ndarray,          # daily close prices
    lookback: int = 20,          # momentum window
    cost_bps: float = 5.0,       # one-way transaction cost in bps
    rebalance_every: int = 5,    # rebalance frequency (days)
) -> dict:
    """
    Vectorised momentum backtest: buy when 20d return > 0, else flat.
    Accounts for slippage and bid-ask spread.
    """
    n = len(prices)
    returns = np.diff(np.log(prices))  # daily log-returns
    cost = cost_bps / 10_000

    signals = np.zeros(n)
    for t in range(lookback, n):
        if t % rebalance_every == 0:
            mom = prices[t] / prices[t - lookback] - 1
            signals[t] = 1.0 if mom > 0 else 0.0

    # Forward-fill signal (hold until next rebalance)
    for t in range(1, n):
        if signals[t] == 0 and t % rebalance_every != 0:
            signals[t] = signals[t - 1]

    # Compute strategy returns with transaction costs
    position_changes = np.abs(np.diff(signals, prepend=0))
    strat_returns = signals[1:] * returns - position_changes[1:] * cost

    # Performance metrics
    cum_ret   = np.expm1(np.sum(strat_returns))
    ann_ret   = (1 + cum_ret) ** (252 / len(strat_returns)) - 1
    ann_vol   = strat_returns.std() * np.sqrt(252)
    sharpe    = ann_ret / ann_vol if ann_vol > 0 else 0
    max_dd    = 1 - np.minimum.accumulate(np.exp(np.cumsum(strat_returns)))
    max_dd    = max_dd.max()

    return {
        'total_return': cum_ret,
        'ann_return': ann_ret,
        'ann_vol': ann_vol,
        'sharpe': sharpe,
        'max_drawdown': max_dd,
        'n_trades': int(position_changes.sum()),
    }

np.random.seed(42)
prices = 100 * np.exp(np.cumsum(np.random.randn(1000) * 0.012 + 0.0005))
stats  = backtest_momentum(prices, lookback=20, cost_bps=5)
for k, v in stats.items():
    print(f"{k:20s}: {v:.4f}")`,
    explanation:
      "Vectorised backtesting avoids Python loops by using NumPy array operations — the critical insight is that position_changes captures turnover, so multiplying by cost_bps/10000 applies the correct one-way cost on each rebalance. Failing to account for transaction costs typically overstates momentum Sharpe by 30-50% on daily signals, which is why cost modelling is a first-class concern in production backtesting.",
  },
];
