import type { Snippet } from "./types";

export const pythonFinanceSnippets20260806B1: Snippet[] = [
  {
    id: "pyfin-20260806-b1-control-variates",
    language: "python",
    title: "Monte Carlo Variance Reduction via Control Variates",
    tag: "monte-carlo",
    code: `import numpy as np

def bs_call_price(S, K, r, sigma, T):
    """Analytical Black-Scholes call — serves as the control variate."""
    from scipy.stats import norm
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_call_with_cv(S0, K, r, sigma, T, n_paths=100_000, seed=42):
    """
    Price a call via MC with Black-Scholes as control variate.
    The correlated estimator: Y_cv = Y - beta*(X - E[X])
    where X = BS payoff sample, E[X] = BS analytical price.
    """
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)
    ST  = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    disc = np.exp(-r*T)

    # Target payoff (e.g., at-the-money digital as illustration, using vanilla here)
    Y = disc * np.maximum(ST - K, 0)   # vanilla call payoff samples

    # Control variate: same payoff — useful when pricing a slightly different
    # claim, e.g., an arithmetic average (Y) controlled by geometric (X)
    # Here, we demonstrate the mechanics with perfect correlation
    X = disc * np.maximum(ST - K, 0)   # identical → beta=1, variance→0

    mu_X = bs_call_price(S0, K, r, sigma, T)  # known E[X]
    beta = np.cov(Y, X)[0,1] / np.var(X)      # OLS beta
    Y_cv = Y - beta * (X - mu_X)              # corrected estimator

    price_plain = Y.mean()
    price_cv    = Y_cv.mean()
    se_plain = Y.std() / np.sqrt(n_paths)
    se_cv    = Y_cv.std() / np.sqrt(n_paths)
    print(f"Plain MC:  {price_plain:.4f}  SE={se_plain:.5f}")
    print(f"CV MC:     {price_cv:.4f}  SE={se_cv:.5f}")
    print(f"Analytic:  {mu_X:.4f}")
    print(f"Variance reduction: {se_plain/se_cv:.1f}x")
    return price_cv

mc_call_with_cv(S0=100, K=100, r=0.05, sigma=0.20, T=1.0)`,
    explanation: "The control variate estimator exploits correlation between an expensive-to-evaluate payoff Y and a cheap-to-evaluate correlated payoff X whose expectation is known analytically. The OLS beta minimises variance: when Y and X are perfectly correlated the variance drops to zero. For Asian vs geometric Asian, typical variance reduction is 50-100x."
  },
  {
    id: "pyfin-20260806-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "monte-carlo",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_otm_call_is(S0, K, r, sigma, T, n_paths=50_000, seed=42):
    """
    Deep OTM call: naive MC wastes most paths on zero payoffs.
    Shift the sampling distribution mean so that paths cluster near K.

    Change of measure: sample Z ~ N(theta, 1) instead of N(0,1).
    Likelihood ratio (Radon-Nikodym): dP/dQ = exp(-theta*Z + 0.5*theta^2)
    """
    # Find optimal shift theta so that E_Q[ST] ≈ K
    # Under Q: ST = S0 * exp((r - 0.5*sigma^2)*T + sigma*sqrt(T)*(Z+theta))
    # Set S0 * exp((r - 0.5*sigma^2)*T + sigma*sqrt(T)*theta) = K
    theta = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / (sigma*np.sqrt(T))

    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)       # sample N(0,1)
    Z_shifted = Z + theta                    # effectively N(theta,1)

    ST = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z_shifted)
    payoff = np.maximum(ST - K, 0)

    # Likelihood ratio corrects the distribution back to P
    lr = np.exp(-theta*Z_shifted + 0.5*theta**2)
    disc = np.exp(-r*T)

    price_is   = disc * (payoff * lr).mean()
    se_is      = disc * (payoff * lr).std() / np.sqrt(n_paths)

    # Naive MC comparison
    Z2 = rng.standard_normal(n_paths)
    ST2 = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z2)
    price_plain = disc * np.maximum(ST2 - K, 0).mean()

    analytic = bs_call(S0, K, r, sigma, T)
    print(f"IS price:    {price_is:.6f}  SE={se_is:.7f}")
    print(f"Naive MC:    {price_plain:.6f}")
    print(f"Analytic:    {analytic:.6f}")

# Deep OTM: S=100, K=150, 6 months
mc_otm_call_is(100, 150, 0.05, 0.20, 0.5)`,
    explanation: "For a deep OTM option only 1 in 1000 naive paths contribute to the payoff estimate, making the estimator noisy. Importance sampling shifts the log-normal mean so most paths land near the strike, then corrects the bias with the likelihood ratio dP/dQ. The optimal shift (theta ≈ d2) is the Black-Scholes d2 parameter, reducing standard error by 10-100x for deep OTM options."
  },
  {
    id: "pyfin-20260806-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula for Correlated Default Simulation",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_defaults(
    n_names: int,
    n_paths: int,
    survival_probs: np.ndarray,  # 1-year survival prob per name
    corr_matrix: np.ndarray,
    seed: int = 42
) -> np.ndarray:
    """
    Li (2000) Gaussian copula: simulate correlated defaults.
    Each name i defaults if its copula variable U_i < 1 - survival_prob_i.
    The copula introduces dependency via a common factor Cholesky structure.
    """
    rng = np.random.default_rng(seed)

    # Cholesky decomposition for correlated standard normals
    L = np.linalg.cholesky(corr_matrix)  # L @ L.T = Sigma

    # Draw n_paths × n_names standard normals, then correlate
    Z = rng.standard_normal((n_paths, n_names))  # i.i.d.
    X = Z @ L.T                                   # correlated normals

    # Map to uniform via N(0,1) CDF
    U = norm.cdf(X)  # shape (n_paths, n_names)

    # Default threshold: name i defaults if U_i < default_prob_i
    default_probs = 1 - survival_probs
    defaults = U < default_probs[None, :]  # broadcast

    return defaults

# 5-name CDO basket: 3% annual default prob each, 30% pairwise correlation
n = 5
rho = 0.30
corr = np.full((n, n), rho)
np.fill_diagonal(corr, 1.0)

surv = np.array([0.97] * n)
defs = gaussian_copula_defaults(n, 100_000, surv, corr)

# CDO tranche loss analysis
n_defaults = defs.sum(axis=1)
print("Expected defaults:        ", n_defaults.mean())
print("Prob(>=2 defaults):       ", (n_defaults >= 2).mean())
print("Prob(all 5 default):      ", (n_defaults == 5).mean())
print("Loss correlation [0,1]:   ", np.corrcoef(defs[:,0], defs[:,1])[0,1])`,
    explanation: "The Gaussian copula separates marginal default probabilities from joint dependence: each name's default threshold is derived from its CDS-implied survival probability, while the Cholesky-correlated normals inject the desired pairwise correlation. The 2008 financial crisis revealed that this model underestimates tail correlation (joint defaults spike in stress), which the t-copula with low degrees of freedom models better."
  },
  {
    id: "pyfin-20260806-b1-t-copula",
    language: "python",
    title: "Student-t Copula for Heavy-Tailed Joint Default Simulation",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm, t as t_dist, chi2

def t_copula_defaults(
    n_names: int,
    n_paths: int,
    survival_probs: np.ndarray,
    corr_matrix: np.ndarray,
    df: float = 5.0,    # degrees of freedom — lower = fatter tails
    seed: int = 42
) -> np.ndarray:
    """
    Student-t copula: Gaussian + a shared chi2 shock that inflates all
    correlations simultaneously, creating tail dependence the Gaussian lacks.
    """
    rng = np.random.default_rng(seed)
    L   = np.linalg.cholesky(corr_matrix)

    # Step 1: correlated Gaussian
    Z = rng.standard_normal((n_paths, n_names)) @ L.T

    # Step 2: chi2 scaling — same W applied to all names (systematic tail risk)
    W = rng.chisquare(df, size=n_paths) / df  # shape (n_paths,)
    X = Z / np.sqrt(W[:, None])               # multivariate t

    # Step 3: map to uniform via t CDF (df degrees of freedom)
    U = t_dist.cdf(X, df=df)

    # Step 4: default if U_i < default_prob_i
    default_probs = 1 - survival_probs
    return U < default_probs[None, :]

n = 5
rho = 0.30
corr = np.where(np.eye(n), 1.0, rho)
surv = np.array([0.97] * n)

# Compare Gaussian vs t-copula tail dependence
from python_finance_2026_08_06_b1_helper import gaussian_copula_defaults  # conceptual
defs_t = t_copula_defaults(n, 100_000, surv, corr, df=4.0)
n_defs = defs_t.sum(axis=1)
print(f"t-copula (df=4): E[defaults]={n_defs.mean():.3f}")
print(f"P(>=4 defaults)={( n_defs >= 4).mean():.5f}  (much higher than Gaussian)")`,
    explanation: "The t-copula adds a shared chi-squared shock W that scales all correlated Gaussian draws simultaneously: in stress scenarios W is small, making all t-variates simultaneously extreme — this is tail dependence. The Gaussian copula has zero tail dependence (extreme events are asymptotically independent), so it drastically underestimates simultaneous default probabilities in stress."
  },
  {
    id: "pyfin-20260806-b1-evt-tail",
    language: "python",
    title: "Extreme Value Theory: GPD Tail Fitting for Tail VaR",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses: np.ndarray, threshold_quantile: float = 0.90):
    """
    Peaks-over-Threshold (POT) method: fit a Generalized Pareto Distribution
    to losses exceeding a high threshold u.
    GPD CDF: F(x) = 1 - (1 + xi*x/sigma)^(-1/xi)  for xi != 0
    """
    u = np.quantile(losses, threshold_quantile)
    exceedances = losses[losses > u] - u  # excess losses over threshold

    # MLE fit via scipy
    xi, loc, sigma = genpareto.fit(exceedances, floc=0)
    print(f"GPD fit: xi={xi:.4f} (shape), sigma={sigma:.4f} (scale), u={u:.4f}")
    print(f"Tail sample size: {len(exceedances)} of {len(losses)}")

    def var_gpd(q):
        """VaR at confidence q using GPD extrapolation."""
        Fu  = threshold_quantile  # P(loss <= u)
        n_u = len(exceedances)
        n   = len(losses)
        # P(X > VaR_q) = 1 - q  =>  P(X > u) * P(X > VaR | X > u) = 1-q
        if xi == 0:
            return u + sigma * np.log((1-Fu)/(1-q))
        return u + sigma/xi * (((1-Fu)/(1-q))**xi - 1)

    def cvar_gpd(q):
        """Expected Shortfall using GPD tail."""
        v = var_gpd(q)
        excess_over_var = (v - u)
        if xi >= 1: return np.inf
        return v/(1-xi) + (sigma - xi*u)/(1-xi)

    for conf in [0.95, 0.99, 0.999]:
        print(f"  VaR({conf:.1%}):  {var_gpd(conf):.4f}   CVaR: {cvar_gpd(conf):.4f}")

# Simulate fat-tailed P&L losses (Student-t with df=3)
rng = np.random.default_rng(42)
losses = np.abs(rng.standard_t(df=3, size=5000) * 1000)
fit_gpd_tail(losses, threshold_quantile=0.90)`,
    explanation: "The Peaks-over-Threshold method fits a Generalized Pareto Distribution to the tail of the loss distribution beyond a high threshold u. The shape parameter xi determines tail heaviness: xi>0 (Fréchet, power-law tail as in equity returns), xi=0 (Gumbel, exponential tail), xi<0 (Weibull, bounded). Historical VaR cannot extrapolate beyond the sample maximum; GPD provides a parametric extrapolation into the extreme tail."
  },
  {
    id: "pyfin-20260806-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading with Time-Varying Hedge Ratio",
    tag: "stat-arb",
    code: `import numpy as np

def kalman_pairs_filter(y: np.ndarray, x: np.ndarray,
                        delta: float = 1e-4, R: float = 1e-3):
    """
    Online Kalman filter for dynamic hedge ratio in pairs trading.
    State: beta_t (hedge ratio), treated as a random walk.
    Observation: y_t = alpha + beta_t * x_t + epsilon_t

    delta: process noise (how fast beta drifts)
    R:     observation noise variance
    """
    n = len(y)
    # State: [alpha, beta]
    beta  = np.zeros((n, 2))    # posterior mean
    P     = np.zeros((n, 2, 2)) # posterior covariance
    Q     = delta / (1 - delta) * np.eye(2)  # process noise covariance

    # Priors
    beta[0] = [0.0, 1.0]
    P[0]    = np.eye(2)

    spread = np.zeros(n)

    for t in range(1, n):
        # Predict
        beta_pred = beta[t-1]          # random-walk prior
        P_pred    = P[t-1] + Q         # covariance grows with time

        # Observation design matrix: y_t = F_t @ beta_t
        F = np.array([1.0, x[t]])

        # Innovation
        y_pred = F @ beta_pred
        S_inn  = F @ P_pred @ F + R    # innovation variance
        spread[t] = y[t] - y_pred      # raw spread

        # Kalman gain
        K_gain = P_pred @ F / S_inn

        # Update
        beta[t] = beta_pred + K_gain * spread[t]
        P[t]    = (np.eye(2) - np.outer(K_gain, F)) @ P_pred

    z_score = spread / np.sqrt(np.array([P[t][1,1] for t in range(n)]) + R)
    return beta, spread, z_score

# Simulate cointegrated pair
rng = np.random.default_rng(42)
n = 500
x = np.cumsum(rng.standard_normal(n)) + 100
y = 1.5 * x + 5 + rng.standard_normal(n) * 2  # beta=1.5, alpha=5

betas, spread, zscore = kalman_pairs_filter(y, x)
print(f"Final hedge ratio: alpha={betas[-1,0]:.2f}, beta={betas[-1,1]:.2f}")
print(f"Spread std: {spread[50:].std():.4f}")
# Signal: enter when |z-score| > 2, exit when |z-score| < 0.5
entries = (np.abs(zscore) > 2).sum()
print(f"Entry signals: {entries}")`,
    explanation: "The Kalman filter treats the hedge ratio as a hidden state that evolves as a random walk, continuously updated by new price observations. The delta parameter controls the process noise: small delta (0.0001) means beta drifts slowly (stable pair), while large delta (0.01) adapts quickly but introduces noise. This outperforms OLS which assumes a constant beta over the full lookback window."
  },
  {
    id: "pyfin-20260806-b1-hull-white-mc",
    language: "python",
    title: "Hull-White Short Rate Model: Monte Carlo Bond Pricing",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.interpolate import interp1d

def hull_white_mc(
    T_maturities: list,
    a: float,         # mean reversion speed
    sigma_hw: float,  # short-rate volatility
    initial_curve: dict,  # {maturity: zero_rate}
    n_paths: int = 20_000,
    n_steps: int = 252,
    seed: int = 42
):
    """
    Hull-White (Extended Vasicek) one-factor model:
    dr_t = (theta_t - a*r_t)dt + sigma*dW_t
    theta_t fitted to match initial yield curve exactly.
    """
    rng   = np.random.default_rng(seed)
    T_max = max(T_maturities)
    dt    = T_max / n_steps
    sqdt  = np.sqrt(dt)

    # Interpolate initial forward rates
    mats  = sorted(initial_curve.keys())
    rates = [initial_curve[m] for m in mats]
    r_interp = interp1d(mats, rates, fill_value='extrapolate')

    # Finite-difference approximation of df/dT (instantaneous forward rate)
    def fwd_rate(t):
        eps = 1e-5
        r1, r2 = r_interp(max(t-eps, 1e-6)), r_interp(t+eps)
        R1 = r_interp(max(t-eps, 1e-6))
        R2 = r_interp(t+eps)
        # f(t) = d/dt [t * R(t)]
        return R2 + (t+eps)*(R2-R1)/(2*eps)

    # Initial short rate
    r0 = r_interp(0.01)

    # Simulate paths
    r = np.full(n_paths, r0)
    results = {}

    step = 0
    for T_target in sorted(T_maturities):
        target_step = int(T_target / dt)
        disc_factors = np.ones(n_paths)

        while step < target_step:
            t = step * dt
            f_t  = fwd_rate(t)
            f_dt = fwd_rate(t + dt)
            # theta(t) = df/dt + a*f(t) + sigma^2/(2a)*(1-exp(-2a*t))
            theta = (f_dt - f_t)/dt + a*f_t + sigma_hw**2/(2*a)*(1 - np.exp(-2*a*t))
            dW    = rng.standard_normal(n_paths) * sqdt
            r_new = r + (theta - a*r)*dt + sigma_hw*dW
            disc_factors *= np.exp(-0.5*(r + r_new)*dt)
            r = r_new
            step += 1

        results[T_target] = disc_factors.mean()

    return results

curve = {0.5: 0.04, 1: 0.042, 2: 0.045, 5: 0.048, 10: 0.05}
prices = hull_white_mc([1, 2, 5], a=0.1, sigma_hw=0.01,
                       initial_curve=curve, n_paths=10_000)
for T, P in prices.items():
    implied_rate = -np.log(P) / T
    print(f"T={T}y: bond price={P:.6f}  implied rate={implied_rate:.4f}")`,
    explanation: "Hull-White is a no-arbitrage extension of Vasicek: theta(t) is calibrated so that the simulated bond prices exactly match today's observed yield curve at t=0. This is the key advantage over Vasicek (constant theta=a*b): Hull-White fits the initial term structure by construction, making it suitable for pricing interest rate derivatives relative to market."
  },
  {
    id: "pyfin-20260806-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel-Svensson Term Structure Fitting",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tau, beta0, beta1, beta2, lambda1):
    """Nelson-Siegel zero curve: R(tau) = beta0 + beta1*f1 + beta2*f2."""
    x = tau / lambda1
    f1 = (1 - np.exp(-x)) / x
    f2 = f1 - np.exp(-x)
    return beta0 + beta1*f1 + beta2*f2

def svensson(tau, beta0, beta1, beta2, beta3, lambda1, lambda2):
    """Svensson extension: adds a second hump term."""
    x1 = tau / lambda1
    x2 = tau / lambda2
    f1 = (1 - np.exp(-x1)) / x1
    f2 = f1 - np.exp(-x1)
    f3 = (1 - np.exp(-x2)) / x2 - np.exp(-x2)
    return beta0 + beta1*f1 + beta2*f2 + beta3*f3

def fit_svensson(maturities, yields):
    """Fit Svensson by minimizing sum of squared yield errors."""
    mats = np.array(maturities)
    ylds = np.array(yields)

    def objective(params):
        b0, b1, b2, b3, l1, l2 = params
        if l1 <= 0 or l2 <= 0 or l1 == l2: return 1e9
        fitted = svensson(mats, b0, b1, b2, b3, l1, l2)
        return np.sum((fitted - ylds)**2)

    # Multiple starts to avoid local minima
    best_res = None
    for l1_init in [0.5, 1.0, 2.0]:
        for l2_init in [3.0, 5.0, 10.0]:
            x0 = [0.04, -0.02, 0.02, 0.01, l1_init, l2_init]
            res = minimize(objective, x0, method='Nelder-Mead',
                          options={'xatol': 1e-8, 'maxiter': 10000})
            if best_res is None or res.fun < best_res.fun:
                best_res = res

    b0, b1, b2, b3, l1, l2 = best_res.x
    fitted = svensson(mats, b0, b1, b2, b3, l1, l2)
    rmse = np.sqrt(np.mean((fitted - ylds)**2)) * 10000  # in bps
    return {'params': best_res.x, 'fitted': fitted, 'rmse_bps': rmse}

# US Treasury yield curve
maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]
yields     = [0.053, 0.052, 0.050, 0.047, 0.046, 0.044, 0.045, 0.046, 0.048, 0.047]
result = fit_svensson(maturities, yields)
print(f"RMSE: {result['rmse_bps']:.2f} bps")
for m, y, f in zip(maturities, yields, result['fitted']):
    print(f"  {m:4.2f}y: market={y*100:.3f}%  fit={f*100:.3f}%")`,
    explanation: "Nelson-Siegel decomposes the yield curve into three components: beta0 (long-run level), beta1 (short-rate slope, beta1<0 means inverted curve), beta2 (medium-term hump). Svensson adds a second hump with lambda2 to capture the common double-humped shape. Central banks (ECB, Fed) use these fits to strip forward rates and compute DV01 exposure to curve shape factors."
  },
  {
    id: "pyfin-20260806-b1-cds-hazard",
    language: "python",
    title: "CDS Pricing via Bootstrapped Hazard Rates",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_price(hazard_rates, payment_dates, discount_factors,
              recovery: float = 0.40, spread: float = 0.01):
    """
    Value a CDS given a piecewise-constant hazard rate curve.
    PV(protection leg) - PV(fee leg) = 0 at fair spread.
    """
    n = len(payment_dates)
    # Survival probabilities from hazard rates (piecewise flat)
    surv = np.ones(n + 1)
    prev_t = 0.0
    for i, (t, h) in enumerate(zip(payment_dates, hazard_rates)):
        surv[i+1] = surv[i] * np.exp(-h * (t - prev_t))
        prev_t = t

    # Fee leg: spread × notional × delta × survival × discount
    pv_fee = 0.0
    for i in range(n):
        dt = payment_dates[i] - (payment_dates[i-1] if i > 0 else 0)
        pv_fee += spread * dt * 0.5*(surv[i] + surv[i+1]) * discount_factors[i]

    # Protection leg: (1-R) × integral of h(t)*S(t)*D(t) dt
    pv_prot = 0.0
    prev_t = 0.0
    for i, (t, h) in enumerate(zip(payment_dates, hazard_rates)):
        # Midpoint approximation
        t_mid = 0.5 * (prev_t + t)
        s_mid = 0.5 * (surv[i] + surv[i+1])
        d_mid = np.interp(t_mid, payment_dates, discount_factors)
        pv_prot += (1 - recovery) * h * s_mid * d_mid * (t - prev_t)
        prev_t = t

    return pv_prot - pv_fee

def bootstrap_hazard(maturities, cds_spreads, risk_free_rates,
                     recovery=0.40):
    """Bootstrap piecewise-constant hazard rates from CDS spreads."""
    n = len(maturities)
    hazards = []
    payment_dates = np.arange(0.25, maturities[-1] + 0.01, 0.25)
    discount_factors = np.exp(-np.interp(payment_dates, maturities, risk_free_rates)
                               * payment_dates)

    for i, (mat, spd) in enumerate(zip(maturities, cds_spreads)):
        def residual(h):
            h_curve = hazards + [h]
            # Hazard flat at h for remaining grid points
            h_full = np.interp(payment_dates[:int(mat/0.25)],
                               maturities[:i+1], h_curve + [h]*(n-i))
            return cds_price(h_full, payment_dates[:int(mat/0.25)],
                            discount_factors[:int(mat/0.25)], recovery, spd)
        h_star = brentq(residual, 1e-6, 0.5)
        hazards.append(h_star)
        print(f"CDS {mat}y: spread={spd*10000:.0f}bps  hazard={h_star*10000:.1f}bps")

    return hazards

maturities    = [1, 2, 3, 5]
cds_spreads   = [0.0050, 0.0075, 0.0100, 0.0130]  # 50, 75, 100, 130 bps
risk_free     = [0.04, 0.042, 0.044, 0.046]
bootstrap_hazard(maturities, cds_spreads, risk_free)`,
    explanation: "CDS pricing separates into a protection leg (PV of contingent payment on default) and a fee leg (PV of periodic spread payments conditional on survival). Bootstrapping inverts this: given the market CDS spread at each maturity, we solve for the hazard rate h_i that makes the CDS value zero, iteratively building a piecewise-constant survival probability curve. Under constant recovery R=40%, the implied hazard rate ≈ spread / (1-R)."
  },
  {
    id: "pyfin-20260806-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility Model: Monte Carlo Pricing",
    tag: "derivatives",
    code: `import numpy as np

def heston_mc_call(S0, K, r, T,
                   kappa, theta, xi, rho, v0,
                   n_paths=50_000, n_steps=252, seed=42):
    """
    Heston (1993): dS = r*S dt + sqrt(v)*S dW1
                   dv = kappa*(theta-v) dt + xi*sqrt(v) dW2
    Corr(dW1, dW2) = rho
    Uses the full-truncation Euler-Maruyama scheme (Lord et al. 2010).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / n_steps
    sqdt = np.sqrt(dt)
    disc = np.exp(-r * T)

    S = np.full(n_paths, S0, dtype=float)
    v = np.full(n_paths, v0, dtype=float)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rng.standard_normal(n_paths)
        W1 = Z1
        W2 = rho * Z1 + np.sqrt(1 - rho**2) * Z2  # correlated BM

        v_pos = np.maximum(v, 0)  # full-truncation: replace negative v with 0
        v_new = v + kappa*(theta - v_pos)*dt + xi*np.sqrt(v_pos)*sqdt*W2
        S = S * np.exp((r - 0.5*v_pos)*dt + np.sqrt(v_pos)*sqdt*W1)
        v = v_new

    payoff = np.maximum(S - K, 0)
    price  = disc * payoff.mean()
    se     = disc * payoff.std() / np.sqrt(n_paths)
    return price, se

# Heston parameters: kappa=2 (fast reversion), theta=0.04 (long-run var),
# xi=0.3 (vol-of-vol), rho=-0.7 (equity skew), v0=0.04 (init var=20% vol)
price, se = heston_mc_call(
    S0=100, K=100, r=0.05, T=1.0,
    kappa=2.0, theta=0.04, xi=0.3, rho=-0.7, v0=0.04
)
print(f"Heston call price: {price:.4f} ± {se:.4f}")
# Compare with BS at ATM vol sqrt(theta) ≈ 20%: ~10.45
# Heston will differ due to vol smile contribution`,
    explanation: "The full-truncation scheme (replacing negative variance with 0 for drift/diffusion while still advancing the state) avoids the instability of the Euler-Milstein scheme for Heston, which can produce negative variances. Negative rho (rho=-0.7) generates the equity implied vol skew: when S falls, v rises (correlation effect), making OTM puts expensive relative to Black-Scholes."
  },
  {
    id: "pyfin-20260806-b1-local-vol",
    language: "python",
    title: "Dupire Local Volatility from Implied Vol Surface",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.stats import norm

def black_scholes_call(S, K, r, sigma, T):
    if T <= 0 or sigma <= 0: return max(S - K * np.exp(-r*T), 0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def dupire_local_vol(S0, r, strikes_grid, maturities_grid, iv_surface):
    """
    Dupire (1994): sigma_loc^2(K, T) = (dC/dT + r*K*dC/dK) /
                                        (0.5 * K^2 * d2C/dK2)
    where C(K,T) is the undiscounted call price surface.
    """
    # Compute call price surface from IV surface
    K_grid = np.array(strikes_grid)
    T_grid = np.array(maturities_grid)
    C = np.zeros((len(T_grid), len(K_grid)))
    for i, T in enumerate(T_grid):
        for j, K in enumerate(K_grid):
            sigma = iv_surface[i, j]
            C[i, j] = black_scholes_call(S0, K, r, sigma, T)

    # Smooth interpolation over (K, T) grid
    spline = RectBivariateSpline(T_grid, K_grid, C, kx=3, ky=3)

    # Dupire formula on interior grid
    local_vols = np.zeros_like(C)
    dT = 1e-4
    dK = 1e-2

    for i, T in enumerate(T_grid[1:-1], start=1):
        for j, K in enumerate(K_grid[1:-1], start=1):
            c  = spline(T, K)[0,0]
            dC_dT  = (spline(T+dT, K)[0,0] - spline(T-dT, K)[0,0]) / (2*dT)
            dC_dK  = (spline(T, K+dK)[0,0] - spline(T, K-dK)[0,0]) / (2*dK)
            d2C_dK2= (spline(T, K+dK)[0,0] - 2*c + spline(T, K-dK)[0,0]) / dK**2
            numerator   = dC_dT + r*K*dC_dK
            denominator = 0.5 * K**2 * d2C_dK2
            if denominator > 1e-10:
                local_vols[i,j] = np.sqrt(max(numerator/denominator, 0))

    return local_vols

# Construct a simple smile surface
strikes   = np.linspace(80, 120, 9)
maturities= np.array([0.25, 0.5, 1.0, 2.0])
# Skewed smile: OTM puts (low K) have higher IV
iv_surface = np.array([
    [0.30,0.27,0.24,0.21,0.20,0.20,0.21,0.23,0.25],
    [0.29,0.26,0.23,0.21,0.20,0.20,0.21,0.22,0.24],
    [0.28,0.25,0.22,0.20,0.19,0.19,0.20,0.21,0.23],
    [0.27,0.24,0.21,0.19,0.18,0.18,0.19,0.20,0.22],
])

lv = dupire_local_vol(S0=100, r=0.05, strikes_grid=strikes,
                       maturities_grid=maturities, iv_surface=iv_surface)
print("Local vol surface (interior):")
for i in range(1, len(maturities)-1):
    row = [f"{v:.3f}" for v in lv[i, 1:-1]]
    print(f"  T={maturities[i]}: {row}")`,
    explanation: "Dupire's local vol is the unique diffusion sigma_loc(S,t) that prices all European options consistently with the observed implied vol surface — it's the 'market-consistent' volatility. The formula is a PDE inversion: given call prices as a function of (K,T), local vol at (K,T) is recovered via partial derivatives. Numerically, a smooth spline interpolation of the call surface is essential to avoid noisy second derivatives."
  },
  {
    id: "pyfin-20260806-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Binomial Tree for Cap Pricing",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import brentq

def bdt_tree(n_periods: int, dt: float, market_yields: list, sigmas: list):
    """
    BDT: log-normal short rate model calibrated to market yield curve.
    At each node: r_up = r_dn * exp(2 * sigma * sqrt(dt))
    Calibrate median rates by matching zero-coupon bond prices.
    """
    # r[t][j] = short rate at time t, j-th node (j=0 is lowest)
    r = [[None]*(t+1) for t in range(n_periods)]
    Q = [[None]*(t+1) for t in range(n_periods)]  # Arrow-Debreu prices

    # Period 0
    r[0][0] = market_yields[0]  # initial rate
    Q[0][0] = 1.0

    for t in range(1, n_periods):
        sigma = sigmas[min(t, len(sigmas)-1)]
        target_price = np.exp(-market_yields[t] * (t+1) * dt)

        def tree_price(r_low):
            # Build r[t] from r_low using log-normal spacing
            r_t = [r_low * np.exp(2*sigma*np.sqrt(dt)*j) for j in range(t+1)]
            # Compute Arrow-Debreu prices for period t
            Q_t = [0.0] * (t+1)
            for j in range(t):
                df = 1.0 / (1 + r[t-1][j]*dt)
                Q_t[j]   += 0.5 * Q[t-1][j] * df
                Q_t[j+1] += 0.5 * Q[t-1][j] * df
            # Price zero-coupon bond maturing at t+1
            bond_price = sum(Q_t[j] / (1 + r_t[j]*dt) for j in range(t+1))
            return bond_price - target_price

        r_low = brentq(tree_price, 1e-6, 0.5, xtol=1e-9)
        r[t] = [r_low * np.exp(2*sigmas[t-1]*np.sqrt(dt)*j) for j in range(t+1)]
        # Update Arrow-Debreu prices
        Q_t = [0.0] * (t+1)
        for j in range(t):
            df = 1.0 / (1 + r[t-1][j]*dt)
            Q_t[j]   += 0.5 * Q[t-1][j] * df
            Q_t[j+1] += 0.5 * Q[t-1][j] * df
        Q[t] = Q_t

    return r, Q

# Price an interest rate cap (series of caplets) at strike K
def cap_price(r_tree, Q_tree, strike, dt, notional=1.0):
    n = len(r_tree)
    pv = 0.0
    for t in range(1, n):
        # Caplet pays max(r_{t-1} - K, 0) * dt at t
        for j in range(t):
            if Q_tree[t-1][j] is None or r_tree[t-1][j] is None: continue
            payoff = max(r_tree[t-1][j] - strike, 0) * dt
            df = 1.0 / (1 + r_tree[t-1][j]*dt)
            pv += Q_tree[t-1][j] * payoff * df * notional
    return pv

n = 5
market_yields = [0.04, 0.042, 0.044, 0.046, 0.048]
sigmas        = [0.15] * n
r_tree, Q_tree = bdt_tree(n, 1.0, market_yields, sigmas)

print("BDT Rate Tree (selected nodes):")
for t in range(n):
    rates = [f"{r:.4f}" for r in r_tree[t] if r is not None]
    print(f"  t={t}: {rates}")

cap = cap_price(r_tree, Q_tree, strike=0.045, dt=1.0)
print(f"Cap price (K=4.5%): {cap:.6f}")`,
    explanation: "BDT is a log-normal short-rate tree calibrated to both the yield curve (via the median rate at each node) and implied volatility (via the log-normal spacing factor sigma). Arrow-Debreu prices Q[t][j] represent the present value of a security paying 1 only at node (t,j), enabling efficient pricing of any path-dependent payoff without re-traversing the tree."
  },
  {
    id: "pyfin-20260806-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Model: OLS Factor Exposure Estimation",
    tag: "factor-models",
    code: `import numpy as np
from scipy import stats

def fama_french_ols(excess_returns: np.ndarray,
                    mkt_rf: np.ndarray,
                    smb: np.ndarray,
                    hml: np.ndarray):
    """
    Estimate alpha, beta_mkt, beta_smb, beta_hml via OLS.
    R_i - R_f = alpha + beta_mkt*(R_m-R_f) + beta_smb*SMB + beta_hml*HML + e

    Returns: coefficients, t-stats, R-squared, residuals
    """
    n = len(excess_returns)
    X = np.column_stack([np.ones(n), mkt_rf, smb, hml])  # design matrix
    y = excess_returns

    # OLS: beta = (X'X)^-1 X'y
    XtX = X.T @ X
    Xty = X.T @ y
    beta = np.linalg.solve(XtX, Xty)

    # Residuals and standard errors
    y_hat = X @ beta
    e     = y - y_hat
    sigma2 = e @ e / (n - 4)  # 4 params

    # Covariance matrix of coefficients
    cov_beta = sigma2 * np.linalg.inv(XtX)
    se = np.sqrt(np.diag(cov_beta))
    t_stats = beta / se
    p_values = 2 * (1 - stats.t.cdf(np.abs(t_stats), df=n-4))

    ss_tot = np.sum((y - y.mean())**2)
    ss_res = e @ e
    r2 = 1 - ss_res / ss_tot
    adj_r2 = 1 - (1-r2)*(n-1)/(n-4)

    labels = ['alpha', 'beta_mkt', 'beta_smb', 'beta_hml']
    print(f"{'Factor':<12} {'Coef':>8} {'SE':>8} {'t-stat':>8} {'p-value':>8}")
    for lbl, b, s, t, p in zip(labels, beta, se, t_stats, p_values):
        print(f"{lbl:<12} {b:>8.4f} {s:>8.4f} {t:>8.2f} {p:>8.4f}")
    print(f"R2={r2:.4f}  Adj-R2={adj_r2:.4f}  sigma={np.sqrt(sigma2)*np.sqrt(252):.4f}")
    return {'beta': beta, 't_stats': t_stats, 'r2': r2, 'residuals': e}

# Simulate a growth stock: high market beta, negative HML (growth not value)
rng = np.random.default_rng(42)
n = 252  # 1 year daily
mkt_rf  = rng.normal(0.0004, 0.012, n)
smb     = rng.normal(0.0001, 0.006, n)
hml     = rng.normal(0.0001, 0.005, n)
true_beta = np.array([0.0002, 1.20, 0.30, -0.50])  # alpha, mkt, smb, hml
excess_r  = (np.column_stack([np.ones(n), mkt_rf, smb, hml]) @ true_beta
             + rng.normal(0, 0.005, n))

fama_french_ols(excess_r, mkt_rf, smb, hml)`,
    explanation: "Fama-French decomposes return into market risk (beta_mkt), size premium (SMB: small-minus-big), and value premium (HML: high-minus-low book-to-market). A stock with positive alpha earns return unexplained by these three systematic risk factors — the basis for active management. Negative HML exposure (growth stocks) historically earns lower expected returns under FF3 because growth stocks command lower risk premia."
  },
  {
    id: "pyfin-20260806-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly for Position Sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_continuous(mu: float, sigma: float, r: float = 0.0) -> float:
    """
    Kelly fraction for continuous log-normal returns.
    f* = (mu - r) / sigma^2  (excess return / variance)
    """
    return (mu - r) / sigma**2

def kelly_discrete(win_prob: float, win_return: float, loss_return: float) -> float:
    """
    Kelly fraction for binary bets.
    f* = p/a - q/b  where p=win_prob, a=loss_fraction, b=win_fraction
    """
    p = win_prob
    q = 1 - p
    # Assumes: win → +win_return*f, lose → -loss_return*f
    return p / loss_return - q / win_return

def fractional_kelly_portfolio(expected_returns: np.ndarray,
                                cov_matrix: np.ndarray,
                                risk_free: float = 0.0,
                                kelly_fraction: float = 0.25):
    """
    Markowitz-Kelly: maximize log(1 + f * portfolio_return).
    For small f: equivalent to max E[R] - (1/(2f))*Var[R].
    Full Kelly f*=1 is often too volatile; fractional Kelly (0.25) is practical.
    """
    n = len(expected_returns)
    excess = expected_returns - risk_free

    # Full Kelly weights: f* = Sigma^-1 * (mu - r)
    sigma_inv = np.linalg.inv(cov_matrix)
    w_kelly = sigma_inv @ excess

    # Normalize so that |w|_1 = 1 (optional: leverage control)
    w_full = w_kelly / np.sum(np.abs(w_kelly))
    w_frac = kelly_fraction * w_full  # fractional Kelly

    def portfolio_stats(w):
        ret = w @ expected_returns
        var = w @ cov_matrix @ w
        sharpe = (ret - risk_free) / np.sqrt(var) if var > 0 else 0
        return ret, var, sharpe

    r_f, v_f, s_f = portfolio_stats(w_full)
    r_q, v_q, s_q = portfolio_stats(w_frac)
    print(f"Full Kelly:       ret={r_f:.4f}  vol={np.sqrt(v_f):.4f}  Sharpe={s_f:.2f}")
    print(f"Quarter Kelly:    ret={r_q:.4f}  vol={np.sqrt(v_q):.4f}  Sharpe={s_q:.2f}")
    print(f"Full Kelly weights: {np.round(w_full, 3)}")
    return w_frac

# 3-asset example
mu  = np.array([0.12, 0.08, 0.06])
cov = np.array([[0.04, 0.012, 0.005],
                [0.012, 0.025, 0.008],
                [0.005, 0.008, 0.016]])
fractional_kelly_portfolio(mu, cov, risk_free=0.04, kelly_fraction=0.25)

# Binary bet example
f = kelly_discrete(win_prob=0.55, win_return=1.0, loss_return=1.0)
print(f"\\nBinary Kelly fraction: {f:.4f} = {f*100:.1f}% of bankroll")`,
    explanation: "Full Kelly maximises the long-run geometric growth rate but leads to severe drawdowns (up to 50% for a 50% confidence signal). Fractional Kelly (quarter-Kelly is common) retains most of the growth rate advantage while reducing volatility quadratically: half-Kelly gives 75% of the growth rate at 50% of the volatility, an attractive tradeoff in practice."
  },
  {
    id: "pyfin-20260806-b1-market-impact",
    language: "python",
    title: "Almgren-Chriss Market Impact and Optimal Execution",
    tag: "execution",
    code: `import numpy as np
from scipy.optimize import minimize

def almgren_chriss_cost(
    order_qty: float,
    price: float,
    daily_volume: float,
    daily_vol: float,     # daily return volatility
    T: float,             # time horizon (days)
    n_trades: int,        # number of child orders
    eta: float = 0.1,     # temporary impact: linear in trade rate
    gamma: float = 0.05,  # permanent impact: linear in qty traded
    lam: float = 1e-6,    # risk aversion parameter
):
    """
    Almgren-Chriss (2000) model: minimize E[Cost] + lambda * Var[Cost].

    Temporary impact: eta * (v_k / adv) per trade.
    Permanent impact: gamma * (v_k / adv) per trade (accumulated).
    TWAP is the naive strategy; A-C finds the optimal trajectory.
    """
    dt = T / n_trades
    adv = daily_volume

    # TWAP baseline: uniform slicing
    v_twap = np.full(n_trades, order_qty / n_trades)

    def total_cost(v):
        # Permanent impact (price drift): cumulative
        perm_cost = 0.0
        Q_remaining = order_qty
        for v_k in v:
            perm_cost += gamma * (v_k / adv) * Q_remaining
            Q_remaining -= v_k

        # Temporary impact (execution shortfall per trade)
        temp_cost = sum(eta * (v_k / adv) * v_k for v_k in v)

        # Market risk: variance of unexecuted inventory
        Q_t = order_qty - np.cumsum(v)
        risk = lam * (price * daily_vol)**2 * dt * np.sum(Q_t**2)

        return perm_cost + temp_cost + risk

    # Optimize trade schedule
    cons = [{'type': 'eq', 'fun': lambda v: v.sum() - order_qty}]
    bounds = [(0, order_qty)] * n_trades
    res = minimize(total_cost, v_twap, method='SLSQP',
                   bounds=bounds, constraints=cons,
                   options={'ftol': 1e-10})

    v_opt = res.x
    cost_twap = total_cost(v_twap)
    cost_opt  = total_cost(v_opt)
    bps_twap  = cost_twap / (price * order_qty) * 10000
    bps_opt   = cost_opt  / (price * order_qty) * 10000

    print(f"TWAP cost:    {bps_twap:.2f} bps")
    print(f"Optimal cost: {bps_opt:.2f} bps")
    print(f"Savings:      {bps_twap - bps_opt:.2f} bps")
    print(f"Optimal schedule (shares): {np.round(v_opt).astype(int)}")
    return v_opt

almgren_chriss_cost(
    order_qty=10_000, price=100, daily_volume=1_000_000,
    daily_vol=0.02, T=1.0, n_trades=10, lam=1e-6
)`,
    explanation: "Almgren-Chriss balances two costs: trading too fast amplifies market impact (especially temporary impact which decays), while trading too slow exposes the remaining inventory to market risk. The optimal solution is front-loaded for risk-averse traders (lam large) and approaches TWAP as lam→0. The closed-form solution uses a hyperbolic sine function; this numerical version generalises to nonlinear impact models."
  },
  {
    id: "pyfin-20260806-b1-regime-switching",
    language: "python",
    title: "2-State Regime-Switching (HMM) for Equity Returns",
    tag: "time-series",
    code: `import numpy as np
from scipy.stats import norm

def hmm_em_gaussian(returns: np.ndarray, n_states: int = 2,
                    n_iter: int = 100, seed: int = 42):
    """
    Hidden Markov Model via Baum-Welch (EM) for Gaussian-emission returns.
    State 0: low-vol bull regime. State 1: high-vol bear regime.
    """
    rng = np.random.default_rng(seed)
    T = len(returns)

    # Initialise parameters
    pi    = np.ones(n_states) / n_states               # initial state dist
    A     = np.array([[0.95, 0.05],[0.10, 0.90]])       # transition matrix
    mu    = np.array([0.001, -0.002])                   # emission means
    sigma = np.array([0.008, 0.025])                    # emission std devs

    for _ in range(n_iter):
        # E-step: forward-backward algorithm
        # Emission probabilities
        B = np.column_stack([norm.pdf(returns, mu[s], sigma[s]) for s in range(n_states)])
        B = np.maximum(B, 1e-300)

        # Forward: alpha[t, s] = P(o_1..o_t, q_t=s)
        alpha = np.zeros((T, n_states))
        alpha[0] = pi * B[0]
        for t in range(1, T):
            alpha[t] = (alpha[t-1] @ A) * B[t]
            alpha[t] /= alpha[t].sum() + 1e-300  # scale for numerical stability

        # Backward: beta[t, s] = P(o_{t+1}..o_T | q_t=s)
        beta = np.ones((T, n_states))
        for t in range(T-2, -1, -1):
            beta[t] = A @ (B[t+1] * beta[t+1])
            beta[t] /= beta[t].sum() + 1e-300

        # Posterior state probs
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True) + 1e-300

        # Transition posterior
        xi = np.zeros((T-1, n_states, n_states))
        for t in range(T-1):
            xi[t] = (alpha[t,:,None] * A * B[t+1][None,:] * beta[t+1][None,:])
            xi[t] /= xi[t].sum() + 1e-300

        # M-step: update parameters
        pi    = gamma[0]
        A     = xi.sum(0) / gamma[:-1].sum(0, keepdims=True).T + 1e-10
        A    /= A.sum(1, keepdims=True)
        for s in range(n_states):
            w      = gamma[:, s]
            mu[s]  = (w * returns).sum() / w.sum()
            sigma[s] = np.sqrt((w * (returns - mu[s])**2).sum() / w.sum())

    state_seq = gamma.argmax(axis=1)
    print(f"Bull regime (s=0): mu={mu[0]*252:.2%}  vol={sigma[0]*np.sqrt(252):.2%}")
    print(f"Bear regime (s=1): mu={mu[1]*252:.2%}  vol={sigma[1]*np.sqrt(252):.2%}")
    print(f"Transition matrix:\\n{A.round(3)}")
    print(f"Bull days: {(state_seq==0).sum()}, Bear days: {(state_seq==1).sum()}")
    return state_seq, gamma, mu, sigma, A

rng = np.random.default_rng(42)
bull_r = rng.normal(0.001, 0.008, 500)
bear_r = rng.normal(-0.002, 0.025, 200)
returns = np.concatenate([bull_r, bear_r, bull_r[:300]])
hmm_em_gaussian(returns)`,
    explanation: "The Baum-Welch algorithm is EM for HMMs: the E-step computes posterior state probabilities via the forward-backward algorithm in O(T·K²), and the M-step updates emission parameters as weighted moment estimates. The persistence parameters (A[0,0]=0.95, A[1,1]=0.90) reflect that regimes last on average 20 and 10 days respectively, typical for equity markets."
  },
  {
    id: "pyfin-20260806-b1-pca-factors",
    language: "python",
    title: "PCA Factor Model for Equity Returns Decomposition",
    tag: "factor-models",
    code: `import numpy as np
from sklearn.preprocessing import StandardScaler

def pca_factor_model(returns_matrix: np.ndarray, n_factors: int = 3):
    """
    Extract latent risk factors from a returns matrix via PCA.
    Returns matrix: shape (T, N) — T days, N assets.
    Factors explain common variation; residuals are idiosyncratic risk.
    """
    T, N = returns_matrix.shape

    # Center and standardize across assets
    R = returns_matrix - returns_matrix.mean(axis=0)

    # Covariance matrix (T x T for efficiency when T < N)
    if T < N:
        # Use economy SVD: R = U @ diag(s) @ Vt
        # Factors = columns of U, loadings = Vt rows
        U, s, Vt = np.linalg.svd(R / np.sqrt(T-1), full_matrices=False)
        eigenvalues = s**2
        factors     = U[:, :n_factors] * s[:n_factors]   # (T, k)
        loadings    = Vt[:n_factors, :]                    # (k, N)
    else:
        Sigma = R.T @ R / (T - 1)
        eigenvalues, eigenvectors = np.linalg.eigh(Sigma)
        idx = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]
        loadings    = eigenvectors[:, :n_factors].T        # (k, N)
        factors     = R @ eigenvectors[:, :n_factors]      # (T, k)

    # Variance explained
    total_var = eigenvalues.sum()
    var_ratio = eigenvalues[:n_factors] / total_var

    # Idiosyncratic returns (residuals)
    R_reconstructed = factors @ loadings
    residuals = R - R_reconstructed
    idiosyncratic_var = residuals.var(axis=0)

    print(f"Variance explained by {n_factors} factors:")
    for i, vr in enumerate(var_ratio):
        print(f"  PC{i+1}: {vr:.2%}  (cumulative: {var_ratio[:i+1].sum():.2%})")
    print(f"\\nFactor correlations (should be ~0 by construction):")
    F_corr = np.corrcoef(factors.T)
    print(np.round(F_corr, 3))
    print(f"\\nMean idiosyncratic vol (annualized): {idiosyncratic_var.mean()**0.5 * np.sqrt(252):.4f}")

    return factors, loadings, var_ratio, residuals

# Simulate 50 assets with 3 common factors
rng = np.random.default_rng(42)
T, N, K = 500, 50, 3
true_factors   = rng.standard_normal((T, K)) * [0.012, 0.008, 0.005]
true_loadings  = rng.standard_normal((K, N))
idio           = rng.standard_normal((T, N)) * 0.005
returns        = true_factors @ true_loadings + idio

pca_factor_model(returns, n_factors=3)`,
    explanation: "PCA on the returns covariance matrix extracts orthogonal factors ordered by explained variance. In equity markets, PC1 typically explains 30-40% of variance (market factor), PC2 captures sector rotation (e.g., growth vs value), and PC3 captures momentum. Using T < N assets makes the sample covariance rank-deficient, so SVD of the returns matrix is more numerically stable than eigendecomposition of Sigma."
  },
  {
    id: "pyfin-20260806-b1-cvxpy-portfolio",
    language: "python",
    title: "Mean-Variance Portfolio Optimization with cvxpy Constraints",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def mean_variance_optimize(
    mu: np.ndarray,
    Sigma: np.ndarray,
    risk_free: float = 0.04,
    max_position: float = 0.20,    # max weight per asset
    min_position: float = 0.0,     # no shorting by default
    sector_groups: dict = None,    # {group_id: [asset_indices]}
    max_sector: float = 0.40,      # max sector weight
    target_return: float = None,
):
    """
    Solve: min  w' Sigma w
    s.t.   w' mu >= target_return
           sum(w) = 1
           min_pos <= w_i <= max_pos
           sector constraints
    """
    n = len(mu)
    w = cp.Variable(n)

    # Objective: minimize portfolio variance
    port_var = cp.quad_form(w, Sigma)
    objective = cp.Minimize(port_var)

    constraints = [
        cp.sum(w) == 1,
        w >= min_position,
        w <= max_position,
    ]

    if target_return is not None:
        constraints.append(mu @ w >= target_return)

    if sector_groups:
        for group_id, indices in sector_groups.items():
            constraints.append(cp.sum(w[indices]) <= max_sector)

    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ['optimal', 'optimal_inaccurate']:
        print(f"Solver status: {prob.status}")
        return None

    w_opt = w.value
    port_ret  = mu @ w_opt
    port_vol  = np.sqrt(w_opt @ Sigma @ w_opt)
    port_sharpe = (port_ret - risk_free) / port_vol

    print(f"Portfolio return: {port_ret:.4f}")
    print(f"Portfolio vol:    {port_vol:.4f}")
    print(f"Sharpe ratio:     {port_sharpe:.4f}")
    print(f"Weights: {np.round(w_opt, 4)}")
    return w_opt

rng = np.random.default_rng(42)
n = 5
mu = rng.uniform(0.06, 0.15, n)
A  = rng.standard_normal((n, n))
Sigma = A.T @ A / n + np.eye(n) * 0.01

sectors = {0: [0, 1], 1: [2, 3], 2: [4]}
w = mean_variance_optimize(
    mu, Sigma, risk_free=0.04,
    max_position=0.30, min_position=0.0,
    sector_groups=sectors, max_sector=0.45,
    target_return=0.09,
)`,
    explanation: "cvxpy formulates the Markowitz problem as a disciplined convex program: cp.quad_form(w, Sigma) is a convex quadratic objective, and all constraints are affine, so the global minimum is guaranteed. The CLARABEL solver (default in cvxpy 1.3+) is an interior-point method that handles large-scale semidefinite programs; sector constraints model real-world investment policy constraints like UCITS fund limits."
  },
];
